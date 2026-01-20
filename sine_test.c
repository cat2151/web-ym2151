#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <math.h>
#include <emscripten.h>
#include "opm.h"

// --- 定数定義 ---
#define BUSY_CYCLES 128     
#define CLOCK_STEP 64       
#define OPM_CLOCK 3579545   

// サンプルレート (約55930Hz)
#define SAMPLE_RATE ((double)OPM_CLOCK / CLOCK_STEP)

// 1アクションあたりの待機サンプル数
#define SAMPLES_PER_ACCESS ((double)BUSY_CYCLES / CLOCK_STEP)

// --- データ構造 ---

typedef struct {
    float time;     
    uint8_t addr;   
    uint8_t data;   
    uint8_t pad[2]; 
} opm_event_t;

typedef struct {
    opm_event_t *events;          
    int count;                    
    int current_index;            
    double next_available_sample; 
    int pending_data_write;       
} sequencer_t;

// --- グローバル変数 ---
static opm_t chip;
static float *global_buffer = NULL;
static int global_total_floats = 0; // floatの総数（サンプル数 × 2）


// ============================================================
// 1. OPM Hardware Control
// ============================================================

static void opm_initialize() {
    OPM_Reset(&chip, OPM_CLOCK);
}

// 1サンプル分の処理を行い、L/Rの結果をポインタに返す
static void opm_render_stereo(float *out_l, float *out_r) {
    int32_t sample_buf[2];
    uint8_t sh1, sh2, so;
    
    // CLOCK_STEP分回す
    for (int j = 0; j < CLOCK_STEP; j++) {
        OPM_Clock(&chip, sample_buf, &sh1, &sh2, &so);
    }
    
    // OPMの出力を正規化して書き込み
    // ミックスせず、LとRを独立して返す
    *out_l = (float)sample_buf[0] / 32768.0f;
    *out_r = (float)sample_buf[1] / 32768.0f;
}


// ============================================================
// 2. Memory Management
// ============================================================

// ステレオなので、必要な「floatの個数」は num_frames * 2 になる点に注意
static int buffer_ensure_capacity(int num_floats) {
    if (global_buffer) {
        free(global_buffer);
    }
    
    global_buffer = (float*)malloc(sizeof(float) * num_floats);
    if (!global_buffer) {
        global_total_floats = 0;
        return 0;
    }
    
    global_total_floats = num_floats;
    return 1;
}


// ============================================================
// 3. Sequencer Logic
// ============================================================

static void sequencer_init(sequencer_t *seq, void *event_data_ptr, int event_count) {
    seq->events = (opm_event_t *)event_data_ptr;
    seq->count = event_count;
    seq->current_index = 0;
    seq->next_available_sample = 0.0;
    seq->pending_data_write = 0; 
}

static void sequencer_process(sequencer_t *seq, int current_sample_idx) {
    if (seq->current_index >= seq->count) {
        return;
    }

    opm_event_t *evt = &seq->events[seq->current_index];
    
    double trigger_sample = evt->time * SAMPLE_RATE;
    if ((double)current_sample_idx < trigger_sample) {
        return;
    }

    if ((double)current_sample_idx < seq->next_available_sample) {
        return;
    }

    if (seq->pending_data_write == 0) {
        OPM_Write(&chip, 0, evt->addr);
        seq->pending_data_write = 1;
        seq->next_available_sample = (double)current_sample_idx + SAMPLES_PER_ACCESS;
    } else {
        OPM_Write(&chip, 1, evt->data);
        seq->pending_data_write = 0;
        seq->current_index++;
        seq->next_available_sample = (double)current_sample_idx + SAMPLES_PER_ACCESS;
    }
}


// ============================================================
// 4. Main Orchestrator
// ============================================================

EMSCRIPTEN_KEEPALIVE
int generate_sound(void *event_data_ptr, int event_count, int num_samples) {
    if (num_samples <= 0) return 0;

    // 修正: ステレオなのでサンプル数×2倍のfloat領域を確保する
    if (!buffer_ensure_capacity(num_samples * 2)) return 0;

    opm_initialize();

    sequencer_t seq;
    sequencer_init(&seq, event_data_ptr, event_count);

    for (int i = 0; i < num_samples; i++) {
        sequencer_process(&seq, i);

        // ステレオで取得して書き込む
        float l, r;
        opm_render_stereo(&l, &r);

        // インターリーブ形式 (L, R, L, R...) で格納
        global_buffer[i * 2 + 0] = l;
        global_buffer[i * 2 + 1] = r;
    }
    
    // 生成したフレーム数(時間)を返す
    return num_samples;
}

// ------------------------------------------------------------
// JS Helper Functions
// ------------------------------------------------------------

EMSCRIPTEN_KEEPALIVE
float get_sample(int index) {
    // 範囲チェックは global_total_floats (確保した全要素数) で行う
    if (global_buffer && index >= 0 && index < global_total_floats) {
        return global_buffer[index];
    }
    return 0.0f;
}

EMSCRIPTEN_KEEPALIVE
void free_buffer() {
    if (global_buffer) {
        free(global_buffer);
        global_buffer = NULL;
        global_total_floats = 0;
    }
}
