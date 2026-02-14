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
function calculateCorrelationAtOffset(
    reference: Float32Array,
    samples: Float32Array,
    start: number
): number {
    const n = reference.length;
    if (n === 0 || start + n > samples.length) {
        return 0;
    }

    let referenceMean = 0;
    let sampleMean = 0;

    for (let i = 0; i < n; i++) {
        referenceMean += reference[i];
        sampleMean += samples[start + i];
    }
    referenceMean /= n;
    sampleMean /= n;

    let numerator = 0;
    let referenceSumSq = 0;
    let sampleSumSq = 0;

    for (let i = 0; i < n; i++) {
        const referenceDiff = reference[i] - referenceMean;
        const sampleDiff = samples[start + i] - sampleMean;
        numerator += referenceDiff * sampleDiff;
        referenceSumSq += referenceDiff * referenceDiff;
        sampleSumSq += sampleDiff * sampleDiff;
    }

    const denominator = Math.sqrt(referenceSumSq * sampleSumSq);

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
        const correlation = calculateCorrelationAtOffset(previousWave, samples, pos);

        if (correlation > bestCorrelation) {
            bestCorrelation = correlation;
            bestPosition = pos;
        }
    }

    return bestPosition;
}
