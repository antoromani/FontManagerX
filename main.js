const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const fontManager = require('./src/utils/fontManager');
const { getSystemFonts } = require('./src/utils/systemFonts');
const { loadLocalFonts } = require('./src/utils/localFonts');
const { loadGoogleFonts } = require('./src/utils/googleFonts');
const { 
  getCollections, 
  addToCollection, 
  removeFromCollection, 
  createCollection, 
  deleteCollection 
} = require('./src/utils/collections');
const { getFavorites, toggleFavorite } = require('./src/utils/favorites');

let mainWindow;

// Ensure user data directory exists
const userDataPath = app.getPath('userData');
const collectionsPath = path.join(userDataPath, 'collections');
const favoritesPath = path.join(userDataPath, 'favorites.json');
const localFoldersPath = path.join(userDataPath, 'localFolders.json');

function createAppDirectories() {
  if (!fs.existsSync(collectionsPath)) {
    fs.mkdirSync(collectionsPath, { recursive: true });
  }
  
  if (!fs.existsSync(favoritesPath)) {
    fs.writeFileSync(favoritesPath, JSON.stringify([]));
  }
  
  if (!fs.existsSync(localFoldersPath)) {
    fs.writeFileSync(localFoldersPath, JSON.stringify([]));
  }
}

function createWindow() {
  createAppDirectories();
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'assets/app-icon.png')
  });

  mainWindow.loadFile('index.html');
  
  // Uncomment for development debugging
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC handlers

// Font Management
ipcMain.handle('get-system-fonts', async () => {
  return await getSystemFonts();
});

ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (!result.canceled) {
    const folderPath = result.filePaths[0];
    const savedFolders = JSON.parse(fs.readFileSync(localFoldersPath));
    
    if (!savedFolders.includes(folderPath)) {
      savedFolders.push(folderPath);
      fs.writeFileSync(localFoldersPath, JSON.stringify(savedFolders));
    }
    
    return folderPath;
  }
  
  return null;
});

ipcMain.handle('get-local-folders', () => {
  return JSON.parse(fs.readFileSync(localFoldersPath));
});

ipcMain.handle('load-local-fonts', async (event, folderPath) => {
  return await loadLocalFonts(folderPath);
});

ipcMain.handle('get-google-fonts', async () => {
  return await loadGoogleFonts();
});

ipcMain.handle('activate-font', async (event, fontPath) => {
  try {
    await fontManager.activateFont(fontPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('deactivate-font', async (event, fontPath) => {
  try {
    await fontManager.deactivateFont(fontPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-active-fonts', async () => {
  return await fontManager.getActiveFonts();
});

// Collections
ipcMain.handle('get-collections', async () => {
  return await getCollections(collectionsPath);
});

ipcMain.handle('create-collection', async (event, name) => {
  return await createCollection(collectionsPath, name);
});

ipcMain.handle('delete-collection', async (event, name) => {
  return await deleteCollection(collectionsPath, name);
});

ipcMain.handle('add-to-collection', async (event, collection, fontData) => {
  return await addToCollection(collectionsPath, collection, fontData);
});

ipcMain.handle('remove-from-collection', async (event, collection, fontId) => {
  return await removeFromCollection(collectionsPath, collection, fontId);
});

// Favorites
ipcMain.handle('get-favorites', async () => {
  return await getFavorites(favoritesPath);
});

ipcMain.handle('toggle-favorite', async (event, fontData) => {
  return await toggleFavorite(favoritesPath, fontData);
});

ipcMain.handle('open-font-location', async (event, fontPath) => {
  const { shell } = require('electron');
  if (fs.existsSync(fontPath)) {
    shell.showItemInFolder(fontPath);
    return true;
  }
  return false;
});
