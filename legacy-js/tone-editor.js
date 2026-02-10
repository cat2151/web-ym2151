// Tone editor parsing and conversion module

/**
 * Parse tone editor textarea and generate YM2151 register events
 * Register formula for channel 0: Base + (8 × Operator)
 */
function parseToneEditorToJson() {
    const toneEditor = document.getElementById('toneEditor');
    const lines = toneEditor.value.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
        return null;
    }
    
    const events = [];
    const operators = [];
    // Default note 0x4A = MIDI note 74 (D5, ~587 Hz on YM2151)
    let globalParams = { con: 7, fl: 0, note: 0x4A };
    
    // Parse each line
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Check if this is a global parameter line (contains CON or FL or NOTE)
        if (line.toUpperCase().includes('CON=') || line.toUpperCase().includes('FL=') || line.toUpperCase().includes('NOTE=')) {
            // Parse global parameters
            const params = parseParamLine(line);
            if (params.CON !== undefined) globalParams.con = params.CON;
            if (params.FL !== undefined) globalParams.fl = params.FL;
            if (params.NOTE !== undefined) globalParams.note = params.NOTE;
        } else {
            // Parse operator parameters
            const opParams = parseParamLine(line);
            operators.push(opParams);
        }
    }
    
    // Ensure we have exactly 4 operators (or use defaults for missing ones)
    while (operators.length < 4) {
        operators.push({
            TL: 0x00, AR: 0x1F, DR: 0x10, SR: 0x00, RR: 0x07,
            SL: 0x00, KS: 0, MUL: 0x01, DT1: 3
        });
    }
    
    // Generate register events for Channel 0
    
    // 0x20: RL FL CON (Right/Left enable, Feedback Level, Connection algorithm)
    // Bits 7-6: RL (11 = both channels enabled)
    // Bits 5-3: FL (Feedback)
    // Bits 2-0: CON (Algorithm)
    const rlFlCon = 0xC0 | ((globalParams.fl & 0x7) << 3) | (globalParams.con & 0x7);
    events.push({ time: 0.0, addr: "0x20", data: toHex(rlFlCon) });
    
    // For each operator (0,1,2,3) on Channel 0
    for (let op = 0; op < 4; op++) {
        const params = operators[op];
        const opOffset = op * 8; // Operator offset for channel 0
        
        // DT1/MUL (0x40 + opOffset)
        // Bits 7-4: DT1 (Detune 1)
        // Bits 3-0: MUL (Frequency Multiplier)
        const dt1 = params.DT1 !== undefined ? params.DT1 : 3;
        const mul = params.MUL !== undefined ? params.MUL : 1;
        const dt1Mul = ((dt1 & 0x7) << 4) | (mul & 0x0F);
        events.push({ time: 0.0, addr: toHex(0x40 + opOffset), data: toHex(dt1Mul) });
        
        // TL (0x60 + opOffset) - Total Level (volume attenuation)
        // Bits 6-0: TL (0=max volume, 127=silent)
        const tl = params.TL !== undefined ? params.TL : 0x00;
        events.push({ time: 0.0, addr: toHex(0x60 + opOffset), data: toHex(tl & 0x7F) });
        
        // KS/AR (0x80 + opOffset)
        // Bits 7-6: KS (Key Scaling)
        // Bits 4-0: AR (Attack Rate)
        const ks = params.KS !== undefined ? params.KS : 0;
        const ar = params.AR !== undefined ? params.AR : 0x1F;
        const ksAr = ((ks & 0x3) << 6) | (ar & 0x1F);
        events.push({ time: 0.0, addr: toHex(0x80 + opOffset), data: toHex(ksAr) });
        
        // AMS-EN/D1R (0xA0 + opOffset)
        // Bit 7: AMS-EN (Amplitude Modulation Enable)
        // Bits 4-0: D1R (Decay Rate / First Decay Rate)
        const dr = params.DR !== undefined ? params.DR : 0x10;
        events.push({ time: 0.0, addr: toHex(0xA0 + opOffset), data: toHex(dr & 0x1F) });
        
        // DT2/D2R (0xC0 + opOffset)
        // Bits 7-6: DT2 (Detune 2)
        // Bits 4-0: D2R (Second Decay Rate / Sustain Rate)
        const sr = params.SR !== undefined ? params.SR : 0x00;
        events.push({ time: 0.0, addr: toHex(0xC0 + opOffset), data: toHex(sr & 0x1F) });
        
        // D1L/RR (0xE0 + opOffset)
        // Bits 7-4: D1L (Sustain Level)
        // Bits 3-0: RR (Release Rate)
        const sl = params.SL !== undefined ? params.SL : 0x00;
        const rr = params.RR !== undefined ? params.RR : 0x07;
        const slRr = ((sl & 0x0F) << 4) | (rr & 0x0F);
        events.push({ time: 0.0, addr: toHex(0xE0 + opOffset), data: toHex(slRr) });
    }
    
    // Note (KC - Key Code) (0x28 for channel 0)
    events.push({ time: 0.0, addr: "0x28", data: toHex(globalParams.note & 0x7F) });
    
    // KF (Key Fraction) (0x30 for channel 0)
    events.push({ time: 0.0, addr: "0x30", data: "0x00" });
    
    // Key On (0x08)
    // Bits 6-3: Slot mask (which operators to key on: M1=bit3, C1=bit4, M2=bit5, C2=bit6)
    // Bits 2-0: Channel number
    // 0x78 = 01111000 = channel 0, all 4 operators on
    events.push({ time: 0.0, addr: "0x08", data: "0x78" });
    
    return { events };
}

