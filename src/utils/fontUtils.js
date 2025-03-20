const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Utility functions for font operations
 */

/**
 * Get user fonts directory based on platform
 * @returns {string} - Path to user fonts directory
 */
function getUserFontsDirectory() {
  const platform = os.platform();
  
  switch (platform) {
    case 'win32':
      return path.join(process.env.WINDIR, 'Fonts');
    case 'darwin':
      return path.join(os.homedir(), 'Library/Fonts');
    case 'linux':
      return path.join(os.homedir(), '.local/share/fonts');
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Extract font name from file path
 * @param {string} fontPath - Path to font file
 * @returns {string} - Font name
 */
function extractFontNameFromPath(fontPath) {
  const basename = path.basename(fontPath);
  const fontName = basename.replace(/\.(ttf|otf|woff|woff2)$/i, '');
  return fontName;
}

/**
 * Check if a font file is valid
 * @param {string} fontPath - Path to font file
 * @returns {boolean} - True if valid
 */
function isValidFontFile(fontPath) {
  try {
    const stats = fs.statSync(fontPath);
    if (!stats.isFile()) return false;
    
    const ext = path.extname(fontPath).toLowerCase();
    return ext === '.ttf' || ext === '.otf' || ext === '.woff' || ext === '.woff2';
  } catch (error) {
    return false;
  }
}

/**
 * Group fonts by family
 * @param {Array} fonts - Array of font objects
 * @returns {Object} - Object with family names as keys and arrays of fonts as values
 */
function groupFontsByFamily(fonts) {
  return fonts.reduce((acc, font) => {
    const family = font.family || 'Unknown';
    
    if (!acc[family]) {
      acc[family] = [];
    }
    
    acc[family].push(font);
    return acc;
  }, {});
}

module.exports = {
  getUserFontsDirectory,
  extractFontNameFromPath,
  isValidFontFile,
  groupFontsByFamily
};
