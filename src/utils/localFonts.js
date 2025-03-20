const fs = require('fs');
const path = require('path');
const fontkit = require('fontkit');

/**
 * Load fonts from a local folder
 * @param {string} folderPath - Path to the folder containing font files
 * @returns {Promise<Array>} - Array of font objects
 */
async function loadLocalFonts(folderPath) {
  return new Promise((resolve, reject) => {
    fs.readdir(folderPath, { withFileTypes: true }, async (err, dirents) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Get files and subdirectories
      const fontFiles = [];
      
      // Recursive function to scan directories
      const scanDir = async (dir, relativePath = '') => {
        const files = await fs.promises.readdir(dir, { withFileTypes: true });
        
        for (const file of files) {
          const filePath = path.join(dir, file.name);
          const fileRelativePath = path.join(relativePath, file.name);
          
          if (file.isDirectory()) {
            // Recurse into subdirectories
            await scanDir(filePath, fileRelativePath);
          } else {
            // Check if it's a font file
            const ext = path.extname(file.name).toLowerCase();
            if (ext === '.ttf' || ext === '.otf' || ext === '.woff' || ext === '.woff2') {
              fontFiles.push(filePath);
            }
          }
        }
      };
      
      try {
        await scanDir(folderPath);
        
        // Process fonts in batches to avoid overwhelming the system
        const fonts = [];
        const batchSize = 20;
        
        for (let i = 0; i < fontFiles.length; i += batchSize) {
          const batch = fontFiles.slice(i, i + batchSize);
          
          const batchPromises = batch.map(async (fontPath) => {
            try {
              const fontData = await extractFontInfo(fontPath);
              return {
                ...fontData,
                path: fontPath,
                type: 'local'
              };
            } catch (error) {
              // Skip fonts that can't be processed
              console.error('Error processing font:', fontPath, error);
              return null;
            }
          });
          
          const batchResults = await Promise.all(batchPromises);
          fonts.push(...batchResults.filter(Boolean));
        }
        
        resolve(fonts);
      } catch (error) {
        reject(error);
      }
    });
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
      fs.readFile(fontPath, (err, buffer) => {
        if (err) {
          reject(err);
          return;
        }
        
        try {
          const font = fontkit.create(buffer);
          
          const fontInfo = {
            family: font.familyName,
            style: font.subfamilyName || 'Regular',
            id: `${font.familyName}-${font.subfamilyName || 'Regular'}-${path.basename(fontPath)}`,
            fullName: font.fullName,
            postscriptName: font.postscriptName,
            copyright: font.copyright,
            version: font.version,
            active: false // Local fonts are not active by default
          };
          
          resolve(fontInfo);
        } catch (parseError) {
          // Fall back to basic info if fontkit fails
          const fileName = path.basename(fontPath);
          const fileNameWithoutExt = fileName.replace(/\.(ttf|otf|woff|woff2)$/i, '');
          
          resolve({
            family: fileNameWithoutExt,
            style: 'Regular',
            id: `${fileNameWithoutExt}-${path.basename(fontPath)}`,
            active: false
          });
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { loadLocalFonts };
