/**
 * Favorites Module – Main Export
 */

export {
    getFavorites,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    clearFavorites
} from './favoritesManager';

export {
    toggleFavoritesSection,
    refreshFavoritesUI,
    loadFavoriteEntry,
    playFavoriteEntry,
    deleteFavoriteEntry,
    clearFavoritesAndRefresh
} from './favoritesUI';
