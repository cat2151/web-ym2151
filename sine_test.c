#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <math.h>
#include <emscripten.h>
#include "opm.h"

#define SAMPLE_RATE 44100
#define DURATION_SEC 1
#define BUSY_CYCLES 128

static opm_t chip;
static float *global_buffer = NULL;

// YM2151レジスタ書き込み + ビジー待機
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

void setup_sine_wave() {
    OPM_Reset(&chip, SAMPLE_RATE);
    
    // チャンネル0: RL=11(両ch出力), FB=0, CON=7(M1のみ)
    write_opm(0x20, 0xC7);
    
    // 全オペレータ(M1,M2,C1,C2)のTLを設定 - M1以外は最小音量に
    write_opm(0x60, 0x00);  // M1 TL=0 (最大音量)
    write_opm(0x68, 0x7F);  // M2 TL=127 (最小音量)
    write_opm(0x70, 0x7F);  // C1 TL=127 (最小音量)
    write_opm(0x78, 0x7F);  // C2 TL=127 (最小音量)
    
    // M1オペレータの詳細設定
    write_opm(0x40, 0x01);  // M1: DT1=0, MUL=1
    write_opm(0x80, 0x1F);  // M1: KS=0, AR=31(最速アタック)
    write_opm(0xA0, 0x00);  // M1: AMS-EN=0, D1R=0
    write_opm(0xC0, 0x00);  // M1: DT2=0, D2R=0
    write_opm(0xE0, 0x00);  // M1: D1L=0, RR=0(エンベロープ維持)
    
    // 440Hz設定
    write_opm(0x28, 0x4D);  // KC
    write_opm(0x30, 0x80);  // KF
    
    // Key On: 全オペレータキーオン
    write_opm(0x08, 0x78);  // bit3-6で全オペレータオン
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
    
    // まず生波形を生成
    for (int i = 0; i < total_samples; i++) {
        OPM_Clock(&chip, sample_buf, &sh1, &sh2, &so);
        global_buffer[i] = (sample_buf[0] + sample_buf[1]) / 2.0f;
    }
    
    // 最大振幅を検出
    float max_amplitude = 0.0f;
    for (int i = 0; i < total_samples; i++) {
        float abs_sample = fabsf(global_buffer[i]);
        if (abs_sample > max_amplitude) {
            max_amplitude = abs_sample;
        }
    }
    
    // ノーマライズ（最大振幅を0.8に設定してクリッピング防止）
    if (max_amplitude > 0.0f) {
        float normalize_factor = 0.8f / max_amplitude;
        for (int i = 0; i < total_samples; i++) {
            global_buffer[i] *= normalize_factor;
        }
    }
    
    return total_samples;
}

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
