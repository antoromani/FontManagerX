const fs = require('fs');

/**
 * Get all favorite fonts
 * @param {string} favoritesPath - Path to favorites file
 * @returns {Promise<Array>} - Array of favorite font objects
 */
async function getFavorites(favoritesPath) {
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(favoritesPath)) {
        fs.writeFileSync(favoritesPath, JSON.stringify([]));
        resolve([]);
        return;
      }
      
      fs.readFile(favoritesPath, 'utf8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        
        try {
          const favorites = JSON.parse(data);
          resolve(favorites);
        } catch (parseError) {
          console.error('Error parsing favorites:', parseError);
          resolve([]);
        }
      });
    } catch (error) {
      reject(error);
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
      if (!fontData) {
        reject(new Error('Font data is required'));
        return;
      }
      
      // Ensure favorites file exists
      if (!fs.existsSync(favoritesPath)) {
        fs.writeFileSync(favoritesPath, JSON.stringify([]));
      }
      
      // Read favorites
      const favoritesData = fs.readFileSync(favoritesPath, 'utf8');
      let favorites = [];
      
      try {
        favorites = JSON.parse(favoritesData);
      } catch (parseError) {
        console.error('Error parsing favorites, resetting:', parseError);
      }
      
      // Check if font is already a favorite
      const existingIndex = favorites.findIndex(font => 
        font.id === fontData.id || 
        (font.family === fontData.family && font.style === fontData.style)
      );
      
      if (existingIndex >= 0) {
        // Remove from favorites
        favorites.splice(existingIndex, 1);
        fontData.favorite = false;
      } else {
        // Add to favorites
        fontData.favorite = true;
        favorites.push(fontData);
      }
      
      // Save updated favorites
      fs.writeFileSync(favoritesPath, JSON.stringify(favorites));
      
      resolve(fontData);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  getFavorites,
  toggleFavorite
};
