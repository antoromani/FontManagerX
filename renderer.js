// Global variables
let currentCategory = 'system';
let currentCollection = null;
let currentFolderPath = null;
let fontsList = [];
let systemFontsList = [];
let localFoldersList = [];
let googleFontsList = [];
let collectionsList = [];
let favoritesList = [];
let activeFontsList = [];
let searchQuery = '';
let sampleText = 'The quick brown fox jumps over the lazy dog';
let fontSize = 24;
let loadedFontFamilies = new Set();
let intersectionObserver = null;

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const menuItems = document.querySelectorAll('.menu-item');
const foldersContainer = document.getElementById('folders-container');
const collectionsContainer = document.getElementById('collections-container');
const folderList = document.getElementById('folder-list');
const collectionsList = document.getElementById('collections-list');
const fontListContainer = document.getElementById('font-list-container');
const fontList = document.getElementById('font-list');
const fontCount = document.getElementById('font-count');
const loadingIndicator = document.getElementById('loading-indicator');
const emptyState = document.getElementById('empty-state');
const sampleTextInput = document.getElementById('sample-text');
const fontSizeInput = document.getElementById('font-size');
const fontSizeValue = document.getElementById('font-size-value');
const createCollectionModal = document.getElementById('create-collection-modal');
const createCollectionBtn = document.getElementById('create-collection-btn');
const saveCollectionBtn = document.getElementById('save-collection-btn');
const cancelCollectionBtn = document.getElementById('cancel-collection-btn');
const closeModalBtn = document.querySelector('.close-btn');
const collectionNameInput = document.getElementById('collection-name');
const addFolderBtn = document.getElementById('add-folder-btn');

// Template
const fontItemTemplate = document.getElementById('font-item-template');

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  setupIntersectionObserver();
  await loadSystemFonts();
});

// Setup intersection observer for lazy loading
function setupIntersectionObserver() {
  intersectionObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fontItem = entry.target;
        const fontFamily = fontItem.dataset.fontFamily;
        const fontSample = fontItem.querySelector('.font-sample');
        
        // Only load if not already loaded
        if (fontSample.style.fontFamily !== fontFamily) {
          fontSample.style.fontFamily = fontFamily;
          fontSample.style.fontSize = `${fontSize}px`;
        }
        
        // Stop observing once loaded
        observer.unobserve(fontItem);
      }
    });
  }, {
    rootMargin: '100px 0px',
    threshold: 0.1
  });
}

// Event listeners
function setupEventListeners() {
  // Menu navigation
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const category = item.dataset.category;
      switchCategory(category);
    });
  });
  
  // Search
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    renderFontList();
  });
  
  searchBtn.addEventListener('click', () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    renderFontList();
  });
  
  // Sample text
  sampleTextInput.addEventListener('input', () => {
    sampleText = sampleTextInput.value;
    updateAllFontSamples();
  });
  
  // Font size
  fontSizeInput.addEventListener('input', () => {
    fontSize = parseInt(fontSizeInput.value);
    fontSizeValue.textContent = `${fontSize}px`;
    updateAllFontSamples();
  });
  
  // Add folder
  addFolderBtn.addEventListener('click', async () => {
    const folderPath = await window.api.openFolderDialog();
    if (folderPath) {
      await loadLocalFolders();
      loadFontsByFolder(folderPath);
    }
  });
  
  // Collection modal
  createCollectionBtn.addEventListener('click', () => {
    createCollectionModal.classList.remove('hidden');
  });
  
  saveCollectionBtn.addEventListener('click', async () => {
    const name = collectionNameInput.value.trim();
    if (name) {
      await window.api.createCollection(name);
      await loadCollections();
      createCollectionModal.classList.add('hidden');
      collectionNameInput.value = '';
    }
  });
  
  cancelCollectionBtn.addEventListener('click', () => {
    createCollectionModal.classList.add('hidden');
    collectionNameInput.value = '';
  });
  
  closeModalBtn.addEventListener('click', () => {
    createCollectionModal.classList.add('hidden');
    collectionNameInput.value = '';
  });
}

