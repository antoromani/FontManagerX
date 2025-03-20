const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // Font Management
    getSystemFonts: () => ipcRenderer.invoke('get-system-fonts'),
    openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
    getLocalFolders: () => ipcRenderer.invoke('get-local-folders'),
    loadLocalFonts: (folderPath) => ipcRenderer.invoke('load-local-fonts', folderPath),
    getGoogleFonts: () => ipcRenderer.invoke('get-google-fonts'),
    activateFont: (fontPath) => ipcRenderer.invoke('activate-font', fontPath),
    deactivateFont: (fontPath) => ipcRenderer.invoke('deactivate-font', fontPath),
    getActiveFonts: () => ipcRenderer.invoke('get-active-fonts'),
    
    // Collections
    getCollections: () => ipcRenderer.invoke('get-collections'),
    createCollection: (name) => ipcRenderer.invoke('create-collection', name),
    deleteCollection: (name) => ipcRenderer.invoke('delete-collection', name),
    addToCollection: (collection, fontData) => ipcRenderer.invoke('add-to-collection', collection, fontData),
    removeFromCollection: (collection, fontId) => ipcRenderer.invoke('remove-from-collection', collection, fontId),
    
    // Favorites
    getFavorites: () => ipcRenderer.invoke('get-favorites'),
    toggleFavorite: (fontData) => ipcRenderer.invoke('toggle-favorite', fontData),
    
    // Utilities
    openFontLocation: (fontPath) => ipcRenderer.invoke('open-font-location', fontPath)
  }
);
