/**
 * UI Manager
 * Handles UI updates and user interactions for storage features
 */

import { getAllSlots } from './slotManager';
import { previewSlot } from './previewManager';

/**
 * Handle save button click
 */
export function handleSaveSlot(): void {
    const select = document.getElementById('saveSlotSelect') as HTMLSelectElement | null;
    if (!select) return;
    
    const slotNumber = parseInt(select.value);
    
    if (isNaN(slotNumber)) {
        window.alert('Please select a slot to save to.');
        return;
    }
    
    const slotName = window.prompt(`Enter a name for slot ${slotNumber}:`, `Slot ${slotNumber}`);
    
    // User cancelled the prompt
    if (slotName === null) {
        return;
    }
    
    // Import saveToSlot dynamically to avoid circular dependency
    import('./slotManager').then(({ saveToSlot }) => {
        const success = saveToSlot(slotNumber, slotName || `Slot ${slotNumber}`);
        
        if (success) {
            window.alert(`Saved to slot ${slotNumber}!`);
            refreshSlotInfo();
        }
    });
}

/**
 * Refresh and display slot information
 */
export function refreshSlotInfo(): void {
    const slots = getAllSlots();
    const infoDiv = document.getElementById('slotInfo');
    
    if (!infoDiv) return;
    
    // Clear existing content
    infoDiv.innerHTML = '';
    
    // Create header
    const header = document.createElement('div');
    header.className = 'slot-info-header';
    const headerStrong = document.createElement('strong');
    headerStrong.textContent = 'Saved Slots:';
    header.appendChild(headerStrong);
    infoDiv.appendChild(header);
    
    // Create grid
    const grid = document.createElement('div');
    grid.className = 'slot-grid';
    
    slots.forEach(slot => {
        const slotDiv = document.createElement('div');
        
        // Determine status class and text
        let statusClass: string;
        let statusText: string;
        
        if (slot.isCorrupt) {
            statusClass = 'slot-corrupt';
            statusText = 'Corrupted';
        } else if (slot.isEmpty) {
            statusClass = 'slot-empty';
            statusText = 'Empty';
        } else {
            statusClass = 'slot-filled';
            statusText = slot.name;
        }
        
        slotDiv.className = `slot-item ${statusClass}`;
        
        // Add click handler for filled slots
        if (!slot.isEmpty && !slot.isCorrupt) {
            slotDiv.style.cursor = 'pointer';
            slotDiv.title = 'Click to preview';
            slotDiv.onclick = () => previewSlot(slot.number);
        }
        
        // Add slot number
        const slotNumber = document.createElement('strong');
        slotNumber.textContent = `Slot ${slot.number}`;
        slotDiv.appendChild(slotNumber);
        slotDiv.appendChild(document.createElement('br'));
        
        // Add status text
        const statusTextNode = document.createTextNode(statusText);
        slotDiv.appendChild(statusTextNode);
        
        // Add timestamp if available
        if (slot.timestamp) {
            slotDiv.appendChild(document.createElement('br'));
            const timeSmall = document.createElement('small');
            timeSmall.textContent = new Date(slot.timestamp).toLocaleString();
            slotDiv.appendChild(timeSmall);
        }
        
        grid.appendChild(slotDiv);
    });
    
    infoDiv.appendChild(grid);
}

/**
 * Initialize slot info display when DOM is ready
 */
export function initializeSlotUI(): void {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('DOMContentLoaded', function() {
        const checkAndRefresh = function() {
            const infoDiv = document.getElementById('slotInfo');
            if (infoDiv) {
                refreshSlotInfo();
            }
        };
        
        checkAndRefresh();
        setTimeout(checkAndRefresh, 100);
    });
}
