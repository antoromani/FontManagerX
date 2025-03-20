/**
 * Font utility functions
 * Provides common utility functions for font operations
 */

const os = require('os');
const path = require('path');

/**
 * Get user fonts directory based on platform
 * @returns {string} - Path to user fonts directory
 */
function getUserFontsDirectory() {
  const platform = process.platform;
  
  switch (platform) {
    case 'win32':
      return path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts');
    case 'darwin':
      return path.join(os.homedir(), 'Library/Fonts');
    case 'linux':
      return path.join(os.homedir(), '.local/share/fonts');
    default:
      return path.join(os.homedir(), 'fonts');
  }
}

/**
 * Extract font name from file path
 * @param {string} fontPath - Path to font file
 * @returns {string} - Font name
 */
function extractFontNameFromPath(fontPath) {
  const fileName = path.basename(fontPath);
  const fontNameMatch = fileName.match(/^(.+)\.(ttf|otf|woff|woff2)$/i);
  const fontName = fontNameMatch ? fontNameMatch[1] : fileName;
  
  return fontName.replace(/[_-]/g, ' ');
}

/**
 * Check if a font file is valid
 * @param {string} fontPath - Path to font file
 * @returns {boolean} - True if valid
 */
function isValidFontFile(fontPath) {
  const ext = path.extname(fontPath).toLowerCase();
  return ['.ttf', '.otf', '.woff', '.woff2'].includes(ext);
}

/**
 * Group fonts by family
 * @param {Array} fonts - Array of font objects
 * @returns {Object} - Object with family names as keys and arrays of fonts as values
 */
function groupFontsByFamily(fonts) {
  const fontsByFamily = {};
  
  fonts.forEach(font => {
    if (!fontsByFamily[font.family]) {
      fontsByFamily[font.family] = [];
    }
    fontsByFamily[font.family].push(font);
  });
  
  return fontsByFamily;
}

module.exports = {
  getUserFontsDirectory,
  extractFontNameFromPath,
  isValidFontFile,
  groupFontsByFamily
};