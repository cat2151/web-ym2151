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

void setup_sine_wave() {
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
    
    write_opm(0x28, 0x48); // KC = A4
    write_opm(0x30, 0x00); // KF = 0
    
    write_opm(0x08, 0x78); // Key On
}

EMSCRIPTEN_KEEPALIVE
int generate_sine(int num_samples) {
    if (num_samples <= 0) {
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
    
    setup_sine_wave();
    
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
