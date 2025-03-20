const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');
const { getSystemFonts } = require('./systemFonts');

/**
 * Handles font activation, deactivation, and status checking
 * across different operating systems
 */
class FontManager {
  constructor() {
    this.platform = os.platform();
    this.activeFonts = [];
    this.fontCachePath = path.join(
      process.env.APPDATA || 
      (process.platform === 'darwin' ? 
        path.join(os.homedir(), 'Library/Application Support') : 
        path.join(os.homedir(), '.config')),
      'FontManager',
      'active-fonts.json'
    );
    
    // Create directory if it doesn't exist
    const dir = path.dirname(this.fontCachePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Create file if it doesn't exist
    if (!fs.existsSync(this.fontCachePath)) {
      fs.writeFileSync(this.fontCachePath, JSON.stringify([]));
    }
    
    // Load active fonts from cache
    this.loadActiveFonts();
  }
  
  /**
   * Load active fonts from cache file
   */
  loadActiveFonts() {
    try {
      const data = fs.readFileSync(this.fontCachePath, 'utf8');
      this.activeFonts = JSON.parse(data);
    } catch (error) {
      console.error('Error loading active fonts:', error);
      this.activeFonts = [];
    }
  }
  
  /**
   * Save active fonts to cache file
   */
  saveActiveFonts() {
    try {
      fs.writeFileSync(this.fontCachePath, JSON.stringify(this.activeFonts));
    } catch (error) {
      console.error('Error saving active fonts:', error);
    }
  }
  
  /**
   * Activate a font
   * @param {string} fontPath - Path to the font file
   * @returns {Promise<boolean>} - Success status
   */
  async activateFont(fontPath) {
    if (!fontPath) {
      throw new Error('Font path is required');
    }
    
    if (!fs.existsSync(fontPath)) {
      throw new Error(`Font file does not exist: ${fontPath}`);
    }
    
    switch (this.platform) {
      case 'win32':
        return await this.activateFontWindows(fontPath);
      case 'darwin':
        return await this.activateFontMacOS(fontPath);
      case 'linux':
        return await this.activateFontLinux(fontPath);
      default:
        throw new Error(`Unsupported platform: ${this.platform}`);
    }
  }
  
  /**
   * Deactivate a font
   * @param {string} fontPath - Path to the font file
   * @returns {Promise<boolean>} - Success status
   */
  async deactivateFont(fontPath) {
    if (!fontPath) {
      throw new Error('Font path is required');
    }
    
    switch (this.platform) {
      case 'win32':
        return await this.deactivateFontWindows(fontPath);
      case 'darwin':
        return await this.deactivateFontMacOS(fontPath);
      case 'linux':
        return await this.deactivateFontLinux(fontPath);
      default:
        throw new Error(`Unsupported platform: ${this.platform}`);
    }
  }
  
  /**
   * Check if a font is active
   * @param {string} fontPath - Path to the font file
   * @returns {boolean} - True if active
   */
  isFontActive(fontPath) {
    return this.activeFonts.includes(fontPath);
  }
  
  /**
   * Get all active fonts
   * @returns {Array<string>} - Array of active font paths
   */
  async getActiveFonts() {
    const systemFonts = await getSystemFonts();
    const activeSystemFonts = systemFonts.filter(font => font.active);
    
    // Get font details from active font paths
    const activeFontDetails = this.activeFonts.map(fontPath => {
      const fileName = path.basename(fontPath);
      const fontNameMatch = fileName.match(/^(.+)\.(ttf|otf|woff|woff2)$/i);
      const fontName = fontNameMatch ? fontNameMatch[1] : fileName;
      
      return {
        family: fontName.replace(/[_-]/g, ' '),
        path: fontPath,
        active: true,
        type: 'local',
        id: fontPath
      };
    });
    
    return [...activeSystemFonts, ...activeFontDetails];
  }
  
  /**
   * Activate a font on Windows
   * @param {string} fontPath - Path to the font file
   * @returns {Promise<boolean>} - Success status
   */
  async activateFontWindows(fontPath) {
    // On Windows, we need to copy the font to the Windows font directory
    const fontFileName = path.basename(fontPath);
    const windowsFontDir = path.join(process.env.WINDIR, 'Fonts');
    const destFontPath = path.join(windowsFontDir, fontFileName);
    
    return new Promise((resolve, reject) => {
      // Check if font is already installed
      if (fs.existsSync(destFontPath)) {
        if (!this.activeFonts.includes(fontPath)) {
          this.activeFonts.push(fontPath);
          this.saveActiveFonts();
        }
        resolve(true);
        return;
      }
      
      // Copy font file to Windows font directory
      fs.copyFile(fontPath, destFontPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Add registry entry (requires admin rights)
        const regCommand = `reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts" /v "${fontFileName}" /t REG_SZ /d "${destFontPath}" /f`;
        exec(regCommand, (error) => {
          if (error) {
            console.warn('Failed to add font to registry (may require admin rights):', error);
          }
          
          // Add to active fonts list
          if (!this.activeFonts.includes(fontPath)) {
            this.activeFonts.push(fontPath);
            this.saveActiveFonts();
          }
          
          resolve(true);
        });
      });
    });
  }
  
