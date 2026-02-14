/**
 * Image Editor Module
 * Provides image editing UI: crop, rotate, resize, flip
 * With version history and restoration
 */

class ImageEditor {
  constructor(photoId, photoPath) {
    this.photoId = photoId;
    this.photoPath = photoPath;
    this.versions = [];
    this.currentVersion = null;
    this.editMode = null;
    this.cropData = null;
    this.isLoading = false;
  }

  /**
   * Initialize editor and load versions
   */
  async init() {
    try {
      this.isLoading = true;
      
      // Load versions
      const response = await fetch(`/api/photos/${this.photoId}/versions`);
      if (!response.ok) throw new Error('Failed to load versions');
      
      const data = await response.json();
      this.versions = data.versions || [];
      this.currentVersion = this.versions.find(v => v.is_current);
      
      this.isLoading = false;
      return true;
    } catch (error) {
      console.error('Editor init error:', error);
      alert('Failed to initialize image editor: ' + error.message);
      return false;
    }
  }

  /**
   * Show editor modal with preview
   */
  showEditor() {
    try {
      const modalElement = document.getElementById('imageEditorModal');
      if (!modalElement) {
        console.error('Image editor modal element not found');
        alert('Error: Image editor modal not found in DOM');
        return;
      }
      
      // Force the modal to be visible by setting display
      modalElement.style.display = 'none'; // Reset first
      
      // Update preview first
      this.updatePreview();
      
      // Create and show modal with options
      const modal = new bootstrap.Modal(modalElement, {
        backdrop: true,      // Show backdrop
        keyboard: true,      // Allow Escape to close
        focus: true          // Focus modal on show
      });
      
      // Ensure modal and backdrop have correct z-index
      modalElement.addEventListener('shown.bs.modal', function() {
        console.log('Modal shown event');
        // Force high z-index on modal
        modalElement.style.zIndex = '99999';
        
        // Find and style backdrop
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
          backdrop.style.zIndex = '99998';
          backdrop.style.display = 'block';
          console.log('Backdrop adjusted');
        }
      });
      
      // Handle modal close to restore body overflow
      modalElement.addEventListener('hidden.bs.modal', function() {
        console.log('Modal hidden event');
        document.body.style.overflow = '';
      });
      
      modal.show();
      
      // Also ensure body overflow is hidden to prevent scrolling
      document.body.style.overflow = 'hidden';
      
      console.log('Image editor modal shown');
    } catch (error) {
      console.error('Error showing editor:', error);
      alert('Failed to open image editor: ' + error.message);
    }
  }

  /**
   * Update preview image
   */
  updatePreview() {
    const preview = document.getElementById('editorPreview');
    if (preview) {
      // Use the current version if available, otherwise use the original photo path
      let imagePath = this.photoPath;
      
      if (this.currentVersion && this.currentVersion.path && this.currentVersion.filename) {
        imagePath = `${this.currentVersion.path}/${this.currentVersion.filename}`.replace(/\\/g, '/');
      }
      
      // Ensure path is properly formatted
      if (!imagePath.startsWith('/')) {
        imagePath = '/' + imagePath;
      }
      
      // Log for debugging
      console.log('Setting preview image:', imagePath);
      preview.src = imagePath + '?t=' + Date.now(); // Cache bust
      
      // Handle image load errors
      preview.onerror = function() {
        console.error('Failed to load preview image:', imagePath);
        preview.style.opacity = '0.5';
        preview.title = 'Failed to load image';
      };
      
      preview.onload = function() {
        console.log('Preview image loaded successfully');
        preview.style.opacity = '1';
      };
    }
  }

  /**
   * Enable crop mode
   */
  enableCropMode() {
    this.editMode = 'crop';
    document.getElementById('cropTools').style.display = 'block';
    document.getElementById('rotateTools').style.display = 'none';
    document.getElementById('resizeTools').style.display = 'none';
    document.getElementById('flipTools').style.display = 'none';
  }

  /**
   * Enable rotate mode
   */
  enableRotateMode() {
    this.editMode = 'rotate';
    document.getElementById('cropTools').style.display = 'none';
    document.getElementById('rotateTools').style.display = 'block';
    document.getElementById('resizeTools').style.display = 'none';
    document.getElementById('flipTools').style.display = 'none';
  }

  /**
   * Enable resize mode
   */
  enableResizeMode() {
    this.editMode = 'resize';
    document.getElementById('cropTools').style.display = 'none';
    document.getElementById('rotateTools').style.display = 'none';
    document.getElementById('resizeTools').style.display = 'block';
    document.getElementById('flipTools').style.display = 'none';
    
    // Populate metadata
    this.loadMetadata();
  }

  /**
   * Enable flip mode
   */
  enableFlipMode() {
    this.editMode = 'flip';
    document.getElementById('cropTools').style.display = 'none';
    document.getElementById('rotateTools').style.display = 'none';
    document.getElementById('resizeTools').style.display = 'none';
    document.getElementById('flipTools').style.display = 'block';
  }

  /**
   * Load image metadata
   */
  async loadMetadata() {
    try {
      const response = await fetch(`/api/photos/${this.photoId}/metadata`);
      if (!response.ok) throw new Error('Failed to load metadata');
      
      const data = await response.json();
      const metadata = data.metadata;
      
      document.getElementById('resizeWidth').value = metadata.width;
      document.getElementById('resizeHeight').value = metadata.height;
      document.getElementById('metadataDisplay').innerHTML = 
        `<small>Current: ${metadata.width}x${metadata.height} (${metadata.format})</small>`;
    } catch (error) {
      console.error('Metadata load error:', error);
    }
  }

  /**
   * Apply crop
   */
  async applyCrop() {
    try {
      const x = parseInt(document.getElementById('cropX').value) || 0;
      const y = parseInt(document.getElementById('cropY').value) || 0;
      const width = parseInt(document.getElementById('cropWidth').value);
      const height = parseInt(document.getElementById('cropHeight').value);

      if (!width || !height) {
        alert('Please enter crop width and height');
        return;
      }

      if (!confirm(`Crop to ${width}x${height}? This will create a new version.`)) {
        return;
      }

      this.showProgress('Cropping image...');

      const response = await fetch(`/api/photos/${this.photoId}/crop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinates: { x, y, width, height } })
      });

      if (!response.ok) throw new Error('Crop failed');

      const result = await response.json();
      alert('✓ Image cropped successfully! New version created.');
      
      // Reload versions and update preview
      await this.init();
      this.updatePreview();
      this.updateVersionList();
      
      this.hideProgress();
    } catch (error) {
      console.error('Crop error:', error);
      this.hideProgress();
      alert('Failed to crop image: ' + error.message);
    }
  }

  /**
   * Apply rotation
   */
  async applyRotate(degrees) {
    try {
      if (!confirm(`Rotate image ${degrees}°? This will create a new version.`)) {
        return;
      }

      this.showProgress('Rotating image...');

      const response = await fetch(`/api/photos/${this.photoId}/rotate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ degrees })
      });

      if (!response.ok) throw new Error('Rotation failed');

      const result = await response.json();
      alert(`✓ Image rotated ${degrees}° successfully! New version created.`);
      
      // Reload versions and update preview
      await this.init();
      this.updatePreview();
      this.updateVersionList();
      
      this.hideProgress();
    } catch (error) {
      console.error('Rotate error:', error);
      this.hideProgress();
      alert('Failed to rotate image: ' + error.message);
    }
  }

  /**
   * Apply resize
   */
  async applyResize() {
    try {
      const width = parseInt(document.getElementById('resizeWidth').value);
      const height = parseInt(document.getElementById('resizeHeight').value);
      const fit = document.getElementById('resizeFit').value || 'inside';

      if (!width || !height) {
        alert('Please enter resize dimensions');
        return;
      }

      if (!confirm(`Resize to ${width}x${height}? This will create a new version.`)) {
        return;
      }

      this.showProgress('Resizing image...');

      const response = await fetch(`/api/photos/${this.photoId}/resize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ width, height, fit })
      });

      if (!response.ok) throw new Error('Resize failed');

      const result = await response.json();
      alert(`✓ Image resized to ${width}x${height} successfully! New version created.`);
      
      // Reload versions and update preview
      await this.init();
      this.updatePreview();
      this.updateVersionList();
      
      this.hideProgress();
    } catch (error) {
      console.error('Resize error:', error);
      this.hideProgress();
      alert('Failed to resize image: ' + error.message);
    }
  }

  /**
   * Apply flip
   */
  async applyFlip(direction) {
    try {
      const directionText = direction === 'horizontal' ? 'horizontally' : 'vertically';
      
      if (!confirm(`Flip image ${directionText}? This will create a new version.`)) {
        return;
      }

      this.showProgress(`Flipping image ${directionText}...`);

      const response = await fetch(`/api/photos/${this.photoId}/flip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direction })
      });

      if (!response.ok) throw new Error('Flip failed');

      const result = await response.json();
      alert(`✓ Image flipped ${directionText} successfully! New version created.`);
      
      // Reload versions and update preview
      await this.init();
      this.updatePreview();
      this.updateVersionList();
      
      this.hideProgress();
    } catch (error) {
      console.error('Flip error:', error);
      this.hideProgress();
      alert('Failed to flip image: ' + error.message);
    }
  }

  /**
   * Restore previous version
   */
  async restoreVersion(versionNumber) {
    try {
      if (!confirm(`Restore to version ${versionNumber}? Current version will be inactive.`)) {
        return;
      }

      this.showProgress('Restoring version...');

      const response = await fetch(`/api/photos/${this.photoId}/restore`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionNumber })
      });

      if (!response.ok) throw new Error('Restore failed');

      const result = await response.json();
      alert(`✓ Restored to version ${versionNumber}`);
      
      // Reload versions and update preview
      await this.init();
      this.updatePreview();
      this.updateVersionList();
      
      this.hideProgress();
    } catch (error) {
      console.error('Restore error:', error);
      this.hideProgress();
      alert('Failed to restore version: ' + error.message);
    }
  }

  /**
   * Delete a version
   */
  async deleteVersion(versionNumber) {
    try {
      if (!confirm(`Delete version ${versionNumber} permanently? This cannot be undone.`)) {
        return;
      }

      this.showProgress('Deleting version...');

      const response = await fetch(`/api/photos/${this.photoId}/versions/${versionNumber}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Delete failed');

      alert(`✓ Version ${versionNumber} deleted`);
      
      // Reload versions
      await this.init();
      this.updateVersionList();
      
      this.hideProgress();
    } catch (error) {
      console.error('Delete error:', error);
      this.hideProgress();
      alert('Failed to delete version: ' + error.message);
    }
  }

  /**
   * Update version list UI
   */
  updateVersionList() {
    const list = document.getElementById('versionsList');
    if (!list) return;

    let html = '<div class="list-group">';

    this.versions.forEach(version => {
      const isCurrent = version.is_current ? 'active' : '';
      const isOriginal = version.is_original ? '📌 Original' : `v${version.version_number}`;
      const edits = version.edits_applied ? JSON.parse(version.edits_applied) : [];
      const editText = edits.length > 0 ? ` (${edits.map(e => e.type).join(', ')})` : '';

      html += `
        <div class="list-group-item ${isCurrent}">
          <div class="d-flex w-100 justify-content-between">
            <h6 class="mb-1">${isOriginal}${editText}</h6>
            <small>${version.width}x${version.height}</small>
          </div>
          <small class="text-muted">${new Date(version.created_at).toLocaleString()}</small>
          <div class="mt-2">
            ${!isOriginal && !version.is_current ? `<button class="btn btn-sm btn-primary" onclick="window.imageEditor.restoreVersion(${version.version_number})">↩️ Restore</button>` : ''}
            ${!isOriginal && !version.is_current ? `<button class="btn btn-sm btn-danger ms-2" onclick="window.imageEditor.deleteVersion(${version.version_number})">🗑️ Delete</button>` : ''}
            ${version.is_current ? '<span class="badge bg-success">Current</span>' : ''}
          </div>
        </div>
      `;
    });

    html += '</div>';
    list.innerHTML = html;
  }

  /**
   * Show progress indicator
   */
  showProgress(message = 'Processing...') {
    const modal = document.getElementById('imageEditorModal');
    let overlay = modal.querySelector('.editor-progress');
    
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'editor-progress position-absolute top-0 start-0 w-100 h-100 bg-dark bg-opacity-75 d-flex align-items-center justify-content-center';
      overlay.innerHTML = `
        <div class="spinner-border text-light" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <span class="ms-3 text-light">${message}</span>
      `;
      modal.appendChild(overlay);
    }
    overlay.style.display = 'flex';
    overlay.querySelector('span').textContent = message;
  }

  /**
   * Hide progress indicator
   */
  hideProgress() {
    const modal = document.getElementById('imageEditorModal');
    const overlay = modal.querySelector('.editor-progress');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }
}

// Global instance
window.imageEditor = null;

/**
 * Open image editor for a photo
 */
function openImageEditor(photoPath, photoId) {
  window.imageEditor = new ImageEditor(photoId || extractPhotoId(photoPath), photoPath);
  window.imageEditor.init().then(success => {
    if (success) {
      window.imageEditor.showEditor();
      window.imageEditor.updateVersionList();
    }
  });
}

/**
 * Extract photo ID from path (fallback)
 */
function extractPhotoId(photoPath) {
  // Try to get from database by path (would need API endpoint)
  return window.confirm('Photo ID not found. Manual ID entry needed.') ? prompt('Enter photo ID:') : null;
}
