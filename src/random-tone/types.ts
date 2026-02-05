/**
 * Random Tone Generator Types
 */

/**
 * Range for a parameter value
 */
export interface ParamRange {
    min: number;
    max: number;
}

/**
 * Randomization configuration for a single operator
 */
export interface OperatorRandomConfig {
    TL?: ParamRange;
    AR?: ParamRange;
    DR?: ParamRange;
    SR?: ParamRange;
    RR?: ParamRange;
    SL?: ParamRange;
    KS?: ParamRange;
    MUL?: ParamRange;
    DT1?: ParamRange;
}

/**
 * Randomization configuration for global parameters
 */
export interface GlobalRandomConfig {
    CON?: ParamRange;
    FL?: ParamRange;
    NOTE?: { enabled: boolean } | ParamRange;
}

/**
 * Complete randomization configuration
 */
export interface RandomConfig {
    commonOperatorParams?: OperatorRandomConfig;
    operators?: OperatorRandomConfig[];
    global: GlobalRandomConfig;
}