  /**
   * Deactivate a font on Windows
   * @param {string} fontPath - Path to the font file
   * @returns {Promise<boolean>} - Success status
   */
  async deactivateFontWindows(fontPath) {
    const fontFileName = path.basename(fontPath);
    const windowsFontDir = path.join(process.env.WINDIR, 'Fonts');
    const destFontPath = path.join(windowsFontDir, fontFileName);
    
    return new Promise((resolve, reject) => {
      // Check if font exists in Windows font directory
      if (!fs.existsSync(destFontPath)) {
        // Remove from active fonts list
        this.activeFonts = this.activeFonts.filter(f => f !== fontPath);
        this.saveActiveFonts();
        resolve(true);
        return;
      }
      
      // Remove registry entry (requires admin rights)
      const regCommand = `reg delete "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Fonts" /v "${fontFileName}" /f`;
      exec(regCommand, (error) => {
        if (error) {
          console.warn('Failed to remove font from registry (may require admin rights):', error);
        }
        
        // Delete font file from Windows font directory
        fs.unlink(destFontPath, (err) => {
          if (err) {
            reject(err);
            return;
          }
          
          // Remove from active fonts list
          this.activeFonts = this.activeFonts.filter(f => f !== fontPath);
          this.saveActiveFonts();
          
          resolve(true);
        });
      });
    });
  }
  
  /**
   * Activate a font on macOS
   * @param {string} fontPath - Path to the font file
   * @returns {Promise<boolean>} - Success status
   */
  async activateFontMacOS(fontPath) {
    const userFontDir = path.join(os.homedir(), 'Library/Fonts');
    const fontFileName = path.basename(fontPath);
    const destFontPath = path.join(userFontDir, fontFileName);
    
    return new Promise((resolve, reject) => {
      // Check if font is already installed
      if (fs.existsSync(destFontPath)) {
        if (!this.activeFonts.includes(fontPath)) {
          this.activeFonts.push(fontPath);
          this.saveActiveFonts();
        }
        resolve(true);
        return;
      }
      
      // Copy font file to user font directory
      fs.copyFile(fontPath, destFontPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Add to active fonts list
        if (!this.activeFonts.includes(fontPath)) {
          this.activeFonts.push(fontPath);
          this.saveActiveFonts();
        }
        
        resolve(true);
      });
    });
  }
  
  /**
   * Deactivate a font on macOS
   * @param {string} fontPath - Path to the font file
   * @returns {Promise<boolean>} - Success status
   */
  async deactivateFontMacOS(fontPath) {
    const userFontDir = path.join(os.homedir(), 'Library/Fonts');
    const fontFileName = path.basename(fontPath);
    const destFontPath = path.join(userFontDir, fontFileName);
    
    return new Promise((resolve, reject) => {
      // Check if font exists in user font directory
      if (!fs.existsSync(destFontPath)) {
        // Remove from active fonts list
        this.activeFonts = this.activeFonts.filter(f => f !== fontPath);
        this.saveActiveFonts();
        resolve(true);
        return;
      }
      
      // Delete font file from user font directory
      fs.unlink(destFontPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Remove from active fonts list
        this.activeFonts = this.activeFonts.filter(f => f !== fontPath);
        this.saveActiveFonts();
        
        resolve(true);
      });
    });
  }
  
  /**
   * Activate a font on Linux
   * @param {string} fontPath - Path to the font file
   * @returns {Promise<boolean>} - Success status
   */
  async activateFontLinux(fontPath) {
    const userFontDir = path.join(os.homedir(), '.local/share/fonts');
    if (!fs.existsSync(userFontDir)) {
      fs.mkdirSync(userFontDir, { recursive: true });
    }
    
    const fontFileName = path.basename(fontPath);
    const destFontPath = path.join(userFontDir, fontFileName);
    
    return new Promise((resolve, reject) => {
      // Check if font is already installed
      if (fs.existsSync(destFontPath)) {
        if (!this.activeFonts.includes(fontPath)) {
          this.activeFonts.push(fontPath);
          this.saveActiveFonts();
        }
        resolve(true);
        return;
      }
      
      // Copy font file to user font directory
      fs.copyFile(fontPath, destFontPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Refresh font cache
        exec('fc-cache -f', (error) => {
          if (error) {
            console.warn('Failed to refresh font cache:', error);
          }
          
          // Add to active fonts list
          if (!this.activeFonts.includes(fontPath)) {
            this.activeFonts.push(fontPath);
            this.saveActiveFonts();
          }
          
          resolve(true);
        });
      });
    });
  }
  
  /**
   * Deactivate a font on Linux
   * @param {string} fontPath - Path to the font file
   * @returns {Promise<boolean>} - Success status
   */
  async deactivateFontLinux(fontPath) {
    const userFontDir = path.join(os.homedir(), '.local/share/fonts');
    const fontFileName = path.basename(fontPath);
    const destFontPath = path.join(userFontDir, fontFileName);
    
    return new Promise((resolve, reject) => {
      // Check if font exists in user font directory
      if (!fs.existsSync(destFontPath)) {
        // Remove from active fonts list
        this.activeFonts = this.activeFonts.filter(f => f !== fontPath);
        this.saveActiveFonts();
        resolve(true);
        return;
      }
      
      // Delete font file from user font directory
      fs.unlink(destFontPath, (err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Refresh font cache
        exec('fc-cache -f', (error) => {
          if (error) {
            console.warn('Failed to refresh font cache:', error);
          }
          
          // Remove from active fonts list
          this.activeFonts = this.activeFonts.filter(f => f !== fontPath);
          this.saveActiveFonts();
          
          resolve(true);
        });
      });
    });
  }
}

module.exports = new FontManager();
