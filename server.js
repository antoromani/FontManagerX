/**
 * Express server for Fonter font manager
 * Provides API endpoints to interact with Python font management script
 */

const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware to parse JSON requests
app.use(express.json());

// Serve static files from the root directory
app.use(express.static('./'));

// Path to Python script
const pythonScriptPath = path.join(__dirname, 'python_helpers', 'font_manager.py');

// Function to run Python script and return results
function runPythonScript(args) {
  return new Promise((resolve, reject) => {
    console.log(`Running Python command: python ${pythonScriptPath} ${args.join(' ')}`);
    
    const process = spawn('python', [pythonScriptPath, ...args]);
    
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

// API routes

// Get system fonts
app.get('/api/fonts/system', async (req, res) => {
  try {
    // Import the systemFonts module
    const { getSystemFonts } = require('./src/utils/systemFonts');
    const fonts = await getSystemFonts();
    res.json(fonts);
  } catch (error) {
    console.error('Error fetching system fonts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Google fonts
app.get('/api/fonts/google', async (req, res) => {
  try {
    // Import the googleFonts module
    const { loadGoogleFonts } = require('./src/utils/googleFonts');
    const fonts = await loadGoogleFonts();
    res.json(fonts);
  } catch (error) {
    console.error('Error fetching Google fonts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get local folders
app.get('/api/fonts/local/folders', (req, res) => {
  try {
    // Read local folders from cache file
    const userDataDir = app.get('userData') || path.join(process.env.HOME || process.env.USERPROFILE, '.fonter');
    const localFoldersPath = path.join(userDataDir, 'localFolders.json');
    
    if (!fs.existsSync(localFoldersPath)) {
      // Create directory if it doesn't exist
      if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
      }
      
      // Create empty file
      fs.writeFileSync(localFoldersPath, JSON.stringify([]));
    }
    
    const folders = JSON.parse(fs.readFileSync(localFoldersPath));
    res.json(folders);
  } catch (error) {
    console.error('Error fetching local folders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get fonts from a local folder
app.get('/api/fonts/local/:folderPath', async (req, res) => {
  try {
    // Get folder path from params
    const folderPath = decodeURIComponent(req.params.folderPath);
    
    // Import the localFonts module
    const { loadLocalFonts } = require('./src/utils/localFonts');
    const fonts = await loadLocalFonts(folderPath);
    res.json(fonts);
  } catch (error) {
    console.error('Error fetching local fonts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get active fonts
app.get('/api/fonts/active', async (req, res) => {
  try {
    const result = await runPythonScript(['list']);
    const activefonts = result.fonts || [];
    
    // Format fonts to match app's expected format
    const formattedFonts = activefonts.map(fontPath => {
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
    
    res.json(formattedFonts);
  } catch (error) {
    console.error('Error fetching active fonts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Activate font
app.post('/api/fonts/activate', async (req, res) => {
  try {
    const { fontPath } = req.body;
    
    if (!fontPath) {
      return res.status(400).json({ error: 'Font path is required' });
    }
    
    const result = await runPythonScript(['activate', fontPath]);
    res.json(result);
  } catch (error) {
    console.error('Error activating font:', error);
    res.status(500).json({ error: error.message });
  }
});

// Deactivate font
app.post('/api/fonts/deactivate', async (req, res) => {
  try {
    const { fontPath } = req.body;
    
    if (!fontPath) {
      return res.status(400).json({ error: 'Font path is required' });
    }
    
    const result = await runPythonScript(['deactivate', fontPath]);
    res.json(result);
  } catch (error) {
    console.error('Error deactivating font:', error);
    res.status(500).json({ error: error.message });
  }
});

// Collections routes
app.get('/api/collections', (req, res) => {
  try {
    // Import the collections module
    const { getCollections } = require('./src/utils/collections');
    const userDataDir = app.get('userData') || path.join(process.env.HOME || process.env.USERPROFILE, '.fonter');
    const collectionsPath = path.join(userDataDir, 'collections');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(collectionsPath)) {
      fs.mkdirSync(collectionsPath, { recursive: true });
    }
    
    const collections = getCollections(collectionsPath);
    res.json(collections);
  } catch (error) {
    console.error('Error fetching collections:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create collection
app.post('/api/collections', (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Collection name is required' });
    }
    
    // Import the collections module
    const { createCollection } = require('./src/utils/collections');
    const userDataDir = app.get('userData') || path.join(process.env.HOME || process.env.USERPROFILE, '.fonter');
    const collectionsPath = path.join(userDataDir, 'collections');
    
    const collection = createCollection(collectionsPath, name);
    res.json(collection);
  } catch (error) {
    console.error('Error creating collection:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete collection
app.delete('/api/collections/:name', (req, res) => {
  try {
    const { name } = req.params;
    
    // Import the collections module
    const { deleteCollection } = require('./src/utils/collections');
    const userDataDir = app.get('userData') || path.join(process.env.HOME || process.env.USERPROFILE, '.fonter');
    const collectionsPath = path.join(userDataDir, 'collections');
    
    const success = deleteCollection(collectionsPath, name);
    res.json({ success });
  } catch (error) {
    console.error('Error deleting collection:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add font to collection
app.post('/api/collections/:name/fonts', (req, res) => {
  try {
    const { name } = req.params;
    const { fontData } = req.body;
    
    if (!fontData) {
      return res.status(400).json({ error: 'Font data is required' });
    }
    
    // Import the collections module
    const { addToCollection } = require('./src/utils/collections');
    const userDataDir = app.get('userData') || path.join(process.env.HOME || process.env.USERPROFILE, '.fonter');
    const collectionsPath = path.join(userDataDir, 'collections');
    
    const collection = addToCollection(collectionsPath, name, fontData);
    res.json(collection);
  } catch (error) {
    console.error('Error adding font to collection:', error);
    res.status(500).json({ error: error.message });
  }
});

// Remove font from collection
app.delete('/api/collections/:name/fonts/:fontId', (req, res) => {
  try {
    const { name, fontId } = req.params;
    
    // Import the collections module
    const { removeFromCollection } = require('./src/utils/collections');
    const userDataDir = app.get('userData') || path.join(process.env.HOME || process.env.USERPROFILE, '.fonter');
    const collectionsPath = path.join(userDataDir, 'collections');
    
    const collection = removeFromCollection(collectionsPath, name, fontId);
    res.json(collection);
  } catch (error) {
    console.error('Error removing font from collection:', error);
    res.status(500).json({ error: error.message });
  }
});

// Favorites routes
app.get('/api/favorites', (req, res) => {
  try {
    // Import the favorites module
    const { getFavorites } = require('./src/utils/favorites');
    const userDataDir = app.get('userData') || path.join(process.env.HOME || process.env.USERPROFILE, '.fonter');
    const favoritesPath = path.join(userDataDir, 'favorites.json');
    
    // Create file if it doesn't exist
    if (!fs.existsSync(favoritesPath)) {
      // Create directory if it doesn't exist
      if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
      }
      
      // Create empty file
      fs.writeFileSync(favoritesPath, JSON.stringify([]));
    }
    
    const favorites = getFavorites(favoritesPath);
    res.json(favorites);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: error.message });
  }
});

// Toggle favorite
app.post('/api/favorites/toggle', (req, res) => {
  try {
    const { fontData } = req.body;
    
    if (!fontData) {
      return res.status(400).json({ error: 'Font data is required' });
    }
    
    // Import the favorites module
    const { toggleFavorite } = require('./src/utils/favorites');
    const userDataDir = app.get('userData') || path.join(process.env.HOME || process.env.USERPROFILE, '.fonter');
    const favoritesPath = path.join(userDataDir, 'favorites.json');
    
    const updatedFont = toggleFavorite(favoritesPath, fontData);
    res.json(updatedFont);
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve the main HTML file for any other route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Setup user data directory for application
  const userDataDir = path.join(process.env.HOME || process.env.USERPROFILE, '.fonter');
  app.set('userData', userDataDir);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
  }
  
  console.log(`User data directory: ${userDataDir}`);
});