/**
 * Parse a parameter line like "TL=00 AR=1F DR=17"
 */
function parseParamLine(line) {
    const params = {};
    const parts = line.toUpperCase().split(/\s+/);
    
    for (const part of parts) {
        const match = part.match(/^([A-Z0-9]+)=([0-9A-F]+)$/);
        if (match) {
            const key = match[1];
            const value = parseInt(match[2], 16);
            params[key] = value;
        }
    }
    
    return params;
}

/**
 * Convert number to hex string with 0x prefix
 */
function toHex(num) {
    return '0x' + num.toString(16).toUpperCase().padStart(2, '0');
}

/**
 * Parse JSON events and try to populate tone editor (reverse operation)
 */
function parseJsonToToneEditor(events) {
    // Parse existing events and extract operator/global parameters
    const operators = [{}, {}, {}, {}];
    let con = 7, fl = 0, note = 0x4A;
    
    events.forEach(evt => {
        const addr = parseInt(evt.addr);
        const data = parseInt(evt.data);
        
        // 0x20: RL FL CON
        if (addr === 0x20) {
            con = data & 0x07;
            fl = (data >> 3) & 0x07;
        }
        // 0x28: Note (KC)
        else if (addr === 0x28) {
            note = data;
        }
        // Operator registers
        else {
            // Determine operator index from address
            // Formula: addr = base + (op * 8) + channel_offset
            // For channel 0, channel_offset = 0, so: addr = base + (op * 8)
            const bases = [0x40, 0x60, 0x80, 0xA0, 0xC0, 0xE0];
            
            for (const base of bases) {
                if (addr >= base && addr < base + 0x20) {
                    const opIndex = Math.floor((addr - base) / 8);
                    if (opIndex >= 0 && opIndex < 4) {
                        const op = operators[opIndex];
                        
                        if (base === 0x40) {
                            // DT1/MUL
                            op.DT1 = (data >> 4) & 0x7;
                            op.MUL = data & 0x0F;
                        } else if (base === 0x60) {
                            // TL
                            op.TL = data & 0x7F;
                        } else if (base === 0x80) {
                            // KS/AR
                            op.KS = (data >> 6) & 0x3;
                            op.AR = data & 0x1F;
                        } else if (base === 0xA0) {
                            // D1R (DR)
                            op.DR = data & 0x1F;
                        } else if (base === 0xC0) {
                            // D2R (SR)
                            op.SR = data & 0x1F;
                        } else if (base === 0xE0) {
                            // D1L/RR
                            op.SL = (data >> 4) & 0x0F;
                            op.RR = data & 0x0F;
                        }
                    }
                    break;
                }
            }
        }
    });
    
    // Generate tone editor text from parsed values
    let text = '';
    for (let i = 0; i < 4; i++) {
        const op = operators[i];
        const tl = op.TL !== undefined ? op.TL : 0x00;
        const ar = op.AR !== undefined ? op.AR : 0x1F;
        const dr = op.DR !== undefined ? op.DR : 0x10;
        const sr = op.SR !== undefined ? op.SR : 0x00;
        const rr = op.RR !== undefined ? op.RR : 0x07;
        const sl = op.SL !== undefined ? op.SL : 0x00;
        const ks = op.KS !== undefined ? op.KS : 0;
        const mul = op.MUL !== undefined ? op.MUL : 0x01;
        const dt1 = op.DT1 !== undefined ? op.DT1 : 3;
        
        text += `TL=${toHex(tl).substring(2)} AR=${toHex(ar).substring(2)} DR=${toHex(dr).substring(2)} SR=${toHex(sr).substring(2)} RR=${toHex(rr).substring(2)} SL=${toHex(sl).substring(2)} KS=${ks} MUL=${toHex(mul).substring(2)} DT1=${dt1}\n`;
    }
    
    text += `CON=${con.toString(16).toUpperCase()} FL=${fl.toString(16).toUpperCase()} NOTE=${toHex(note).substring(2)}`;
    
    const toneEditor = document.getElementById('toneEditor');
    toneEditor.value = text;
}

/**
 * Update JSON textarea when tone editor changes
 */
function onToneEditorChange() {
    const result = parseToneEditorToJson();
    if (result) {
        const jsonEditor = document.getElementById('jsonEditor');
        jsonEditor.value = JSON.stringify(result, null, 2);
        updateDurationDisplay(result.events);
    }
}
