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
        <div class="bulk-info">
          <label>
            <input type="checkbox" id="select-all-checkbox" />
            <strong id="selected-count">0 selected</strong>
          </label>
        </div>

        <div class="bulk-actions">
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

          <!-- Clear Section -->
          <div class="action-group">
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
    // Select/Deselect all
    document.getElementById('select-all-checkbox').addEventListener('change', (e) => {
      this.selectAll(e.target.checked);
    });

    // Bulk actions
    document.getElementById('btn-bulk-add-tags').addEventListener('click', () => this.bulkAddTags());
    document.getElementById('btn-bulk-remove-tags').addEventListener('click', () => this.bulkRemoveTags());
    document.getElementById('btn-bulk-favorite').addEventListener('click', () => this.bulkFavorite(true));
    document.getElementById('btn-bulk-unfavorite').addEventListener('click', () => this.bulkFavorite(false));
    document.getElementById('btn-bulk-download').addEventListener('click', () => this.bulkDownload());
    document.getElementById('btn-bulk-delete').addEventListener('click', () => this.bulkDelete());
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

      // Update each photo's tags in the current view
      results.forEach(result => {
        if (result.success && result.newTags) {
          // Find the photo in the current view by path
          const photo = controller.photos.find(p => p.path === result.path);
          if (photo) {
            // Update the tags directly
            const newTagsString = Array.isArray(result.newTags) 
              ? result.newTags.join(', ') 
              : result.newTags;
            photo.tags = newTagsString;
            console.log(`✓ Updated tags for ${result.path}: ${newTagsString}`);
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
