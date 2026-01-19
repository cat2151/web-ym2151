#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <math.h>
#include <emscripten.h>
#include "opm.h"

#define BUSY_CYCLES 128
#define CLOCK_STEP 64
#define OPM_CLOCK 3579545
#define SAMPLE_RATE (OPM_CLOCK / CLOCK_STEP)  // 約55.9kHz

static opm_t chip;
static float *global_buffer = NULL;
static int global_total_samples = 0;

void write_opm(uint8_t reg, uint8_t data) {
    int32_t dummy[2];
    uint8_t sh1, sh2, so;
    
    OPM_Write(&chip, 0, reg);
    for (int i = 0; i < BUSY_CYCLES; i++) {
        OPM_Clock(&chip, dummy, &sh1, &sh2, &so);
    }
    
    OPM_Write(&chip, 1, data);
    for (int i = 0; i < BUSY_CYCLES; i++) {
        OPM_Clock(&chip, dummy, &sh1, &sh2, &so);
    }
}

// reg_data_pairsは [reg0, data0, reg1, data1, ...] の形式
EMSCRIPTEN_KEEPALIVE
int generate_sound(uint8_t *reg_data_pairs, int pair_count, int num_samples) {
    if (num_samples <= 0 || pair_count <= 0) {
        return 0;
    }
    
    if (global_buffer) {
        free(global_buffer);
    }
    
    global_buffer = (float*)malloc(sizeof(float) * num_samples);
    if (!global_buffer) {
        return 0;
    }
    
    global_total_samples = num_samples;
    
    // チップをリセット
    OPM_Reset(&chip, OPM_CLOCK);
    
    // レジスタ設定を順次書き込み
    for (int i = 0; i < pair_count; i++) {
        uint8_t reg = reg_data_pairs[i * 2];
        uint8_t data = reg_data_pairs[i * 2 + 1];
        write_opm(reg, data);
    }
    
    // 音声生成
    int32_t sample_buf[2];
    uint8_t sh1, sh2, so;
    
    for (int i = 0; i < num_samples; i++) {
        for (int j = 0; j < CLOCK_STEP; j++) {
            OPM_Clock(&chip, sample_buf, &sh1, &sh2, &so);
        }
        global_buffer[i] = (sample_buf[0] + sample_buf[1]) / 2.0f;
    }
    
    return num_samples;
}

EMSCRIPTEN_KEEPALIVE
float get_sample(int index) {
    if (global_buffer && index >= 0 && index < global_total_samples) {
        return global_buffer[index];
    }
    return 0.0f;
}

EMSCRIPTEN_KEEPALIVE
void free_buffer() {
    if (global_buffer) {
        free(global_buffer);
        global_buffer = NULL;
        global_total_samples = 0;
    }
}
