/**
 * History Module – Main Export
 */

export {
    getHistory,
    addToHistory,
    removeFromHistory,
    clearHistory
} from './historyManager';

export {
    toggleHistorySection,
    refreshHistoryUI,
    loadHistoryEntry,
    playHistoryEntry,
    toggleFavoriteFromHistory,
    deleteHistoryEntry,
    clearHistoryAndRefresh,
    consumeHistoryPlay
} from './historyUI';
