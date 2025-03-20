/**
 * Collections module
 * Provides functions to manage font collections
 */

const fs = require('fs');
const path = require('path');

/**
 * Get all collections
 * @param {string} collectionsPath - Path to collections directory
 * @returns {Promise<Array>} - Array of collection objects
 */
async function getCollections(collectionsPath) {
  return new Promise((resolve, reject) => {
    try {
      // Create collections directory if it doesn't exist
      if (!fs.existsSync(collectionsPath)) {
        fs.mkdirSync(collectionsPath, { recursive: true });
      }
      
      fs.readdir(collectionsPath, (err, files) => {
        if (err) {
          console.error('Error reading collections directory:', err);
          return resolve([]);
        }
        
        // Filter for JSON files (collections)
        const collectionFiles = files.filter(file => path.extname(file).toLowerCase() === '.json');
        
        const collections = [];
        
        collectionFiles.forEach(file => {
          try {
            const collectionPath = path.join(collectionsPath, file);
            const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
            collections.push(collection);
          } catch (error) {
            console.error(`Error reading collection file ${file}:`, error);
          }
        });
        
        resolve(collections);
      });
    } catch (error) {
      console.error('Error getting collections:', error);
      resolve([]);
    }
  });
}

/**
 * Create a new collection
 * @param {string} collectionsPath - Path to collections directory
 * @param {string} name - Collection name
 * @returns {Promise<Object>} - Created collection object
 */
async function createCollection(collectionsPath, name) {
  return new Promise((resolve, reject) => {
    try {
      // Create collections directory if it doesn't exist
      if (!fs.existsSync(collectionsPath)) {
        fs.mkdirSync(collectionsPath, { recursive: true });
      }
      
      // Check if collection already exists
      const collectionPath = path.join(collectionsPath, `${name.replace(/[^\w\s]/g, '')}.json`);
      
      if (fs.existsSync(collectionPath)) {
        return reject(new Error(`Collection "${name}" already exists`));
      }
      
      // Create new collection
      const collection = {
        name,
        createdAt: new Date().toISOString(),
        fonts: []
      };
      
      // Save collection
      fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
      
      resolve(collection);
    } catch (error) {
      console.error('Error creating collection:', error);
      reject(error);
    }
  });
}

/**
 * Delete a collection
 * @param {string} collectionsPath - Path to collections directory
 * @param {string} name - Collection name
 * @returns {Promise<boolean>} - Success status
 */
async function deleteCollection(collectionsPath, name) {
  return new Promise((resolve, reject) => {
    try {
      const collectionPath = path.join(collectionsPath, `${name.replace(/[^\w\s]/g, '')}.json`);
      
      if (!fs.existsSync(collectionPath)) {
        return reject(new Error(`Collection "${name}" doesn't exist`));
      }
      
      // Delete collection
      fs.unlinkSync(collectionPath);
      
      resolve(true);
    } catch (error) {
      console.error('Error deleting collection:', error);
      reject(error);
    }
  });
}

/**
 * Add a font to a collection
 * @param {string} collectionsPath - Path to collections directory
 * @param {string} collectionName - Collection name
 * @param {Object} fontData - Font data
 * @returns {Promise<Object>} - Updated collection object
 */
async function addToCollection(collectionsPath, collectionName, fontData) {
  return new Promise((resolve, reject) => {
    try {
      const collectionPath = path.join(collectionsPath, `${collectionName.replace(/[^\w\s]/g, '')}.json`);
      
      if (!fs.existsSync(collectionPath)) {
        return reject(new Error(`Collection "${collectionName}" doesn't exist`));
      }
      
      // Read collection
      const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
      
      // Check if font already exists in collection
      const fontExists = collection.fonts.some(font => font.id === fontData.id);
      
      if (!fontExists) {
        // Add font to collection
        collection.fonts.push(fontData);
        
        // Save collection
        fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
      }
      
      resolve(collection);
    } catch (error) {
      console.error('Error adding font to collection:', error);
      reject(error);
    }
  });
}

/**
 * Remove a font from a collection
 * @param {string} collectionsPath - Path to collections directory
 * @param {string} collectionName - Collection name
 * @param {string} fontId - Font ID
 * @returns {Promise<Object>} - Updated collection object
 */
async function removeFromCollection(collectionsPath, collectionName, fontId) {
  return new Promise((resolve, reject) => {
    try {
      const collectionPath = path.join(collectionsPath, `${collectionName.replace(/[^\w\s]/g, '')}.json`);
      
      if (!fs.existsSync(collectionPath)) {
        return reject(new Error(`Collection "${collectionName}" doesn't exist`));
      }
      
      // Read collection
      const collection = JSON.parse(fs.readFileSync(collectionPath, 'utf8'));
      
      // Remove font from collection
      collection.fonts = collection.fonts.filter(font => font.id !== fontId);
      
      // Save collection
      fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
      
      resolve(collection);
    } catch (error) {
      console.error('Error removing font from collection:', error);
      reject(error);
    }
  });
}

module.exports = {
  getCollections,
  createCollection,
  deleteCollection,
  addToCollection,
  removeFromCollection
};