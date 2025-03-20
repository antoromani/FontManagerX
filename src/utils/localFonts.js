/**
 * Local fonts module
 * Provides functions to load fonts from local folders
 */

const fs = require('fs');
const path = require('path');

/**
 * Load fonts from a local folder
 * @param {string} folderPath - Path to the folder containing font files
 * @returns {Promise<Array>} - Array of font objects
 */
async function loadLocalFonts(folderPath) {
  return new Promise((resolve, reject) => {
    try {
      if (!fs.existsSync(folderPath)) {
        return resolve([]);
      }
      
      fs.readdir(folderPath, async (err, files) => {
        if (err) {
          console.error(`Error reading folder ${folderPath}:`, err);
          return resolve([]);
        }
        
        const fontFiles = files.filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.ttf', '.otf', '.woff', '.woff2'].includes(ext);
        });
        
        const fonts = [];
        
        for (const file of fontFiles) {
          const fontPath = path.join(folderPath, file);
          
          try {
            const fontInfo = await extractFontInfo(fontPath);
            
            if (fontInfo) {
              fonts.push({
                family: fontInfo.family,
                style: fontInfo.style,
                path: fontPath,
                type: 'local',
                id: fontPath
              });
            }
          } catch (error) {
            console.error(`Error extracting font info for ${file}:`, error);
          }
        }
        
        resolve(fonts);
      });
    } catch (error) {
      console.error(`Error loading fonts from folder ${folderPath}:`, error);
      resolve([]);
    }
  });
}

/**
 * Extract font information from a font file
 * @param {string} fontPath - Path to the font file
 * @returns {Promise<Object>} - Font information
 */
function extractFontInfo(fontPath) {
  return new Promise((resolve, reject) => {
    try {
      // In a real implementation, this would use fontkit to extract font metadata
      // For this example, we'll derive it from the filename
      const fileName = path.basename(fontPath);
      const fontNameMatch = fileName.match(/^(.+)\.(ttf|otf|woff|woff2)$/i);
      const fontName = fontNameMatch ? fontNameMatch[1] : fileName;
      
      // Try to extract style information (like Bold, Italic, etc.)
      const styleMatch = fontName.match(/(Bold|Italic|Light|Regular|Medium|Black|Condensed|Thin|ExtraBold|SemiBold)/i);
      const style = styleMatch ? styleMatch[1] : 'Regular';
      
      // Remove style information from family name
      let family = fontName;
      styleMatch && (family = family.replace(styleMatch[0], '').trim());
      
      // Clean up family name (remove non-alphanumeric characters)
      family = family.replace(/[_-]/g, ' ').trim();
      
      resolve({
        family,
        style,
        filePath: fontPath
      });
    } catch (error) {
      console.error(`Error extracting font info for ${fontPath}:`, error);
      reject(error);
    }
  });
}

module.exports = {
  loadLocalFonts
};