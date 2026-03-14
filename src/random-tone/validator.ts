/**
 * Random Tone Generator - Configuration Validation
 */

import { RandomConfig, OperatorRandomConfig } from './types';

/**
 * Validate operator parameter ranges
 */
export function validateOperatorRanges(params: unknown): params is OperatorRandomConfig {
    if (!params || typeof params !== 'object') {
        return false;
    }

    const rangeProps = ['TL', 'AR', 'DR', 'SR', 'RR', 'SL', 'KS', 'MUL', 'DT1'];
    for (const prop of rangeProps) {
        const paramObj = params as Record<string, unknown>;
        if (prop in paramObj) {
            const val = paramObj[prop];
            if (val === null || typeof val !== 'object') {
                return false;
            }
            const range = val as { min?: unknown; max?: unknown };
            if (typeof range.min !== 'number' || typeof range.max !== 'number') {
                return false;
            }
        }
    }
    return true;
}

/**
 * Validate random configuration structure
 */
export function validateConfig(config: unknown): config is RandomConfig {
    // Check basic structure
    if (!config || typeof config !== 'object') {
        return false;
    }

    // Cast to any for property access during validation
    const cfg = config as any;

    // Check global parameters first (required)
    if (!cfg.global || typeof cfg.global !== 'object') {
        return false;
    }

    // Check that at least one source of operator parameters exists and has content
    const hasCommonParams = cfg.commonOperatorParams &&
                           typeof cfg.commonOperatorParams === 'object' &&
                           Object.keys(cfg.commonOperatorParams).length > 0;
    const hasOperators = cfg.operators &&
                        Array.isArray(cfg.operators) &&
                        cfg.operators.length === 4;

    if (!hasCommonParams && !hasOperators) {
        return false;
    }

    // If commonOperatorParams exists, validate it
    if (cfg.commonOperatorParams) {
        if (!validateOperatorRanges(cfg.commonOperatorParams)) {
            return false;
        }
    }

    // If operators array exists, validate it
    if (cfg.operators) {
        if (!Array.isArray(cfg.operators) || cfg.operators.length !== 4) {
            return false;
        }

        // Check each operator has valid structure
        for (const op of cfg.operators) {
            if (!validateOperatorRanges(op)) {
                return false;
            }
        }
    }

    // Check global ranges
    const globalRangeProps = ['CON', 'FL'];
    for (const prop of globalRangeProps) {
        if (prop in cfg.global) {
            const val = cfg.global[prop];
            if (val === null || typeof val !== 'object') {
                return false;
            }
            const range = val as { min?: unknown; max?: unknown };
            if (typeof range.min !== 'number' || typeof range.max !== 'number') {
                return false;
            }
        }
    }

    // Check NOTE if present (can be either {enabled: boolean} or ParamRange)
    if ('NOTE' in cfg.global && cfg.global.NOTE !== undefined) {
        if (cfg.global.NOTE === null || typeof cfg.global.NOTE !== 'object') {
            return false;
        }
        const hasEnabled = 'enabled' in cfg.global.NOTE && typeof cfg.global.NOTE.enabled === 'boolean';
        const hasMinMax = 'min' in cfg.global.NOTE && 'max' in cfg.global.NOTE &&
                          typeof cfg.global.NOTE.min === 'number' && typeof cfg.global.NOTE.max === 'number';
        if (!hasEnabled && !hasMinMax) {
            return false;
        }
    }

    return true;
}
