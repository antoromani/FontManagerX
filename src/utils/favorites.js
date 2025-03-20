/**
 * Favorites module
 * Provides functions to manage favorite fonts
 */

const fs = require('fs');
const path = require('path');

/**
 * Get all favorite fonts
 * @param {string} favoritesPath - Path to favorites file
 * @returns {Array} - Array of favorite font objects
 */
function getFavorites(favoritesPath) {
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
    
    // If no favorites, create sample favorites
    if (favorites.length === 0) {
      const sampleFavorites = [
        { family: 'Roboto', style: 'Regular', type: 'google', id: 'google-roboto-regular', favorite: true },
        { family: 'Montserrat', style: 'Bold', type: 'google', id: 'google-montserrat-700', favorite: true },
        { family: 'Open Sans', style: 'Light', type: 'google', id: 'google-open-sans-300', favorite: true }
      ];
      
      fs.writeFileSync(favoritesPath, JSON.stringify(sampleFavorites, null, 2));
      return sampleFavorites;
    }
    
    return favorites;
  } catch (error) {
    console.error('Error getting favorites:', error);
    return [];
  }
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