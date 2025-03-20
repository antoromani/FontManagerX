// Global variables
let currentCategory = 'system';
let currentCollection = null;
let currentFolderPath = null;
let fontsList = [];
let systemFontsList = [];
let localFoldersList = [];
let googleFontsList = [];
let collectionsArray = [];
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
const collectionsListEl = document.getElementById('collections-list');
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
    // For web version, we'll just use a prompt to enter a folder path
    const folderPath = prompt('Enter the path to a folder containing fonts:', '/path/to/fonts');
    if (folderPath) {
      // Add folder to list
      const userDataDir = sessionStorage.getItem('userDataDir') || '';
      const foldersList = JSON.parse(localStorage.getItem('localFolders') || '[]');
      
      if (!foldersList.includes(folderPath)) {
        foldersList.push(folderPath);
        localStorage.setItem('localFolders', JSON.stringify(foldersList));
      }
      
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
      // Create a new collection
      try {
        const response = await fetch('/api/collections', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name })
        });
        
        if (response.ok) {
          await loadCollections();
          createCollectionModal.classList.add('hidden');
          collectionNameInput.value = '';
        } else {
          const error = await response.json();
          console.error('Error creating collection:', error);
          alert(`Failed to create collection: ${error.error}`);
        }
      } catch (error) {
        console.error('Error creating collection:', error);
        alert(`Failed to create collection: ${error.message}`);
      }
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
  
  // Set title in font list header
  const fontListHeader = fontListContainer.querySelector('.font-list-header h2');
  
  // Find the active menu item (menuItems is a NodeList, not an array)
  let activeMenuText = '';
  for (let i = 0; i < menuItems.length; i++) {
    if (menuItems[i].dataset.category === category) {
      activeMenuText = menuItems[i].querySelector('span').textContent;
      break;
    }
  }
  fontListHeader.textContent = activeMenuText;
  
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
    // Siempre intentamos obtener las fuentes del sistema frescas
    const response = await fetch('/api/fonts/system');
    if (!response.ok) {
      throw new Error(`Failed to load system fonts: ${response.statusText}`);
    }
    const fonts = await response.json();
    
    // Si obtenemos fuentes, las guardamos en nuestra lista
    if (fonts && Array.isArray(fonts) && fonts.length > 0) {
      systemFontsList = fonts;
      fontsList = systemFontsList;
      console.log('System fonts loaded successfully:', fonts.length);
      hideLoading();
      renderFontList();
    } else {
      console.warn('No system fonts were found, showing sample fonts');
      throw new Error('No fonts returned from API');
    }
  } catch (error) {
    console.error('Error loading system fonts:', error);
    // Intentamos una vez más
    try {
      const fallbackResponse = await fetch('/api/fonts/system');
      const fallbackFonts = await fallbackResponse.json();
      if (fallbackFonts && Array.isArray(fallbackFonts) && fallbackFonts.length > 0) {
        systemFontsList = fallbackFonts;
        fontsList = systemFontsList;
        console.log('System fonts loaded successfully on retry:', fallbackFonts.length);
        hideLoading();
        renderFontList();
        return;
      }
    } catch (fallbackError) {
      console.error('Error on fallback load:', fallbackError);
    }
    
    hideLoading();
    showEmptyState();
  }
}

