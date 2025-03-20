/**
 * Google Fonts module
 * Provides functions to fetch and manage Google Fonts
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');

// Google Fonts API key (optional)
const API_KEY = process.env.GOOGLE_FONTS_API_KEY || '';

// Cache settings
const CACHE_DIR = path.join(os.homedir(), '.fonter', 'cache');
const GOOGLE_FONTS_CACHE_FILE = path.join(CACHE_DIR, 'google-fonts.json');
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

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
    if (!fs.existsSync(GOOGLE_FONTS_CACHE_FILE)) {
      return false;
    }
    
    const stats = fs.statSync(GOOGLE_FONTS_CACHE_FILE);
    const now = new Date().getTime();
    const fileModTime = stats.mtime.getTime();
    
    return (now - fileModTime) < CACHE_TTL;
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
    // For the demo, let's use sample Google Fonts
    resolve(getSampleGoogleFonts());
    
    // In a real implementation, this would fetch from the Google Fonts API
    /*
    const url = `https://www.googleapis.com/webfonts/v1/webfonts?key=${API_KEY}&sort=popularity`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          const fonts = response.items.map(font => {
            return {
              family: font.family,
              variants: font.variants,
              category: font.category,
              type: 'google',
              id: `google-${font.family}`
            };
          });
          
          // Save to cache
          ensureCacheDirectory();
          fs.writeFileSync(GOOGLE_FONTS_CACHE_FILE, JSON.stringify(fonts));
          
          resolve(fonts);
        } catch (error) {
          console.error('Error parsing Google Fonts API response:', error);
          reject(error);
        }
      });
    }).on('error', (error) => {
      console.error('Error fetching from Google Fonts API:', error);
      reject(error);
    });
    */
  });
}

/**
 * Load Google Fonts from cache or API
 * @returns {Promise<Array>} - Array of font objects
 */
async function loadGoogleFonts() {
  try {
    // Check if cache is valid
    if (isCacheValid()) {
      const cachedData = fs.readFileSync(GOOGLE_FONTS_CACHE_FILE, 'utf8');
      return JSON.parse(cachedData);
    }
    
    // Fetch from API if cache is invalid
    return await fetchFromGoogleFontsAPI();
  } catch (error) {
    console.error('Error loading Google Fonts:', error);
    
    // Return some sample Google Fonts as fallback
    return getSampleGoogleFonts();
  }
}

/**
 * Get sample Google Fonts for demo purposes
 * @returns {Array} - Array of sample Google Font objects
 */
function getSampleGoogleFonts() {
  // Return some popular Google Fonts as samples
  const popularGoogleFonts = [
    { family: 'Roboto', variants: ['regular', '500', '700', 'italic', '500italic', '700italic'], category: 'sans-serif', type: 'google', id: 'google-roboto' },
    { family: 'Open Sans', variants: ['regular', '600', '700', '800', 'italic', '600italic', '700italic', '800italic'], category: 'sans-serif', type: 'google', id: 'google-open-sans' },
    { family: 'Lato', variants: ['regular', '700', '900', 'italic', '700italic', '900italic'], category: 'sans-serif', type: 'google', id: 'google-lato' },
    { family: 'Montserrat', variants: ['regular', '500', '600', '700', '800', '900', 'italic', '500italic', '600italic', '700italic', '800italic', '900italic'], category: 'sans-serif', type: 'google', id: 'google-montserrat' },
    { family: 'Roboto Condensed', variants: ['regular', '700', 'italic', '700italic'], category: 'sans-serif', type: 'google', id: 'google-roboto-condensed' },
    { family: 'Source Sans Pro', variants: ['regular', '600', '700', '900', 'italic', '600italic', '700italic', '900italic'], category: 'sans-serif', type: 'google', id: 'google-source-sans-pro' },
    { family: 'Oswald', variants: ['regular', '500', '600', '700'], category: 'sans-serif', type: 'google', id: 'google-oswald' },
    { family: 'Roboto Mono', variants: ['regular', '500', '700', 'italic', '500italic', '700italic'], category: 'monospace', type: 'google', id: 'google-roboto-mono' },
    { family: 'Raleway', variants: ['regular', '500', '600', '700', '800', '900', 'italic', '500italic', '600italic', '700italic', '800italic', '900italic'], category: 'sans-serif', type: 'google', id: 'google-raleway' },
    { family: 'Noto Sans', variants: ['regular', '700', 'italic', '700italic'], category: 'sans-serif', type: 'google', id: 'google-noto-sans' },
    { family: 'Poppins', variants: ['regular', '500', '600', '700', '800', '900', 'italic', '500italic', '600italic', '700italic', '800italic', '900italic'], category: 'sans-serif', type: 'google', id: 'google-poppins' },
    { family: 'Roboto Slab', variants: ['regular', '500', '700', '900'], category: 'serif', type: 'google', id: 'google-roboto-slab' },
    { family: 'Merriweather', variants: ['regular', '700', '900', 'italic', '700italic', '900italic'], category: 'serif', type: 'google', id: 'google-merriweather' },
    { family: 'PT Sans', variants: ['regular', '700', 'italic', '700italic'], category: 'sans-serif', type: 'google', id: 'google-pt-sans' },
    { family: 'Ubuntu', variants: ['regular', '500', '700', 'italic', '500italic', '700italic'], category: 'sans-serif', type: 'google', id: 'google-ubuntu' },
    { family: 'Playfair Display', variants: ['regular', '500', '600', '700', '800', '900', 'italic', '500italic', '600italic', '700italic', '800italic', '900italic'], category: 'serif', type: 'google', id: 'google-playfair-display' },
    { family: 'Lora', variants: ['regular', '500', '600', '700', 'italic', '500italic', '600italic', '700italic'], category: 'serif', type: 'google', id: 'google-lora' },
    { family: 'Nunito', variants: ['regular', '600', '700', '800', '900', 'italic', '600italic', '700italic', '800italic', '900italic'], category: 'sans-serif', type: 'google', id: 'google-nunito' },
    { family: 'Rubik', variants: ['regular', '500', '600', '700', '800', '900', 'italic', '500italic', '600italic', '700italic', '800italic', '900italic'], category: 'sans-serif', type: 'google', id: 'google-rubik' },
    { family: 'Work Sans', variants: ['regular', '500', '600', '700', '800', '900', 'italic', '500italic', '600italic', '700italic', '800italic', '900italic'], category: 'sans-serif', type: 'google', id: 'google-work-sans' }
  ];
  
  // Flatten variants into individual font objects
  const fonts = [];
  
  popularGoogleFonts.forEach(font => {
    // Regular variant
    fonts.push({
      family: font.family,
      style: 'Regular',
      category: font.category,
      type: 'google',
      id: `${font.id}-regular`,
      variant: 'regular'
    });
    
    // Other variants
    font.variants.forEach(variant => {
      if (variant !== 'regular' && variant !== 'italic') {
        const style = variant.includes('italic') 
          ? variant.replace('italic', ' Italic').charAt(0).toUpperCase() + variant.replace('italic', ' Italic').slice(1) 
          : variant.charAt(0).toUpperCase() + variant.slice(1);
        
        fonts.push({
          family: font.family,
          style,
          category: font.category,
          type: 'google',
          id: `${font.id}-${variant}`,
          variant
        });
      }
    });
    
    // Italic variant if available
    if (font.variants.includes('italic')) {
      fonts.push({
        family: font.family,
        style: 'Italic',
        category: font.category,
        type: 'google',
        id: `${font.id}-italic`,
        variant: 'italic'
      });
    }
  });
  
  return fonts;
}

module.exports = {
  loadGoogleFonts
};