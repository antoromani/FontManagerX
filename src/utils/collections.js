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
      if (!fs.existsSync(collectionsPath)) {
        fs.mkdirSync(collectionsPath, { recursive: true });
        resolve([]);
        return;
      }
      
      fs.readdir(collectionsPath, (err, files) => {
        if (err) {
          reject(err);
          return;
        }
        
        const collections = [];
        
        // Process each collection file
        files.forEach(file => {
          if (file.endsWith('.json')) {
            try {
              const collectionPath = path.join(collectionsPath, file);
              const collectionData = fs.readFileSync(collectionPath, 'utf8');
              const collection = JSON.parse(collectionData);
              
              collections.push({
                name: collection.name,
                fonts: collection.fonts || [],
                id: collection.id || collection.name.toLowerCase().replace(/\s+/g, '-')
              });
            } catch (readError) {
              console.error(`Error reading collection ${file}:`, readError);
            }
          }
        });
        
        resolve(collections);
      });
    } catch (error) {
      reject(error);
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
      if (!name) {
        reject(new Error('Collection name is required'));
        return;
      }
      
      if (!fs.existsSync(collectionsPath)) {
        fs.mkdirSync(collectionsPath, { recursive: true });
      }
      
      const id = name.toLowerCase().replace(/\s+/g, '-');
      const collectionPath = path.join(collectionsPath, `${id}.json`);
      
      // Check if collection already exists
      if (fs.existsSync(collectionPath)) {
        reject(new Error(`Collection "${name}" already exists`));
        return;
      }
      
      const collection = {
        name,
        id,
        fonts: []
      };
      
      fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
      
      resolve(collection);
    } catch (error) {
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
      if (!name) {
        reject(new Error('Collection name is required'));
        return;
      }
      
      const id = name.toLowerCase().replace(/\s+/g, '-');
      const collectionPath = path.join(collectionsPath, `${id}.json`);
      
      // Check if collection exists
      if (!fs.existsSync(collectionPath)) {
        reject(new Error(`Collection "${name}" does not exist`));
        return;
      }
      
      fs.unlinkSync(collectionPath);
      
      resolve(true);
    } catch (error) {
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
      if (!collectionName) {
        reject(new Error('Collection name is required'));
        return;
      }
      
      if (!fontData) {
        reject(new Error('Font data is required'));
        return;
      }
      
      const id = collectionName.toLowerCase().replace(/\s+/g, '-');
      const collectionPath = path.join(collectionsPath, `${id}.json`);
      
      // Check if collection exists
      if (!fs.existsSync(collectionPath)) {
        reject(new Error(`Collection "${collectionName}" does not exist`));
        return;
      }
      
      // Read collection data
      const collectionData = fs.readFileSync(collectionPath, 'utf8');
      const collection = JSON.parse(collectionData);
      
      // Check if font already exists in collection
      const fontExists = collection.fonts.some(font => font.id === fontData.id);
      
      if (!fontExists) {
        collection.fonts.push(fontData);
        fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
      }
      
      resolve(collection);
    } catch (error) {
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
      if (!collectionName) {
        reject(new Error('Collection name is required'));
        return;
      }
      
      if (!fontId) {
        reject(new Error('Font ID is required'));
        return;
      }
      
      const id = collectionName.toLowerCase().replace(/\s+/g, '-');
      const collectionPath = path.join(collectionsPath, `${id}.json`);
      
      // Check if collection exists
      if (!fs.existsSync(collectionPath)) {
        reject(new Error(`Collection "${collectionName}" does not exist`));
        return;
      }
      
      // Read collection data
      const collectionData = fs.readFileSync(collectionPath, 'utf8');
      const collection = JSON.parse(collectionData);
      
      // Remove font from collection
      collection.fonts = collection.fonts.filter(font => font.id !== fontId);
      
      fs.writeFileSync(collectionPath, JSON.stringify(collection, null, 2));
      
      resolve(collection);
    } catch (error) {
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
