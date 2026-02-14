export const CYCLES_TO_DISPLAY = 4;

/**
 * Estimate frequency using autocorrelation method
 * Returns the estimated frequency in Hz, or 0 if estimation fails
 */
export function estimateFrequency(samples: Float32Array, sampleRate: number): number {
    const minPeriod = Math.floor(sampleRate / 2000); // Max ~2000 Hz
    const maxPeriod = Math.floor(sampleRate / 50);   // Min ~50 Hz

    if (samples.length < maxPeriod * 2) {
        return 0;
    }

    // Autocorrelation
    let bestCorrelation = -1;
    let bestPeriod = 0;

    for (let period = minPeriod; period < maxPeriod && period < samples.length / 2; period++) {
        let sum = 0;
        let count = 0;

        for (let i = 0; i < samples.length - period; i++) {
            sum += samples[i] * samples[i + period];
            count++;
        }

        const correlation = count > 0 ? sum / count : 0;

        if (correlation > bestCorrelation) {
            bestCorrelation = correlation;
            bestPeriod = period;
        }
    }

    if (bestPeriod > 0 && bestCorrelation > 0.3) {
        return sampleRate / bestPeriod;
    }

    return 0;
}

/**
 * Calculate correlation coefficient between two waveforms
 */
export function calculateCorrelation(wave1: Float32Array, wave2: Float32Array): number {
    if (wave1.length !== wave2.length || wave1.length === 0) {
        return 0;
    }

    const n = wave1.length;
    let mean1 = 0;
    let mean2 = 0;

    for (let i = 0; i < n; i++) {
        mean1 += wave1[i];
        mean2 += wave2[i];
    }
    mean1 /= n;
    mean2 /= n;

    let numerator = 0;
    let sumSq1 = 0;
    let sumSq2 = 0;

    for (let i = 0; i < n; i++) {
        const diff1 = wave1[i] - mean1;
        const diff2 = wave2[i] - mean2;
        numerator += diff1 * diff2;
        sumSq1 += diff1 * diff1;
        sumSq2 += diff2 * diff2;
    }

    const denominator = Math.sqrt(sumSq1 * sumSq2);

    if (denominator === 0) {
        return 0;
    }

    return numerator / denominator;
}

/**
 * Find the position in the buffer with highest correlation to the previous waveform
 */
export function findBestCorrelationPosition(
    samples: Float32Array,
    previousWave: Float32Array,
    cycleLength: number
): number {
    const searchRange = Math.min(
        Math.floor(cycleLength * CYCLES_TO_DISPLAY),
        samples.length - previousWave.length
    );

    if (searchRange <= 0) {
        return 0;
    }

    let bestCorrelation = -2;
    let bestPosition = 0;

    for (let pos = 0; pos <= searchRange; pos++) {
        const candidate = samples.slice(pos, pos + previousWave.length);
        const correlation = calculateCorrelation(previousWave, candidate);

        if (correlation > bestCorrelation) {
            bestCorrelation = correlation;
            bestPosition = pos;
        }
    }

    return bestPosition;
}
