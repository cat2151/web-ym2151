#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include "opm.h"

#define SAMPLE_RATE 44100
#define DURATION_SEC 1
#define BUSY_CYCLES 128  // YM2151のビジー期間

static opm_t chip;

// YM2151レジスタ書き込み + ビジー待機
void write_opm(uint8_t reg, uint8_t data) {
    int32_t dummy[2];
    
    OPM_Write(&chip, 0, reg);   // アドレス書き込み
    
    // 128クロック消費
    for (int i = 0; i < BUSY_CYCLES; i++) {
        OPM_Clock(&chip, dummy);
    }
    
    OPM_Write(&chip, 1, data);  // データ書き込み
    
    // 再び128クロック消費
    for (int i = 0; i < BUSY_CYCLES; i++) {
        OPM_Clock(&chip, dummy);
    }
}

void setup_sine_wave() {
    // チップ初期化
    OPM_Reset(&chip, SAMPLE_RATE);
    
    // チャンネル0用の設定
    write_opm(0x20, 0xC7);  // RL=11, FB=0, CON=7
    
    // オペレータM1 (OP0) の設定
    write_opm(0x40, 0x01);  // DT1=0, MUL=1
    write_opm(0x60, 0x00);  // TL=0
    write_opm(0x80, 0x1F);  // KS=0, AR=31
    write_opm(0xA0, 0x00);  // AMS-EN=0, D1R=0
    write_opm(0xC0, 0x00);  // DT2=0, D2R=0
    write_opm(0xE0, 0x0F);  // D1L=0, RR=15
    
    // 440Hz設定
    write_opm(0x28, 0x4D);  // KC
    write_opm(0x30, 0x80);  // KF
    
    // Key On
    write_opm(0x08, 0x08);  // M1オン
}

float* generate_sine() {
    int total_samples = SAMPLE_RATE * DURATION_SEC;
    float *buffer = (float*)malloc(sizeof(float) * total_samples);
    
    setup_sine_wave();
    
    int32_t sample_buf[2];
    
    for (int i = 0; i < total_samples; i++) {
        OPM_Clock(&chip, sample_buf);
        buffer[i] = (sample_buf[0] + sample_buf[1]) / 65536.0f;
    }
    
    return buffer;
}

void free_buffer(float* buffer) {
    free(buffer);
}
