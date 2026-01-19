#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <math.h>
#include <emscripten.h>
#include "opm.h"

#define SAMPLE_RATE 44100
#define DURATION_SEC 1
#define BUSY_CYCLES 128
#define CLOCK_STEP 64
#define OPM_CLOCK 3579545
#define SAMPLE_RATE (OPM_CLOCK / CLOCK_STEP)  // 約55.9kHz

static opm_t chip;
static float *global_buffer = NULL;

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
int generate_sine() {
    int total_samples = SAMPLE_RATE * DURATION_SEC;
    
    if (global_buffer) {
        free(global_buffer);
    }
    
    global_buffer = (float*)malloc(sizeof(float) * total_samples);
    
    setup_sine_wave();
    
    int32_t sample_buf[2];
    uint8_t sh1, sh2, so;
    
    double step = (double)OPM_CLOCK / SAMPLE_RATE;
    double time_acc = 0.0;
    
    for (int i = 0; i < total_samples; i++) {
        for (int j = 0; j < CLOCK_STEP; j++) {
            OPM_Clock(&chip, sample_buf, &sh1, &sh2, &so);
        }
        global_buffer[i] = (sample_buf[0] + sample_buf[1]) / 2.0f;
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