// Navigation
function switchCategory(category) {
  // Update menu active state
  menuItems.forEach(item => {
    if (item.dataset.category === category) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
  
  // Hide/show containers
  foldersContainer.classList.add('hidden');
  collectionsContainer.classList.add('hidden');
  
  // Handle specific category actions
  currentCategory = category;
  
  switch (category) {
    case 'system':
      loadSystemFonts();
      break;
    case 'folders':
      foldersContainer.classList.remove('hidden');
      loadLocalFolders();
      break;
    case 'online':
      loadGoogleFonts();
      break;
    case 'collections':
      collectionsContainer.classList.remove('hidden');
      loadCollections();
      break;
    case 'active':
      loadActiveFonts();
      break;
    case 'favorites':
      loadFavorites();
      break;
  }
}

// Font loading functions
async function loadSystemFonts() {
  showLoading();
  try {
    systemFontsList = await window.api.getSystemFonts();
    fontsList = systemFontsList;
    renderFontList();
  } catch (error) {
    console.error('Error loading system fonts:', error);
    showEmptyState();
  }
}

async function loadLocalFolders() {
  showLoading();
  try {
    localFoldersList = await window.api.getLocalFolders();
    renderFolderList();
    
    // If no folders, show empty state
    if (localFoldersList.length === 0) {
      showEmptyState();
    } else if (!currentFolderPath) {
      // Load the first folder by default
      loadFontsByFolder(localFoldersList[0]);
    }
  } catch (error) {
    console.error('Error loading local folders:', error);
    showEmptyState();
  }
}

async function loadFontsByFolder(folderPath) {
  showLoading();
  try {
    currentFolderPath = folderPath;
    
    // Highlight the selected folder
    const folderItems = folderList.querySelectorAll('li');
    folderItems.forEach(item => {
      if (item.dataset.path === folderPath) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    const localFonts = await window.api.loadLocalFonts(folderPath);
    fontsList = localFonts;
    renderFontList();
  } catch (error) {
    console.error('Error loading fonts from folder:', error);
    showEmptyState();
  }
}

async function loadGoogleFonts() {
  showLoading();
  try {
    if (googleFontsList.length === 0) {
      googleFontsList = await window.api.getGoogleFonts();
    }
    fontsList = googleFontsList;
    renderFontList();
  } catch (error) {
    console.error('Error loading Google fonts:', error);
    showEmptyState();
  }
}

async function loadCollections() {
  showLoading();
  try {
    collectionsList = await window.api.getCollections();
    renderCollectionsList();
    
    if (collectionsList.length === 0) {
      showEmptyState();
    } else if (currentCollection) {
      // If a collection was selected, load its fonts
      loadCollectionFonts(currentCollection);
    }
  } catch (error) {
    console.error('Error loading collections:', error);
    showEmptyState();
  }
}

async function loadCollectionFonts(collectionName) {
  showLoading();
  try {
    currentCollection = collectionName;
    
    // Highlight the selected collection
    const collectionItems = collectionsList.querySelectorAll('li');
    collectionItems.forEach(item => {
      if (item.dataset.name === collectionName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    // Find the collection in the list
    const collection = collectionsList.find(c => c.name === collectionName);
    if (collection) {
      fontsList = collection.fonts;
      renderFontList();
    } else {
      showEmptyState();
    }
  } catch (error) {
    console.error('Error loading collection fonts:', error);
    showEmptyState();
  }
}

async function loadActiveFonts() {
  showLoading();
  try {
    activeFontsList = await window.api.getActiveFonts();
    fontsList = activeFontsList;
    renderFontList();
  } catch (error) {
    console.error('Error loading active fonts:', error);
    showEmptyState();
  }
}

async function loadFavorites() {
  showLoading();
  try {
    favoritesList = await window.api.getFavorites();
    fontsList = favoritesList;
    renderFontList();
  } catch (error) {
    console.error('Error loading favorites:', error);
    showEmptyState();
  }
}

// UI rendering functions
function renderFolderList() {
  folderList.innerHTML = '';
  
  localFoldersList.forEach(folderPath => {
    const li = document.createElement('li');
    li.dataset.path = folderPath;
    
    // Get folder name from path
    const folderName = folderPath.split('/').pop();
    
    li.innerHTML = `
      <svg class="feather-icon">
        <use href="assets/feather-icons.svg#folder"/>
      </svg>
      <span>${folderName}</span>
    `;
    
    li.addEventListener('click', () => {
      loadFontsByFolder(folderPath);
    });
    
    folderList.appendChild(li);
  });
}

function renderCollectionsList() {
  collectionsContainer.querySelector('ul').innerHTML = '';
  
  collectionsList.forEach(collection => {
    const li = document.createElement('li');
    li.dataset.name = collection.name;
    
    li.innerHTML = `
      <svg class="feather-icon">
        <use href="assets/feather-icons.svg#grid"/>
      </svg>
      <span>${collection.name}</span>
    `;
    
    li.addEventListener('click', () => {
      loadCollectionFonts(collection.name);
    });
    
    collectionsContainer.querySelector('ul').appendChild(li);
  });
}

function renderFontList() {
  fontList.innerHTML = '';
  
  // Filter fonts based on search query
  let filteredFonts = fontsList;
  if (searchQuery) {
    filteredFonts = fontsList.filter(font => 
      font.family.toLowerCase().includes(searchQuery) || 
      (font.style && font.style.toLowerCase().includes(searchQuery))
    );
  }
  
  // Update count
  fontCount.textContent = `${filteredFonts.length} fonts`;
  
  // Show empty state if no fonts
  if (filteredFonts.length === 0) {
    showEmptyState();
    return;
  }
  
  // Group fonts by family
  const fontsByFamily = groupFontsByFamily(filteredFonts);
  
  // Render each font family group
  Object.keys(fontsByFamily).sort().forEach(family => {
    const fonts = fontsByFamily[family];
    
    // Create family header
    const familyHeader = document.createElement('div');
    familyHeader.className = 'font-family-header';
    familyHeader.textContent = family;
    
    // Create family group
    const familyGroup = document.createElement('div');
    familyGroup.className = 'font-family-group';
    familyGroup.appendChild(familyHeader);
    
    // Add font items to the family group
    fonts.forEach(font => {
      const fontItem = createFontItem(font);
      familyGroup.appendChild(fontItem);
    });
    
    fontList.appendChild(familyGroup);
  });
  
  hideLoading();
  hideEmptyState();
}

function groupFontsByFamily(fonts) {
  const fontsByFamily = {};
  
  fonts.forEach(font => {
    if (!fontsByFamily[font.family]) {
      fontsByFamily[font.family] = [];
    }
    fontsByFamily[font.family].push(font);
  });
  
  return fontsByFamily;
}

function createFontItem(font) {
  const template = fontItemTemplate.content.cloneNode(true);
  const fontItem = template.querySelector('.font-item');
  
  // Set data attributes
  fontItem.dataset.fontFamily = font.family;
  fontItem.dataset.fontId = font.id || `${font.family}-${font.style || 'Regular'}`;
  if (font.path) {
    fontItem.dataset.fontPath = font.path;
  }
  
  // Set font info
  const fontNameEl = fontItem.querySelector('.font-name');
  fontNameEl.textContent = font.family;
  
  const fontStyleEl = fontItem.querySelector('.font-style');
  fontStyleEl.textContent = font.style || 'Regular';
  
  // Set font sample
  const fontSampleEl = fontItem.querySelector('.font-sample');
  fontSampleEl.textContent = sampleText;
  
  // Setup action buttons
  const toggleActivateBtn = fontItem.querySelector('.toggle-activate-btn');
  const toggleFavoriteBtn = fontItem.querySelector('.toggle-favorite-btn');
  const openLocationBtn = fontItem.querySelector('.open-location-btn');
  const addToCollectionBtn = fontItem.querySelector('.add-to-collection-btn');
  
  // Set initial states
  if (font.active) {
    toggleActivateBtn.classList.add('active');
    toggleActivateBtn.querySelector('use').setAttribute('href', 'assets/feather-icons.svg#toggle-right');
  } else {
    toggleActivateBtn.classList.remove('active');
    toggleActivateBtn.querySelector('use').setAttribute('href', 'assets/feather-icons.svg#toggle-left');
  }
  
  if (font.favorite) {
    toggleFavoriteBtn.classList.add('active');
  }
  
  // Hide location button for online fonts
  if (font.type === 'google' || !font.path) {
    openLocationBtn.style.display = 'none';
  }
  
  // Event listeners for buttons
  toggleActivateBtn.addEventListener('click', async () => {
    const isActive = toggleActivateBtn.classList.contains('active');
    
    try {
      if (isActive) {
        await window.api.deactivateFont(font.path);
        toggleActivateBtn.classList.remove('active');
        toggleActivateBtn.querySelector('use').setAttribute('href', 'assets/feather-icons.svg#toggle-left');
      } else {
        await window.api.activateFont(font.path);
        toggleActivateBtn.classList.add('active');
        toggleActivateBtn.querySelector('use').setAttribute('href', 'assets/feather-icons.svg#toggle-right');
      }
      
      // Refresh active fonts list if we're in that category
      if (currentCategory === 'active') {
        await loadActiveFonts();
      }
    } catch (error) {
      console.error('Error toggling font activation:', error);
    }
  });
  
  toggleFavoriteBtn.addEventListener('click', async () => {
    try {
      await window.api.toggleFavorite(font);
      toggleFavoriteBtn.classList.toggle('active');
      
      // Refresh favorites list if we're in that category
      if (currentCategory === 'favorites') {
        await loadFavorites();
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  });
  
  openLocationBtn.addEventListener('click', async () => {
    if (font.path) {
      await window.api.openFontLocation(font.path);
    }
  });
  
  addToCollectionBtn.addEventListener('click', async () => {
    // Create a collection picker modal (simplified for now)
    const collections = await window.api.getCollections();
    
    if (collections.length === 0) {
      alert('Please create a collection first.');
      return;
    }
    
    // Simple collection selection (real implementation would have a proper modal)
    const collectionName = prompt('Select a collection to add this font to:', collections[0].name);
    
    if (collectionName && collections.some(c => c.name === collectionName)) {
      await window.api.addToCollection(collectionName, font);
      alert(`Added ${font.family} to ${collectionName}`);
    }
  });
  
  // Observe for lazy loading
  intersectionObserver.observe(fontItem);
  
  return fontItem;
}

function updateAllFontSamples() {
  const fontSamples = document.querySelectorAll('.font-sample');
  fontSamples.forEach(sample => {
    sample.textContent = sampleText;
    sample.style.fontSize = `${fontSize}px`;
  });
}

// Loading state management
function showLoading() {
  loadingIndicator.classList.remove('hidden');
  fontList.classList.add('hidden');
  emptyState.classList.add('hidden');
}

function hideLoading() {
  loadingIndicator.classList.add('hidden');
  fontList.classList.remove('hidden');
}

function showEmptyState() {
  emptyState.classList.remove('hidden');
  fontList.classList.add('hidden');
  loadingIndicator.classList.add('hidden');
}

function hideEmptyState() {
  emptyState.classList.add('hidden');
}

// Load fonts from Google Fonts API
async function loadGoogleFontStyle(family, variants = ['regular']) {
  if (loadedFontFamilies.has(family)) return;
  
  try {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/\s+/g, '+')}:${variants.join(',')}`;
    document.head.appendChild(link);
    loadedFontFamilies.add(family);
  } catch (error) {
    console.error(`Error loading Google Font ${family}:`, error);
  }
}
