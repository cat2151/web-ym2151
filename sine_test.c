#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
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
    
    write_opm(0x20, 0xC7);
    write_opm(0x40, 0x01);
    write_opm(0x60, 0x00);
    write_opm(0x80, 0x1F);
    write_opm(0xA0, 0x00);
    write_opm(0xC0, 0x00);
    write_opm(0xE0, 0x0F);
    write_opm(0x28, 0x4D);
    write_opm(0x30, 0x80);
    write_opm(0x08, 0x08);
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
    
    for (int i = 0; i < total_samples; i++) {
        OPM_Clock(&chip, sample_buf, &sh1, &sh2, &so);
        global_buffer[i] = (sample_buf[0] + sample_buf[1]) / 65536.0f;
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
