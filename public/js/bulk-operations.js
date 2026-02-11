/**
 * Bulk Operations Component
 * Multi-select functionality and batch operations on photos
 */

class BulkOperations {
  constructor() {
    this.selectedPhotos = new Set();
    this.init();
  }

  init() {
    this.createBulkUI();
    this.attachEventListeners();
  }

  createBulkUI() {
    const html = `
      <div id="bulk-toolbar" class="bulk-toolbar" style="display: none;">
        <div class="bulk-toolbar-header">
          <div class="bulk-info">
            <label>
              <input type="checkbox" id="select-all-checkbox" />
              <strong id="selected-count">0 selected</strong>
            </label>
          </div>
          <button id="btn-bulk-toggle" class="bulk-toggle-btn" title="Toggle bulk operations">
            <i class="fas fa-chevron-down"></i>
            <span>Options</span>
          </button>
        </div>

        <div class="bulk-actions" id="bulk-actions-container">
          <!-- Tag Section -->
          <div class="action-group">
            <input 
              type="text" 
              id="bulk-tags-input" 
              class="action-input" 
              placeholder="Add tags (comma-separated)"
            />
            <button id="btn-bulk-add-tags" class="btn btn-small btn-success">➕ Add Tags</button>
            <button id="btn-bulk-remove-tags" class="btn btn-small btn-warning">➖ Remove Tags</button>
            <button id="btn-bulk-autotag" class="btn btn-small btn-info">🤖 AI Auto-Tag</button>
          </div>

          <!-- Rating Section -->
          <div class="action-group">
            <label>Rate:</label>
            <div class="rating-selector">
              <button class="btn-rating" data-rating="1">⭐</button>
              <button class="btn-rating" data-rating="2">⭐⭐</button>
              <button class="btn-rating" data-rating="3">⭐⭐⭐</button>
              <button class="btn-rating" data-rating="4">⭐⭐⭐⭐</button>
              <button class="btn-rating" data-rating="5">⭐⭐⭐⭐⭐</button>
            </div>
          </div>

          <!-- Favorite Section -->
          <div class="action-group">
            <button id="btn-bulk-favorite" class="btn btn-small btn-info">❤️ Favorite</button>
            <button id="btn-bulk-unfavorite" class="btn btn-small btn-secondary">🤍 Unfavorite</button>
          </div>

          <!-- Download Section -->
          <div class="action-group">
            <button id="btn-bulk-download" class="btn btn-small btn-primary">📥 Download ZIP</button>
          </div>

          <!-- Delete Section -->
          <div class="action-group">
            <button id="btn-bulk-delete" class="btn btn-small btn-danger">🗑️ Delete</button>
          </div>

          <!-- Playlist Section -->
          <div class="action-group">
            <button id="btn-bulk-add-to-playlist" class="btn btn-small btn-success">📋 Add to Playlist</button>
          </div>

          <!-- Clear Section -->
          <div class="action-group">
            <button id="btn-bulk-select-all" class="btn btn-small btn-info">✓ Select All</button>
            <button id="btn-bulk-clear" class="btn btn-small btn-secondary">✕ Clear Selection</button>
          </div>
        </div>

        <!-- Progress Bar -->
        <div id="bulk-progress" class="bulk-progress" style="display: none;">
          <div class="progress-bar">
            <div id="progress-fill" class="progress-fill"></div>
          </div>
          <span id="progress-text">Processing...</span>
        </div>
      </div>
    `;

    // Insert toolbar at the beginning of body
    const toolbar = document.createElement('div');
    toolbar.innerHTML = html;
    document.body.insertBefore(toolbar.firstElementChild, document.body.firstChild);
  }

