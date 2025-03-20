/**
 * System fonts module
 * Provides functions to get all fonts installed on the system
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Get all system fonts
 * @returns {Promise<Array>} - Array of font objects
 */
async function getSystemFonts() {
  const platform = process.platform;
  
  switch (platform) {
    case 'win32':
      return getWindowsFonts();
    case 'darwin':
      return getMacOSFonts();
    case 'linux':
      return getLinuxFonts();
    default:
      // For web demo on Replit, return some sample fonts
      return getSampleFonts();
  }
}

/**
 * Get Windows system fonts
 * @returns {Promise<Array>} - Array of font objects
 */
function getWindowsFonts() {
  return new Promise((resolve, reject) => {
    const fontsFolder = path.join(process.env.WINDIR, 'Fonts');
    
    fs.readdir(fontsFolder, async (err, files) => {
      if (err) {
        console.error('Error reading Windows fonts folder:', err);
        return resolve(getSampleFonts());
      }
      
      const fontFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.ttf', '.otf', '.woff', '.woff2'].includes(ext);
      });
      
      const fonts = [];
      
      for (const file of fontFiles) {
        const fontPath = path.join(fontsFolder, file);
        
        try {
          const fontInfo = await extractFontInfo(fontPath);
          if (fontInfo) {
            fonts.push({
              family: fontInfo.family,
              style: fontInfo.style,
              path: fontPath,
              type: 'system',
              id: fontPath
            });
          }
        } catch (error) {
          console.error(`Error extracting font info for ${file}:`, error);
        }
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
  return new Promise((resolve, reject) => {
    const fontFolders = [
      '/Library/Fonts',
      '/System/Library/Fonts',
      path.join(os.homedir(), 'Library/Fonts')
    ];
    
    const fonts = [];
    let foldersProcessed = 0;
    
    fontFolders.forEach(folder => {
      fs.readdir(folder, async (err, files) => {
        if (err) {
          console.error(`Error reading macOS fonts folder ${folder}:`, err);
          foldersProcessed++;
          
          if (foldersProcessed === fontFolders.length) {
            if (fonts.length === 0) {
              resolve(getSampleFonts());
            } else {
              resolve(fonts);
            }
          }
          return;
        }
        
        const fontFiles = files.filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.ttf', '.otf', '.woff', '.woff2', '.dfont'].includes(ext);
        });
        
        for (const file of fontFiles) {
          const fontPath = path.join(folder, file);
          
          try {
            const fontInfo = await extractFontInfo(fontPath);
            if (fontInfo) {
              fonts.push({
                family: fontInfo.family,
                style: fontInfo.style,
                path: fontPath,
                type: 'system',
                id: fontPath
              });
            }
          } catch (error) {
            console.error(`Error extracting font info for ${file}:`, error);
          }
        }
        
        foldersProcessed++;
        
        if (foldersProcessed === fontFolders.length) {
          if (fonts.length === 0) {
            resolve(getSampleFonts());
          } else {
            resolve(fonts);
          }
        }
      });
    });
  });
}

/**
 * Get Linux system fonts
 * @returns {Promise<Array>} - Array of font objects
 */
function getLinuxFonts() {
  return new Promise((resolve, reject) => {
    const fontFolders = [
      '/usr/share/fonts',
      '/usr/local/share/fonts',
      path.join(os.homedir(), '.fonts'),
      path.join(os.homedir(), '.local/share/fonts')
    ];
    
    const fonts = [];
    let foldersProcessed = 0;
    
    const processFolder = (folder) => {
      fs.readdir(folder, async (err, files) => {
        if (err) {
          console.error(`Error reading Linux fonts folder ${folder}:`, err);
          foldersProcessed++;
          
          if (foldersProcessed === fontFolders.length) {
            if (fonts.length === 0) {
              resolve(getSampleFonts());
            } else {
              resolve(fonts);
            }
          }
          return;
        }
        
        let subFoldersCount = 0;
        let subFoldersProcessed = 0;
        
        // Check if files contains directories
        for (const file of files) {
          const filePath = path.join(folder, file);
          
          try {
            const stats = fs.statSync(filePath);
            
            if (stats.isDirectory()) {
              subFoldersCount++;
              
              fs.readdir(filePath, async (err, subFiles) => {
                if (err) {
                  console.error(`Error reading Linux fonts subfolder ${filePath}:`, err);
                  subFoldersProcessed++;
                  
                  if (subFoldersProcessed === subFoldersCount && foldersProcessed === fontFolders.length) {
                    if (fonts.length === 0) {
                      resolve(getSampleFonts());
                    } else {
                      resolve(fonts);
                    }
                  }
                  return;
                }
                
                const fontFiles = subFiles.filter(subFile => {
                  const ext = path.extname(subFile).toLowerCase();
                  return ['.ttf', '.otf', '.woff', '.woff2'].includes(ext);
                });
                
                for (const fontFile of fontFiles) {
                  const fontPath = path.join(filePath, fontFile);
                  
                  try {
                    const fontInfo = await extractFontInfo(fontPath);
                    if (fontInfo) {
                      fonts.push({
                        family: fontInfo.family,
                        style: fontInfo.style,
                        path: fontPath,
                        type: 'system',
                        id: fontPath
                      });
                    }
                  } catch (error) {
                    console.error(`Error extracting font info for ${fontFile}:`, error);
                  }
                }
                
                subFoldersProcessed++;
                
                if (subFoldersProcessed === subFoldersCount && foldersProcessed === fontFolders.length) {
                  if (fonts.length === 0) {
                    resolve(getSampleFonts());
                  } else {
                    resolve(fonts);
                  }
                }
              });
            } else if (stats.isFile()) {
              // Process font file
              const ext = path.extname(file).toLowerCase();
              if (['.ttf', '.otf', '.woff', '.woff2'].includes(ext)) {
                try {
                  const fontInfo = await extractFontInfo(filePath);
                  if (fontInfo) {
                    fonts.push({
                      family: fontInfo.family,
                      style: fontInfo.style,
                      path: filePath,
                      type: 'system',
                      id: filePath
                    });
                  }
                } catch (error) {
                  console.error(`Error extracting font info for ${file}:`, error);
                }
              }
            }
          } catch (error) {
            console.error(`Error processing file ${filePath}:`, error);
          }
        }
        
        if (subFoldersCount === 0) {
          foldersProcessed++;
          
          if (foldersProcessed === fontFolders.length) {
            if (fonts.length === 0) {
              resolve(getSampleFonts());
            } else {
              resolve(fonts);
            }
          }
        }
      });
    };
    
    fontFolders.forEach(folder => {
      try {
        if (fs.existsSync(folder)) {
          processFolder(folder);
        } else {
          foldersProcessed++;
          
          if (foldersProcessed === fontFolders.length) {
            if (fonts.length === 0) {
              resolve(getSampleFonts());
            } else {
              resolve(fonts);
            }
          }
        }
      } catch (error) {
        console.error(`Error accessing folder ${folder}:`, error);
        foldersProcessed++;
        
        if (foldersProcessed === fontFolders.length) {
          if (fonts.length === 0) {
            resolve(getSampleFonts());
          } else {
            resolve(fonts);
          }
        }
      }
    });
  });
}

/**
 * Extract font information from a font file
 * @param {string} fontPath - Path to the font file
 * @returns {Promise<Object>} - Font information
 */
async function extractFontInfo(fontPath) {
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
  
  return {
    family,
    style,
    filePath: fontPath
  };
}

/**
 * Get sample fonts for demo purposes
 * @returns {Array} - Array of sample font objects
 */
function getSampleFonts() {
  // Return some common web-safe fonts as samples
  const webSafeFonts = [
    { family: 'Arial', style: 'Regular', type: 'system', id: 'arial-regular' },
    { family: 'Arial', style: 'Bold', type: 'system', id: 'arial-bold' },
    { family: 'Arial', style: 'Italic', type: 'system', id: 'arial-italic' },
    { family: 'Arial', style: 'Bold Italic', type: 'system', id: 'arial-bold-italic' },
    { family: 'Times New Roman', style: 'Regular', type: 'system', id: 'times-new-roman-regular' },
    { family: 'Times New Roman', style: 'Bold', type: 'system', id: 'times-new-roman-bold' },
    { family: 'Times New Roman', style: 'Italic', type: 'system', id: 'times-new-roman-italic' },
    { family: 'Times New Roman', style: 'Bold Italic', type: 'system', id: 'times-new-roman-bold-italic' },
    { family: 'Courier New', style: 'Regular', type: 'system', id: 'courier-new-regular' },
    { family: 'Courier New', style: 'Bold', type: 'system', id: 'courier-new-bold' },
    { family: 'Courier New', style: 'Italic', type: 'system', id: 'courier-new-italic' },
    { family: 'Courier New', style: 'Bold Italic', type: 'system', id: 'courier-new-bold-italic' },
    { family: 'Georgia', style: 'Regular', type: 'system', id: 'georgia-regular' },
    { family: 'Georgia', style: 'Bold', type: 'system', id: 'georgia-bold' },
    { family: 'Georgia', style: 'Italic', type: 'system', id: 'georgia-italic' },
    { family: 'Georgia', style: 'Bold Italic', type: 'system', id: 'georgia-bold-italic' },
    { family: 'Verdana', style: 'Regular', type: 'system', id: 'verdana-regular' },
    { family: 'Verdana', style: 'Bold', type: 'system', id: 'verdana-bold' },
    { family: 'Verdana', style: 'Italic', type: 'system', id: 'verdana-italic' },
    { family: 'Verdana', style: 'Bold Italic', type: 'system', id: 'verdana-bold-italic' },
    { family: 'Tahoma', style: 'Regular', type: 'system', id: 'tahoma-regular' },
    { family: 'Tahoma', style: 'Bold', type: 'system', id: 'tahoma-bold' },
    { family: 'Trebuchet MS', style: 'Regular', type: 'system', id: 'trebuchet-ms-regular' },
    { family: 'Trebuchet MS', style: 'Bold', type: 'system', id: 'trebuchet-ms-bold' },
    { family: 'Trebuchet MS', style: 'Italic', type: 'system', id: 'trebuchet-ms-italic' },
    { family: 'Trebuchet MS', style: 'Bold Italic', type: 'system', id: 'trebuchet-ms-bold-italic' }
  ];
  
  return webSafeFonts;
}

module.exports = {
  getSystemFonts
};