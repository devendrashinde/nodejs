/**
 * Advanced Search UI Component
 * Provides interactive search interface with filters and autocomplete
 */

class AdvancedSearch {
  constructor(containerId = 'advanced-search-container') {
    this.container = document.getElementById(containerId);
    this.isOpen = false;
    this.init();
  }

  init() {
    this.createSearchUI();
    this.attachEventListeners();
  }

  createSearchUI() {
    const html = `
      <div class="search-panel" style="display: none;">
        <div class="search-header">
          <h2>🔍 Advanced Search</h2>
          <button class="btn-close-search" aria-label="Close search">&times;</button>
        </div>

        <div class="search-container">
          <!-- Search Input with Autocomplete -->
          <div class="search-input-group">
            <input 
              type="text" 
              id="searchQuery" 
              class="search-input" 
              placeholder="Search by name, album, tags..."
              autocomplete="off"
            />
            <div id="suggestions-dropdown" class="suggestions-dropdown" style="display: none;">
              <ul id="suggestions-list"></ul>
            </div>
          </div>

          <!-- Filters - Collapsible for mobile -->
          <div class="filters-wrapper">
            <div class="filters-section">
              <details open>
                <summary class="filter-title">📅 Date Range</summary>
                <div class="filter-group">
                  <input type="date" id="filterDateFrom" class="filter-input" />
                  <span>to</span>
                  <input type="date" id="filterDateTo" class="filter-input" />
                </div>
              </details>

              <details open>
                <summary class="filter-title">🏷️ Tags (AND/OR)</summary>
                <div class="filter-group">
                  <input 
                    type="text" 
                    id="filterTags" 
                    class="filter-input" 
                    placeholder="Enter tags, comma-separated"
                  />
                  <label>
                    <input type="radio" name="tagMode" value="AND" checked />
                    All tags (AND)
                  </label>
                  <label>
                    <input type="radio" name="tagMode" value="OR" />
                    Any tag (OR)
                  </label>
                </div>
              </details>

              <details>
                <summary class="filter-title">📁 File Type</summary>
                <div class="filter-group">
                  <label><input type="checkbox" name="fileType" value="photos" checked /> 📷 Photos (JPG, PNG, GIF, WebP)</label>
                  <label><input type="checkbox" name="fileType" value="video" /> 🎬 Videos (MP4, 3GP)</label>
                  <label><input type="checkbox" name="fileType" value="audio" /> 🎵 Music (MP3, WAV, AAC)</label>
                  <label><input type="checkbox" name="fileType" value="documents" /> 📄 Documents (PDF, DOC, DOCX)</label>
                </div>
              </details>

              <details>
                <summary class="filter-title">📏 File Size</summary>
                <div class="filter-group">
                  <select id="filterSize" class="filter-input">
                    <option value="">Any size</option>
                    <option value="0-1mb">0 - 1 MB</option>
                    <option value="1-5mb">1 - 5 MB</option>
                    <option value="5-20mb">5 - 20 MB</option>
                    <option value="20mb+">20 MB+</option>
                  </select>
                </div>
              </details>

              <details>
                <summary class="filter-title">🎯 Sort By</summary>
                <div class="filter-group">
                  <select id="filterSort" class="filter-input">
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="date-newest">Date (Newest)</option>
                    <option value="date-oldest">Date (Oldest)</option>
                    <option value="size-largest">Size (Largest)</option>
                    <option value="size-smallest">Size (Smallest)</option>
                  </select>
                </div>
              </details>
            </div>
          </div>

          <!-- Search Stats -->
          <div id="search-stats" class="search-stats" style="display: none;">
            <span id="result-count"></span>
          </div>

          <!-- Results -->
          <div id="results-container" class="results-container"></div>
        </div>

        <!-- Action Buttons - Always Visible -->
        <div class="search-footer">
          <button id="btn-search" class="btn btn-primary">🔍 Search</button>
          <button id="btn-reset" class="btn btn-secondary">↻ Reset</button>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
  }

  attachEventListeners() {
    // Search input autocomplete
    const searchInput = document.getElementById('searchQuery');
    searchInput.addEventListener('input', (e) => this.handleAutocomplete(e));
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-input-group')) {
        document.getElementById('suggestions-dropdown').style.display = 'none';
      }
    });

    // Search button
    document.getElementById('btn-search').addEventListener('click', () => this.performSearch());
    document.getElementById('btn-reset').addEventListener('click', () => this.resetFilters());

    // Close button
    document.querySelector('.btn-close-search').addEventListener('click', () => this.close());

    // Enter key on search input
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.performSearch();
    });
  }

  async handleAutocomplete(event) {
    const query = event.target.value.trim();
    if (query.length < 2) {
      document.getElementById('suggestions-dropdown').style.display = 'none';
      return;
    }

    try {
      const response = await fetch(
        `/api/search/suggestions?prefix=${encodeURIComponent(query)}&field=all`
      );
      const suggestions = await response.json();

      const suggestionsList = document.getElementById('suggestions-list');
      suggestionsList.innerHTML = '';

      if (suggestions.length > 0) {
        suggestions.slice(0, 10).forEach((suggestion) => {
          const li = document.createElement('li');
          li.textContent = suggestion;
          li.addEventListener('click', () => {
            document.getElementById('searchQuery').value = suggestion;
            document.getElementById('suggestions-dropdown').style.display = 'none';
            this.performSearch();
          });
          suggestionsList.appendChild(li);
        });
        document.getElementById('suggestions-dropdown').style.display = 'block';
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
    }
  }

  async performSearch() {
    const criteria = {
      query: document.getElementById('searchQuery').value || undefined,
      tags: this.parseTags(document.getElementById('filterTags').value),
      tagMode: document.querySelector('input[name="tagMode"]:checked').value,
      dateRange: {
        from: document.getElementById('filterDateFrom').value || undefined,
        to: document.getElementById('filterDateTo').value || undefined,
      },
      fileTypes: this.mapFileTypeCategories(this.getCheckedValues('input[name="fileType"]:checked')),
      size: document.getElementById('filterSize').value || undefined,
      sort: document.getElementById('filterSort').value || 'name-asc',
    };

    // Remove undefined values
    Object.keys(criteria).forEach(
      (key) => criteria[key] === undefined && delete criteria[key]
    );

    try {
      const params = new URLSearchParams();
      Object.entries(criteria).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v));
        } else if (typeof value === 'object') {
          Object.entries(value).forEach(([k, v]) => {
            if (v) params.append(`${key}.${k}`, v);
          });
        } else if (value) {
          params.append(key, value);
        }
      });

      const response = await fetch(`/api/search?${params.toString()}`);
      const data = await response.json();

      this.displayResults(data);
    } catch (error) {
      console.error('Search error:', error);
      this.showError('Search failed. Please try again.');
    }
  }

  displayResults(data) {
    const container = document.getElementById('results-container');
    const statsDiv = document.getElementById('search-stats');
    const resultCount = document.getElementById('result-count');

    if (!data.results || data.results.length === 0) {
      container.innerHTML = '<p class="no-results">No results found.</p>';
      statsDiv.style.display = 'none';
      return;
    }

    this.currentResults = data.results;
    resultCount.textContent = `Found ${data.results.length} result${data.results.length !== 1 ? 's' : ''}`;
    statsDiv.style.display = 'block';

    let html = '<div class="results-grid">';
    data.results.forEach((photo) => {
      html += `
        <div class="result-item" data-photo-id="${photo.id}">
          <img 
            src="${photo.thumbnail || photo.url}" 
            alt="${photo.name}" 
            class="result-thumbnail" 
            onclick="viewPhotoDetail('${photo.path}')"
            style="cursor: pointer;"
          />
          <div class="result-info">
            <h4>${photo.name}</h4>
            <p class="result-meta">
              📅 ${new Date(photo.dateModified).toLocaleDateString()}<br/>
              📁 ${photo.album || 'Uncategorized'}<br/>
              ${photo.tags ? `🏷️ ${photo.tags.join(', ')}` : ''}
            </p>
          </div>
        </div>
      `;
    });
    html += '</div>';

    if (data.statistics) {
      html += `
        <div class="search-stats-panel">
          <h3>📊 Search Statistics</h3>
          <p>Total Photos: ${data.statistics.totalPhotos}</p>
          <p>Albums: ${data.statistics.albums?.length || 0}</p>
          <p>Tags: ${data.statistics.tags?.length || 0}</p>
          <p>File Types: ${data.statistics.fileTypes?.join(', ') || 'N/A'}</p>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  parseTags(tagsString) {
    if (!tagsString) return [];
    return tagsString.split(',').map((tag) => tag.trim());
  }

  getCheckedValues(selector) {
    return Array.from(document.querySelectorAll(selector)).map((el) => el.value);
  }

  resetFilters() {
    document.getElementById('searchQuery').value = '';
    document.getElementById('filterDateFrom').value = '';
    document.getElementById('filterDateTo').value = '';
    document.getElementById('filterTags').value = '';
    document.getElementById('filterSize').value = '';
    document.getElementById('filterSort').value = 'name-asc';
    document.querySelectorAll('input[name="fileType"]').forEach((el) => {
      el.checked = el.value === 'jpg';
    });
    document.getElementById('results-container').innerHTML = '';
    document.getElementById('search-stats').style.display = 'none';
  }

  showError(message) {
    const container = document.getElementById('results-container');
    container.innerHTML = `<p class="error-message">${message}</p>`;
  }

  mapFileTypeCategories(categories) {
    const categoryMap = {
      photos: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'],
      video: ['mp4', '3gp', 'avi', 'mov', 'mkv', 'wmv', 'flv'],
      audio: ['mp3', 'wav', 'aac', 'flac', 'wma', 'm4a'],
      documents: ['pdf', 'doc', 'docx', 'txt', 'xlsx', 'xls', 'ppt', 'pptx']
    };

    let extensions = [];
    categories.forEach(category => {
      if (categoryMap[category]) {
        extensions = extensions.concat(categoryMap[category]);
      } else {
        // If it's already an extension, keep it
        extensions.push(category);
      }
    });
    return extensions;
  }

  close() {
    const panel = this.container.querySelector('.search-panel');
    if (panel) {
      panel.style.display = 'none';
      this.isOpen = false;
    }
  }

  open() {
    const panel = this.container.querySelector('.search-panel');
    if (panel) {
      panel.style.display = 'block';
      this.isOpen = true;
    }
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}

// Global helper functions for search results
window.viewPhotoDetail = function(photoId) {
  // Open photo detail view (could be modal, lightbox, or full page)
  const modal = document.createElement('div');
  modal.className = 'photo-detail-modal';
  
  // Construct image URL - path already includes 'data/' prefix
  const imageUrl = photoId.startsWith('/') ? photoId : `/${photoId}`;
  
  modal.innerHTML = `
    <div class="photo-detail-overlay">
      <div class="photo-detail-content">
        <button class="btn-close" onclick="this.closest('.photo-detail-modal').remove()">&times;</button>
        <div class="photo-detail-header">
          <h3>${photoId.split('/').pop()}</h3>
          <button class="btn-exif-detail" onclick="showExifData('${photoId}')" title="View EXIF data">📸 EXIF</button>
        </div>
        <div class="photo-detail-main">
          <img src="${imageUrl}" alt="Photo detail" class="photo-detail-image" />
          <div class="photo-detail-info">
            <p class="photo-path">${photoId}</p>
            <div id="detail-exif-container"></div>
            <div id="detail-social-container"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Load EXIF data if available
  if (typeof embedExifData === 'function') {
    embedExifData(photoId, 'detail-exif-container').catch(e => console.log('EXIF not available'));
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.advancedSearch = new AdvancedSearch('advanced-search-container');
});
