/**
 * Favorites module
 * Provides functions to manage favorite fonts
 */

const fs = require('fs');
const path = require('path');

/**
 * Get all favorite fonts
 * @param {string} favoritesPath - Path to favorites file
 * @returns {Promise<Array>} - Array of favorite font objects
 */
async function getFavorites(favoritesPath) {
  return new Promise((resolve, reject) => {
    try {
      // Create favorites file if it doesn't exist
      if (!fs.existsSync(favoritesPath)) {
        const dir = path.dirname(favoritesPath);
        
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(favoritesPath, JSON.stringify([]));
      }
      
      // Read favorites
      const favorites = JSON.parse(fs.readFileSync(favoritesPath, 'utf8'));
      
      resolve(favorites);
    } catch (error) {
      console.error('Error getting favorites:', error);
      resolve([]);
    }
  });
}

/**
 * Toggle a font's favorite status
 * @param {string} favoritesPath - Path to favorites file
 * @param {Object} fontData - Font data
 * @returns {Promise<Object>} - Updated font data
 */
async function toggleFavorite(favoritesPath, fontData) {
  return new Promise((resolve, reject) => {
    try {
      // Create favorites file if it doesn't exist
      if (!fs.existsSync(favoritesPath)) {
        const dir = path.dirname(favoritesPath);
        
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(favoritesPath, JSON.stringify([]));
      }
      
      // Read favorites
      const favorites = JSON.parse(fs.readFileSync(favoritesPath, 'utf8'));
      
      // Check if font is already a favorite
      const existingIndex = favorites.findIndex(font => font.id === fontData.id);
      
      if (existingIndex >= 0) {
        // Remove from favorites
        favorites.splice(existingIndex, 1);
        fontData.favorite = false;
      } else {
        // Add to favorites
        favorites.push({
          ...fontData,
          favorite: true
        });
        fontData.favorite = true;
      }
      
      // Save favorites
      fs.writeFileSync(favoritesPath, JSON.stringify(favorites, null, 2));
      
      resolve(fontData);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      reject(error);
    }
  });
}

module.exports = {
  getFavorites,
  toggleFavorite
};