// Preset management module
let loadedPresets = [];

async function loadPresets() {
    try {
        const response = await fetch('presets.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        loadedPresets = await response.json();
        
        const select = document.getElementById('presetSelect');
        select.innerHTML = ''; 

        if (!Array.isArray(loadedPresets) || loadedPresets.length === 0) {
            const option = document.createElement('option');
            option.text = "No presets found";
            select.add(option);
            return;
        }

        loadedPresets.forEach((preset, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.text = preset.name || `Preset ${index + 1}`;
            select.add(option);
        });
        
        if(loadedPresets.length > 0) {
            select.value = 0;
            loadToEditor();
        }

        document.getElementById('info').innerHTML += "<br>Presets loaded.";

    } catch (error) {
        console.error('Error loading presets:', error);
        document.getElementById('info').innerHTML = 
            `<span style="color: red;">Error loading 'presets.json'.</span>`;
    }
}

function loadToEditor() {
    const select = document.getElementById('presetSelect');
    const selectedIndex = select.value;
    if (selectedIndex === "" || !loadedPresets[selectedIndex]) return;

    const editObj = {
        events: loadedPresets[selectedIndex].events
    };

    const textarea = document.getElementById('jsonEditor');
    textarea.value = JSON.stringify(editObj, null, 2);
    updateDurationDisplay(editObj.events);
    
    // Try to parse and populate tone editor from JSON
    parseJsonToToneEditor(editObj.events);
}
