/**
 * Font Manager class
 * Manages font activation/deactivation via Python helper script
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

class FontManager {
  constructor() {
    // Path to Python script
    this.pythonScript = path.join(__dirname, '../../python_helpers/font_manager.py');
    
    // Path to active fonts cache file
    this.userDataDir = path.join(os.homedir(), '.fonter');
    this.activeFontsFile = path.join(this.userDataDir, 'active-fonts.json');
    
    // Create user data directory if it doesn't exist
    if (!fs.existsSync(this.userDataDir)) {
      fs.mkdirSync(this.userDataDir, { recursive: true });
    }
    
    // Load active fonts
    this.activeFonts = this.loadActiveFonts();
  }
  
  /**
   * Load active fonts from cache file
   */
  loadActiveFonts() {
    try {
      if (fs.existsSync(this.activeFontsFile)) {
        return JSON.parse(fs.readFileSync(this.activeFontsFile, 'utf8'));
      }
    } catch (error) {
      console.error('Error loading active fonts:', error);
    }
    
    return [];
  }
  
  /**
   * Save active fonts to cache file
   */
  saveActiveFonts() {
    try {
      fs.writeFileSync(this.activeFontsFile, JSON.stringify(this.activeFonts, null, 2));
    } catch (error) {
      console.error('Error saving active fonts:', error);
    }
  }
  
  /**
   * Execute Python helper script with arguments
   * @param {Array} args - Command line arguments to pass to Python script
   * @returns {Promise<Object>} - Script output as parsed JSON
   */
  runPythonScript(args) {
    return new Promise((resolve, reject) => {
      console.log(`Running Python command: python ${this.pythonScript} ${args.join(' ')}`);
      
      const process = spawn('python', [this.pythonScript, ...args]);
      
      let stdoutData = '';
      let stderrData = '';
      
      // Collect stdout data
      process.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });
      
      // Collect stderr data
      process.stderr.on('data', (data) => {
        stderrData += data.toString();
        console.error(`Python error: ${data.toString()}`);
      });
      
      // Handle process completion
      process.on('close', (code) => {
        if (code !== 0) {
          console.error(`Python script exited with code ${code}`);
          console.error(`Error output: ${stderrData}`);
          reject(new Error(`Python script exited with code ${code}: ${stderrData}`));
          return;
        }
        
        try {
          // Try to parse the output as JSON
          const result = JSON.parse(stdoutData);
          resolve(result);
        } catch (error) {
          console.error('Failed to parse Python script output:', error);
          console.error('Raw output:', stdoutData);
          reject(error);
        }
      });
      
      // Handle process errors
      process.on('error', (error) => {
        console.error('Failed to start Python script:', error);
        reject(error);
      });
    });
  }
  
  /**
   * Activate a font
   * @param {string} fontPath - Path to the font file
   * @returns {Promise<boolean>} - Success status
   */
  async activateFont(fontPath) {
    try {
      const result = await this.runPythonScript(['activate', fontPath]);
      
      if (result.success) {
        // Add to active fonts list
        if (!this.activeFonts.includes(fontPath)) {
          this.activeFonts.push(fontPath);
          this.saveActiveFonts();
        }
      }
      
      return result.success;
    } catch (error) {
      console.error('Error activating font:', error);
      return false;
    }
  }
  
  /**
   * Deactivate a font
   * @param {string} fontPath - Path to the font file
   * @returns {Promise<boolean>} - Success status
   */
  async deactivateFont(fontPath) {
    try {
      const result = await this.runPythonScript(['deactivate', fontPath]);
      
      if (result.success) {
        // Remove from active fonts list
        const index = this.activeFonts.indexOf(fontPath);
        if (index >= 0) {
          this.activeFonts.splice(index, 1);
          this.saveActiveFonts();
        }
      }
      
      return result.success;
    } catch (error) {
      console.error('Error deactivating font:', error);
      return false;
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
    try {
      const result = await this.runPythonScript(['list']);
      return result.fonts || [];
    } catch (error) {
      console.error('Error getting active fonts:', error);
      return this.activeFonts;
    }
  }
}

module.exports = new FontManager();