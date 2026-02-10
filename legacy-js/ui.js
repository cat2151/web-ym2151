// UI update functions

function calculateDuration(events) {
    if (!events || events.length === 0) return 1.0;
    let maxTime = 0.0;
    events.forEach(evt => {
        const t = parseFloat(evt.time);
        if (!isNaN(t) && t > maxTime) maxTime = t;
    });
    return maxTime + 1.0;
}

function updateDurationDisplay(events) {
    const d = calculateDuration(events);
    document.getElementById('durationInfo').innerText = `(Calculated Duration: ${d.toFixed(2)} sec)`;
}
