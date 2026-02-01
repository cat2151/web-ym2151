// UI update functions
function updateDurationDisplay(events) {
    const d = calculateDuration(events);
    document.getElementById('durationInfo').innerText = `(Calculated Duration: ${d.toFixed(2)} sec)`;
}
