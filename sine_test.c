#include <stdio.h>
#include <stdlib.h>
#include "opm.h"  // Nuked-OPM のヘッダ

#define SAMPLE_RATE 44100
#define DURATION_SEC 1

static opm_context *ctx;

float* generate_sine() {
    int total_samples = SAMPLE_RATE * DURATION_SEC;
    float *buffer = (float*)malloc(sizeof(float) * total_samples);
    ctx = opm_new(SAMPLE_RATE);

    // 1音色の sine wave を YM2151 register で設定
    // OPM tone example: 全部0にしてシンプルな音色
    opm_reset(ctx);
    opm_set_frequency(ctx, 0, 440.0);  // 0チャンネル、440Hz

    for (int i = 0; i < total_samples; i++) {
        buffer[i] = opm_clock(ctx) / 32768.0f;  // -1.0～1.0
    }

    return buffer;
}

void free_buffer(float* buffer) {
    free(buffer);
}