  attachEventListeners() {
    // Toggle bulk actions on mobile
    const toggleBtn = document.getElementById('btn-bulk-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const toolbar = document.getElementById('bulk-toolbar');
        toolbar.classList.toggle('collapsed');
        const icon = toggleBtn.querySelector('i');
        icon.classList.toggle('fa-chevron-down');
        icon.classList.toggle('fa-chevron-up');
      });
    }

    // Select/Deselect all
    document.getElementById('select-all-checkbox').addEventListener('change', (e) => {
      this.selectAll(e.target.checked);
    });

    // Bulk actions
    document.getElementById('btn-bulk-add-tags').addEventListener('click', () => this.bulkAddTags());
    document.getElementById('btn-bulk-remove-tags').addEventListener('click', () => this.bulkRemoveTags());
    document.getElementById('btn-bulk-autotag').addEventListener('click', () => this.bulkAutoTag());
    document.getElementById('btn-bulk-favorite').addEventListener('click', () => this.bulkFavorite(true));
    document.getElementById('btn-bulk-unfavorite').addEventListener('click', () => this.bulkFavorite(false));
    document.getElementById('btn-bulk-download').addEventListener('click', () => this.bulkDownload());
    document.getElementById('btn-bulk-delete').addEventListener('click', () => this.bulkDelete());
    document.getElementById('btn-bulk-add-to-playlist').addEventListener('click', () => this.bulkAddToPlaylist());
    document.getElementById('btn-bulk-select-all').addEventListener('click', () => this.selectAll(true));
    document.getElementById('btn-bulk-clear').addEventListener('click', () => this.clearSelection());

    // Rating buttons
    document.querySelectorAll('.btn-rating').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const rating = parseInt(e.target.dataset.rating);
        this.bulkRate(rating);
      });
    });

    // Photo selection (must be done by parent)
    this.setupPhotoSelectionDelegation();
  }

  setupPhotoSelectionDelegation() {
    // This uses event delegation to handle photo selection checkboxes
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('photo-checkbox')) {
        const photoId = e.target.dataset.photoId;
        if (e.target.checked) {
          this.selectedPhotos.add(photoId);
        } else {
          this.selectedPhotos.delete(photoId);
        }
        this.updateToolbarVisibility();
      }
    });
  }

  updateToolbarVisibility() {
    const toolbar = document.getElementById('bulk-toolbar');
    const count = document.getElementById('selected-count');
    const selectAll = document.getElementById('select-all-checkbox');

    if (this.selectedPhotos.size > 0) {
      toolbar.style.display = 'block';
      count.textContent = `${this.selectedPhotos.size} selected`;
    } else {
      toolbar.style.display = 'none';
      selectAll.checked = false;
    }
  }

  selectAll(checked) {
    document.querySelectorAll('.photo-checkbox').forEach((checkbox) => {
      checkbox.checked = checked;
      const photoId = checkbox.dataset.photoId;
      if (checked) {
        this.selectedPhotos.add(photoId);
      } else {
        this.selectedPhotos.delete(photoId);
      }
    });
    this.updateToolbarVisibility();
  }

  clearSelection() {
    if (confirm('Clear all selections?')) {
      this.selectedPhotos.clear();
      document.querySelectorAll('.photo-checkbox').forEach((cb) => {
        cb.checked = false;
      });
      this.updateToolbarVisibility();
    }
  }

  async bulkAddTags() {
    const tagsInput = document.getElementById('bulk-tags-input');
    const tags = tagsInput.value.split(',').map((t) => t.trim()).filter(Boolean);

    if (!tags.length) {
      alert('Please enter tags');
      return;
    }

    if (!confirm(`Add ${tags.length} tag(s) to ${this.selectedPhotos.size} photos?`)) {
      return;
    }

    await this.executeBulkOperation('/api/bulk/tags', {
      photoIds: Array.from(this.selectedPhotos),
      tags,
    });
    tagsInput.value = '';
  }

  async bulkRemoveTags() {
    const tagsInput = document.getElementById('bulk-tags-input');
    const tags = tagsInput.value.split(',').map((t) => t.trim()).filter(Boolean);

    if (!tags.length) {
      alert('Please enter tags to remove');
      return;
    }

    if (!confirm(`Remove ${tags.length} tag(s) from ${this.selectedPhotos.size} photos?`)) {
      return;
    }

    await this.executeBulkOperation('/api/bulk/tags/remove', {
      photoIds: Array.from(this.selectedPhotos),
      tags,
    });
    tagsInput.value = '';
  }

  async bulkAutoTag() {
    if (this.selectedPhotos.size === 0) {
      alert('No photos selected');
      return;
    }

    if (!confirm(`Use AI to auto-tag ${this.selectedPhotos.size} photos? This may take a few minutes.`)) {
      return;
    }

    this.showProgress();
    const progressText = document.getElementById('progress-text');
    progressText.textContent = 'Initializing AI model...';

    try {
      const eventSource = new EventSource(`/api/photos/autotag/batch?photoIds=${Array.from(this.selectedPhotos).join(',')}`);
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'progress') {
          progressText.textContent = `Processing: ${data.current}/${data.total} - ${data.filename}`;
        } else if (data.type === 'complete') {
          progressText.textContent = `✓ Auto-tagged ${data.total} photos`;
          eventSource.close();
          
          setTimeout(() => {
            this.hideProgress();
            this.updatePhotosInPlace(data.results);
          }, 1500);
        } else if (data.type === 'error') {
          progressText.textContent = `Error: ${data.message}`;
          eventSource.close();
          setTimeout(() => this.hideProgress(), 3000);
        }
      };

      eventSource.onerror = () => {
        progressText.textContent = 'Connection error';
        eventSource.close();
        setTimeout(() => this.hideProgress(), 3000);
      };

    } catch (error) {
      console.error('Auto-tag error:', error);
      alert('Failed to auto-tag photos');
      this.hideProgress();
    }
  }

  async bulkFavorite(isFavorite) {
    const action = isFavorite ? 'Favorite' : 'Unfavorite';
    if (!confirm(`${action} ${this.selectedPhotos.size} photos?`)) {
      return;
    }

    await this.executeBulkOperation('/api/bulk/favorite', {
      photoIds: Array.from(this.selectedPhotos),
      isFavorite,
    });
  }

  async bulkRate(rating) {
    if (!confirm(`Rate ${this.selectedPhotos.size} photos ${rating} stars?`)) {
      return;
    }

    await this.executeBulkOperation('/api/bulk/rate', {
      photoIds: Array.from(this.selectedPhotos),
      rating,
    });
  }

  async bulkDownload() {
    if (this.selectedPhotos.size === 0) {
      alert('No photos selected');
      return;
    }

    this.showProgress();

    try {
      const response = await fetch('/api/bulk/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoIds: Array.from(this.selectedPhotos),
        }),
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `photos_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

      this.hideProgress();
      alert('Download started!');
    } catch (error) {
      console.error('Download error:', error);
      this.hideProgress();
      alert('Download failed');
    }
  }

  async bulkDelete() {
    if (!confirm(`Delete ${this.selectedPhotos.size} photos? This cannot be undone.`)) {
      return;
    }

    await this.executeBulkOperation('/api/bulk/delete', {
      photoIds: Array.from(this.selectedPhotos),
      createBackup: confirm('Create backup of deleted photos?'),
    });
  }

  async bulkAddToPlaylist() {
    if (this.selectedPhotos.size === 0) {
      alert('Please select at least one photo');
      return;
    }

    // Get Angular scope and trigger the modal
    const scope = angular.element(document.querySelector('#controller')).scope();
    if (!scope) {
      console.error('Angular scope not found');
      alert('Failed to open playlist selector');
      return;
    }

    // Store selected photos for bulk operation
    const selectedPhotos = this.selectedPhotos;
    scope.$apply(function() {
      scope.selectedPhotosForBulkPlaylist = Array.from(selectedPhotos);
      scope.isBulkPlaylistOperation = true;
    });

    // Open the add to playlist modal
    const modalEl = document.getElementById('addToPlaylistModal');
    if (modalEl) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    } else {
      console.error('Add to Playlist modal not found');
      alert('Playlist modal not available');
    }
  }

  async addItemsToPlaylist(playlistId, photoIds) {
    try {
      const response = await fetch(`/playlists/${playlistId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoIds: photoIds }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`Failed to add items: ${error.message || 'Unknown error'}`);
        return;
      }

      alert(`Successfully added ${photoIds.length} item(s) to playlist`);
      
      // Clear selection
      this.clearSelection();
      
      // Reload playlists in the controller
      const controller = angular.element(document.querySelector('body')).scope();
      if (controller && controller.$apply) {
        controller.$apply(() => {
          // Trigger playlist reload via controller
          if (controller.loadPlaylists) {
            controller.loadPlaylists();
          }
        });
      }

    } catch (error) {
      console.error('Error adding items to playlist:', error);
      alert('Failed to add items to playlist');
    }
  }

  async executeBulkOperation(endpoint, payload) {
    this.showProgress();

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      this.hideProgress();

      if (result.success) {
        // Operation completed - update photos without showing alert
        
        // Update photos in-place with new tags instead of reloading
        if (endpoint.includes('tags')) {
          this.updatePhotosInPlace(result.results);
        }
        
        this.clearSelection();
      } else {
        alert(`✗ Operation failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Bulk operation error:', error);
      this.hideProgress();
      alert('Operation failed');
    }
  }

  updatePhotosInPlace(results) {
    try {
      // Get the Angular controller scope
      const controller = angular.element(document.querySelector('#controller')).scope();
      
      if (!controller || !controller.photos) {
        console.warn('Could not find controller or photos array');
        return;
      }

      console.log('Updating photos with results:', results);

      // Update each photo's tags in the current view
      results.forEach(result => {
        if (result.success && result.newTags) {
          // The result.path is the full path like "data/pictures/nature/file.jpg"
          // Try multiple matching strategies
          const photo = controller.photos.find(p => {
            // Strategy 1: Exact path match
            if (p.path === result.path) return true;
            
            // Strategy 2: Match by reconstructing path from photo object parts
            // Angular photos might have path stored as: path + '/' + album + '/' + name
            const reconstructedPath = p.album 
              ? `${p.path}/${p.album}/${p.name}`.replace(/\/+/g, '/')
              : `${p.path}/${p.name}`.replace(/\/+/g, '/');
            if (reconstructedPath === result.path) return true;
            
            // Strategy 3: Match by filename (last resort)
            const filename = result.path.split('/').pop();
            return p.name === filename;
          });
          
          if (photo) {
            // Update the tags directly
            const newTagsString = Array.isArray(result.newTags) 
              ? result.newTags.join(', ') 
              : result.newTags;
            photo.tags = newTagsString;
            console.log(`✓ Updated tags for ${photo.name}: ${newTagsString}`);
          } else {
            console.warn(`Could not find photo for path: ${result.path}`);
          }
        }
      });

      // Trigger Angular digest cycle to update the view
      if (controller.$apply) {
        try {
          controller.$apply();
        } catch (e) {
          console.log('Angular digest already in progress');
        }
      }
    } catch (err) {
      console.error('Error updating photos in place:', err);
    }
  }

  showProgress() {
    document.getElementById('bulk-progress').style.display = 'block';
    const fill = document.getElementById('progress-fill');
    fill.style.width = '0%';

    // Simulate progress
    let width = 0;
    const interval = setInterval(() => {
      width += Math.random() * 30;
      if (width > 90) width = 90;
      fill.style.width = width + '%';
    }, 500);

    document.getElementById('bulk-progress').dataset.interval = interval;
  }

  hideProgress() {
    const progress = document.getElementById('bulk-progress');
    const interval = progress.dataset.interval;
    if (interval) clearInterval(interval);

    document.getElementById('progress-fill').style.width = '100%';
    setTimeout(() => {
      progress.style.display = 'none';
    }, 500);
  }
}

// Initialize bulk operations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.bulkOperations = new BulkOperations();
});
