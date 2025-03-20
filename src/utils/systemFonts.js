const os = require('os');
const { exec } = require('child_process');
const fontkit = require('fontkit');
const fs = require('fs');
const path = require('path');

/**
 * Get all system fonts
 * @returns {Promise<Array>} - Array of font objects
 */
async function getSystemFonts() {
  const platform = os.platform();
  
  switch (platform) {
    case 'win32':
      return await getWindowsFonts();
    case 'darwin':
      return await getMacOSFonts();
    case 'linux':
      return await getLinuxFonts();
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Get Windows system fonts
 * @returns {Promise<Array>} - Array of font objects
 */
function getWindowsFonts() {
  const fontsDir = path.join(process.env.WINDIR, 'Fonts');
  
  return new Promise((resolve, reject) => {
    fs.readdir(fontsDir, async (err, files) => {
      if (err) {
        reject(err);
        return;
      }
      
      const fontFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ext === '.ttf' || ext === '.otf';
      });
      
      const fonts = [];
      
      // Process fonts in batches to avoid overwhelming the system
      const batchSize = 20;
      for (let i = 0; i < fontFiles.length; i += batchSize) {
        const batch = fontFiles.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (file) => {
          try {
            const fontPath = path.join(fontsDir, file);
            const fontData = await extractFontInfo(fontPath);
            
            if (fontData) {
              return {
                ...fontData,
                path: fontPath,
                active: true, // System fonts are always active
                type: 'system'
              };
            }
            return null;
          } catch (error) {
            console.error(`Error processing font ${file}:`, error);
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        fonts.push(...batchResults.filter(Boolean));
      }
      
      resolve(fonts);
    });
  });
}

/**
 * Get macOS system fonts
 * @returns {Promise<Array>} - Array of font objects
 */
function getMacOSFonts() {
  const systemFontDirs = [
    '/Library/Fonts',
    '/System/Library/Fonts',
    path.join(os.homedir(), 'Library/Fonts')
  ];
  
  return new Promise((resolve, reject) => {
    const fonts = [];
    
    const promises = systemFontDirs.map((dir) => {
      return new Promise((dirResolve) => {
        fs.readdir(dir, async (err, files) => {
          if (err) {
            // Continue even if a directory is not accessible
            dirResolve([]);
            return;
          }
          
          const fontFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ext === '.ttf' || ext === '.otf';
          });
          
          const dirFonts = [];
          
          // Process fonts in batches
          const batchSize = 20;
          for (let i = 0; i < fontFiles.length; i += batchSize) {
            const batch = fontFiles.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (file) => {
              try {
                const fontPath = path.join(dir, file);
                const fontData = await extractFontInfo(fontPath);
                
                if (fontData) {
                  return {
                    ...fontData,
                    path: fontPath,
                    active: true, // System fonts are always active
                    type: 'system'
                  };
                }
                return null;
              } catch (error) {
                // Skip fonts that can't be processed
                return null;
              }
            });
            
            const batchResults = await Promise.all(batchPromises);
            dirFonts.push(...batchResults.filter(Boolean));
          }
          
          dirResolve(dirFonts);
        });
      });
    });
    
    Promise.all(promises)
      .then((dirFontsArrays) => {
        dirFontsArrays.forEach(dirFonts => {
          fonts.push(...dirFonts);
        });
        resolve(fonts);
      })
      .catch(error => {
        reject(error);
      });
  });
}

/**
 * Get Linux system fonts
 * @returns {Promise<Array>} - Array of font objects
 */
function getLinuxFonts() {
  return new Promise((resolve, reject) => {
    exec('fc-list : file family style', (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      
      const lines = stdout.split('\n');
      const fonts = [];
      
      // Process lines in batches
      const processLines = async () => {
        const batchSize = 50;
        
        for (let i = 0; i < lines.length; i += batchSize) {
          const batch = lines.slice(i, i + batchSize);
          
          const batchResults = await Promise.all(batch.map(async (line) => {
            if (!line.trim()) return null;
            
            const parts = line.split(':');
            if (parts.length < 3) return null;
            
            const fontPath = parts[0].trim();
            const fontFamily = parts[1].trim();
            const fontStyle = parts[2].trim();
            
            // Skip font if missing essential info
            if (!fontPath || !fontFamily) return null;
            
            // Check if file exists and is a font
            if (!fs.existsSync(fontPath)) return null;
            
            try {
              // Extract more info if possible
              const additionalInfo = await extractFontInfo(fontPath);
              
              return {
                family: fontFamily,
                style: fontStyle,
                path: fontPath,
                active: true, // System fonts are always active
                type: 'system',
                ...additionalInfo
              };
            } catch (error) {
              // Use basic info if extraction fails
              return {
                family: fontFamily,
                style: fontStyle,
                path: fontPath,
                active: true,
                type: 'system',
                id: `${fontFamily}-${fontStyle}`
              };
            }
          }));
          
          fonts.push(...batchResults.filter(Boolean));
        }
        
        return fonts;
      };
      
      processLines()
        .then(resolve)
        .catch(reject);
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
      // Read the file asynchronously
      fs.readFile(fontPath, (err, buffer) => {
        if (err) {
          reject(err);
          return;
        }
        
        try {
          // Parse the font with fontkit
          const font = fontkit.create(buffer);
          
          const fontInfo = {
            family: font.familyName,
            style: font.subfamilyName || 'Regular',
            id: `${font.familyName}-${font.subfamilyName || 'Regular'}`,
            fullName: font.fullName,
            postscriptName: font.postscriptName,
            copyright: font.copyright,
            version: font.version
          };
          
          resolve(fontInfo);
        } catch (parseError) {
          // Fall back to basic info if fontkit fails
          const fileName = path.basename(fontPath);
          const fileNameWithoutExt = fileName.replace(/\.(ttf|otf)$/i, '');
          
          resolve({
            family: fileNameWithoutExt,
            style: 'Regular',
            id: fileNameWithoutExt
          });
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { getSystemFonts };