async function loadLocalFolders() {
  showLoading();
  try {
    // Get folders from localStorage for the web version
    localFoldersList = JSON.parse(localStorage.getItem('localFolders') || '[]');
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
    
    // Encode the folder path for the URL
    const encodedPath = encodeURIComponent(folderPath);
    const response = await fetch(`/api/fonts/local/${encodedPath}`);
    
    if (!response.ok) {
      throw new Error(`Failed to load local fonts: ${response.statusText}`);
    }
    
    const localFonts = await response.json();
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
      const response = await fetch('/api/fonts/google');
      
      if (!response.ok) {
        throw new Error(`Failed to load Google fonts: ${response.statusText}`);
      }
      
      googleFontsList = await response.json();
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
    const response = await fetch('/api/collections');
    
    if (!response.ok) {
      throw new Error(`Failed to load collections: ${response.statusText}`);
    }
    
    collectionsArray = await response.json();
    renderCollectionsList();
    
    if (collectionsArray.length === 0) {
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
    const collectionItems = collectionsListEl.querySelectorAll('li');
    collectionItems.forEach(item => {
      if (item.dataset.name === collectionName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
    
    // Find the collection in the list
    const collection = collectionsArray.find(c => c.name === collectionName);
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
    const response = await fetch('/api/fonts/active');
    
    if (!response.ok) {
      throw new Error(`Failed to load active fonts: ${response.statusText}`);
    }
    
    activeFontsList = await response.json();
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
    const response = await fetch('/api/favorites');
    
    if (!response.ok) {
      throw new Error(`Failed to load favorites: ${response.statusText}`);
    }
    
    favoritesList = await response.json();
    fontsList = favoritesList;
    renderFontList();
  } catch (error) {
    console.error('Error loading favorites:', error);
    showEmptyState();
  }
}

// Load Google font styles for a specific font family
async function loadGoogleFontStyle(family, variants = ['regular']) {
  // Only load if not already loaded
  if (!loadedFontFamilies.has(family)) {
    // Construct the Google Fonts URL
    const sanitizedFamily = family.replace(/ /g, '+');
    const variantsStr = variants.join(',');
    const fontUrl = `https://fonts.googleapis.com/css2?family=${sanitizedFamily}:wght@${variantsStr}&display=swap`;
    
    // Create link element
    const linkEl = document.createElement('link');
    linkEl.rel = 'stylesheet';
    linkEl.href = fontUrl;
    
    // Add to document
    document.head.appendChild(linkEl);
    
    // Mark as loaded
    loadedFontFamilies.add(family);
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
  collectionsListEl.innerHTML = '';
  
  collectionsArray.forEach(collection => {
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
    
    collectionsListEl.appendChild(li);
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
      
      // If it's a Google font, load the font style
      if (font.type === 'google') {
        loadGoogleFontStyle(font.family, [font.style || 'regular']);
      }
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
      let response;
      
      if (isActive) {
        // Deactivate font
        response = await fetch('/api/fonts/deactivate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ fontPath: font.path })
        });
      } else {
        // Activate font
        response = await fetch('/api/fonts/activate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ fontPath: font.path })
        });
      }
      
      if (response.ok) {
        if (isActive) {
          toggleActivateBtn.classList.remove('active');
          toggleActivateBtn.querySelector('use').setAttribute('href', 'assets/feather-icons.svg#toggle-left');
        } else {
          toggleActivateBtn.classList.add('active');
          toggleActivateBtn.querySelector('use').setAttribute('href', 'assets/feather-icons.svg#toggle-right');
        }
        
        // Refresh active fonts list if we're in that category
        if (currentCategory === 'active') {
          await loadActiveFonts();
        }
      } else {
        const error = await response.json();
        console.error('Error toggling font activation:', error);
        alert(`Failed to ${isActive ? 'deactivate' : 'activate'} font: ${error.error}`);
      }
    } catch (error) {
      console.error('Error toggling font activation:', error);
      alert(`Failed to ${isActive ? 'deactivate' : 'activate'} font: ${error.message}`);
    }
  });
  
  toggleFavoriteBtn.addEventListener('click', async () => {
    try {
      const response = await fetch('/api/favorites/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fontData: font })
      });
      
      if (response.ok) {
        const updatedFont = await response.json();
        toggleFavoriteBtn.classList.toggle('active');
        
        // Refresh favorites list if we're in that category
        if (currentCategory === 'favorites') {
          await loadFavorites();
        }
      } else {
        const error = await response.json();
        console.error('Error toggling favorite:', error);
        alert(`Failed to toggle favorite: ${error.error}`);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert(`Failed to toggle favorite: ${error.message}`);
    }
  });
  
  openLocationBtn.addEventListener('click', () => {
    // In web version, just show the path
    if (font.path) {
      alert(`Font location: ${font.path}`);
    }
  });
  
  addToCollectionBtn.addEventListener('click', async () => {
    try {
      // Get collections
      const response = await fetch('/api/collections');
      
      if (!response.ok) {
        throw new Error(`Failed to load collections: ${response.statusText}`);
      }
      
      const collections = await response.json();
      
      if (collections.length === 0) {
        alert('Please create a collection first.');
        return;
      }
      
      // Simple collection selection (real implementation would have a proper modal)
      const collectionName = prompt('Select a collection to add this font to:', collections[0].name);
      
      if (collectionName && collections.some(c => c.name === collectionName)) {
        const addResponse = await fetch(`/api/collections/${encodeURIComponent(collectionName)}/fonts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ fontData: font })
        });
        
        if (addResponse.ok) {
          alert(`Added ${font.family} to ${collectionName}`);
        } else {
          const error = await addResponse.json();
          console.error('Error adding font to collection:', error);
          alert(`Failed to add font to collection: ${error.error}`);
        }
      }
    } catch (error) {
      console.error('Error adding font to collection:', error);
      alert(`Failed to add font to collection: ${error.message}`);
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

function showLoading() {
  loadingIndicator.classList.remove('hidden');
  emptyState.classList.add('hidden');
}

function hideLoading() {
  loadingIndicator.classList.add('hidden');
}

function showEmptyState() {
  emptyState.classList.remove('hidden');
  loadingIndicator.classList.add('hidden');
}

function hideEmptyState() {
  emptyState.classList.add('hidden');
}