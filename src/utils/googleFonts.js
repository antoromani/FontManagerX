const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

// API key is not required for basic usage of Google Fonts API
const GOOGLE_FONTS_API_URL = 'https://www.googleapis.com/webfonts/v1/webfonts?key=';
const GOOGLE_FONTS_API_KEY = process.env.GOOGLE_FONTS_API_KEY || '';

// Cache configuration
const CACHE_DIR = path.join(
  process.env.APPDATA || 
  (process.platform === 'darwin' ? 
    path.join(os.homedir(), 'Library/Application Support') : 
    path.join(os.homedir(), '.config')),
  'FontManager',
  'cache'
);
const FONTS_CACHE_FILE = path.join(CACHE_DIR, 'google-fonts-cache.json');
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Ensure cache directory exists
 */
function ensureCacheDirectory() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Check if cache is valid (exists and not expired)
 * @returns {boolean} - True if cache is valid
 */
function isCacheValid() {
  try {
    if (!fs.existsSync(FONTS_CACHE_FILE)) {
      return false;
    }
    
    const stats = fs.statSync(FONTS_CACHE_FILE);
    const cacheAge = Date.now() - stats.mtimeMs;
    
    return cacheAge < CACHE_TTL;
  } catch (error) {
    console.error('Error checking cache validity:', error);
    return false;
  }
}

/**
 * Fetch data from Google Fonts API
 * @returns {Promise<Array>} - Array of font objects
 */
function fetchFromGoogleFontsAPI() {
  return new Promise((resolve, reject) => {
    const apiUrl = `${GOOGLE_FONTS_API_URL}${GOOGLE_FONTS_API_KEY}`;
    
    https.get(apiUrl, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            reject(new Error(`Failed to fetch Google Fonts: ${res.statusCode} ${res.statusMessage}`));
            return;
          }
          
          const jsonData = JSON.parse(data);
          
          if (!jsonData.items) {
            reject(new Error('Invalid Google Fonts API response format'));
            return;
          }
          
          // Limit number of fonts to prevent performance issues
          const MAX_FONTS = 300;
          const fonts = jsonData.items.slice(0, MAX_FONTS).map(font => {
            const variants = font.variants ? font.variants.filter(v => v !== 'regular').join(', ') : '';
            
            return {
              family: font.family,
              styles: variants,
              category: font.category,
              id: `google-${font.family}`,
              variants: font.variants,
              type: 'google',
              active: false // Google fonts are not active by default
            };
          });
          
          // Save to cache
          ensureCacheDirectory();
          fs.writeFileSync(FONTS_CACHE_FILE, JSON.stringify(fonts));
          
          resolve(fonts);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Load Google Fonts from cache or API
 * @returns {Promise<Array>} - Array of font objects
 */
async function loadGoogleFonts() {
  try {
    if (isCacheValid()) {
      // Use cached data
      const cachedData = fs.readFileSync(FONTS_CACHE_FILE, 'utf8');
      return JSON.parse(cachedData);
    } else {
      // Fetch fresh data from API
      return await fetchFromGoogleFontsAPI();
    }
  } catch (error) {
    console.error('Error loading Google Fonts:', error);
    
    // Try to use cached data even if expired
    if (fs.existsSync(FONTS_CACHE_FILE)) {
      try {
        const cachedData = fs.readFileSync(FONTS_CACHE_FILE, 'utf8');
        return JSON.parse(cachedData);
      } catch (cacheError) {
        console.error('Error reading cache:', cacheError);
      }
    }
    
    // Return empty array if all methods fail
    return [];
  }
}

module.exports = { loadGoogleFonts };
