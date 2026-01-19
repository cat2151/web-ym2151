#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <math.h>
#include <emscripten.h>
#include "opm.h"

#define SAMPLE_RATE 44100
#define DURATION_SEC 1
#define BUSY_CYCLES 128
// YM2151の標準的なマスタークロック
#define OPM_CLOCK 3579545

static opm_t chip;
static float *global_buffer = NULL;

void write_opm(uint8_t reg, uint8_t data) {
    int32_t dummy[2];
    uint8_t sh1, sh2, so;
    
    OPM_Write(&chip, 0, reg);
    // 書き込み時のWaitはチップのクロック単位で行うので変更なしでOK
    for (int i = 0; i < BUSY_CYCLES; i++) {
        OPM_Clock(&chip, dummy, &sh1, &sh2, &so);
    }
    
    OPM_Write(&chip, 1, data);
    for (int i = 0; i < BUSY_CYCLES; i++) {
        OPM_Clock(&chip, dummy, &sh1, &sh2, &so);
    }
}

void setup_sine_wave() {
    // 【修正1】リセットにはマスタークロックを渡す
    // ※ライブラリの仕様によりますが、通常はClockを渡して内部で分周比を計算させます
    OPM_Reset(&chip, OPM_CLOCK);
    
    write_opm(0x20, 0xC7); // RL=11, FB=0, CON=7
    
    write_opm(0x60, 0x00); // M1 TL=0 (Max)
    write_opm(0x68, 0x7F); // M2 TL=min
    write_opm(0x70, 0x7F); // C1 TL=min
    write_opm(0x78, 0x7F); // C2 TL=min
    
    write_opm(0x40, 0x01); // DT1=0, MUL=1
    write_opm(0x80, 0x1F); // KS=0, AR=31
    write_opm(0xA0, 0x00); // AMS-EN=0, D1R=0
    write_opm(0xC0, 0x00); // DT2=0, D2R=0
    write_opm(0xE0, 0x00); // D1L=0, RR=0
    
    // 【修正2】Key Code (KC) の修正
    // YM2151のNoteは 0=C#, 1=D, ... 8=A ... 11=C です。
    // A4 (440Hz) は Octave 4, Note A (8) なので 0x48 です。
    // 0x4D (Note 13) は無効値か、予期しない音程になります。
    write_opm(0x28, 0x48); // KC = A4
    write_opm(0x30, 0x00); // KF = 0 (微調整なし)
    
    write_opm(0x08, 0x78); // Key On
}

EMSCRIPTEN_KEEPALIVE
int generate_sine() {
    int total_samples = SAMPLE_RATE * DURATION_SEC;
    
    if (global_buffer) {
        free(global_buffer);
    }
    
    global_buffer = (float*)malloc(sizeof(float) * total_samples);
    
    setup_sine_wave();
    
    int32_t sample_buf[2];
    uint8_t sh1, sh2, so;
    
    // 【修正3】サンプリングレートに合わせてチップを回す
    // マスタークロック(3.58MHz) ÷ サンプリングレート(44.1kHz) ≒ 81.16 回
    double step = (double)OPM_CLOCK / SAMPLE_RATE;
    double time_acc = 0.0;
    
    for (int i = 0; i < total_samples; i++) {
        time_acc += step;
        
        // 必要な回数だけチップのクロックを進める
        while (time_acc >= 1.0) {
            OPM_Clock(&chip, sample_buf, &sh1, &sh2, &so);
            time_acc -= 1.0;
        }
        
        // 最新の出力を採用する（簡易的なリサンプリング）
        // ※より高品質にするにはループ内のsample_bufを平均化したりフィルタを通す必要があります
        global_buffer[i] = (sample_buf[0] + sample_buf[1]) / 2.0f;
    }
    
    // 以下、ノーマライズ処理など（変更なし）
    float max_amplitude = 0.0f;
    for (int i = 0; i < total_samples; i++) {
        float abs_sample = fabsf(global_buffer[i]);
        if (abs_sample > max_amplitude) {
            max_amplitude = abs_sample;
        }
    }
    
    if (max_amplitude > 0.0f) {
        float normalize_factor = 0.8f / max_amplitude;
        for (int i = 0; i < total_samples; i++) {
            global_buffer[i] *= normalize_factor;
        }
    }
    
    return total_samples;
}

// ...残りの関数はそのまま
EMSCRIPTEN_KEEPALIVE
float get_sample(int index) {
    if (global_buffer && index >= 0 && index < SAMPLE_RATE * DURATION_SEC) {
        return global_buffer[index];
    }
    return 0.0f;
}

EMSCRIPTEN_KEEPALIVE
void free_buffer() {
    if (global_buffer) {
        free(global_buffer);
        global_buffer = NULL;
    }
}
