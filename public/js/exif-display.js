/**
 * EXIF Display Component
 * Shows detailed photo metadata in a modal or panel
 */

class ExifDisplay {
  constructor(photoId) {
    this.photoId = photoId;
    this.exifData = null;
  }

  async load() {
    try {
      const encodedId = encodeURIComponent(this.photoId);
      console.log(`Loading EXIF for: ${this.photoId} (encoded: ${encodedId})`);
      const url = `/api/photos/${encodedId}/exif`;
      console.log(`Fetch URL: ${url}`);
      
      const response = await fetch(url);
      
      // Handle both 200 OK and 304 Not Modified
      if (response.status !== 200 && response.status !== 304) {
        console.error(`EXIF API returned ${response.status}: ${response.statusText}`);
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`EXIF API error: ${errorData.error || response.statusText}`);
      }
      
      this.exifData = await response.json();
      console.log('EXIF data loaded:', this.exifData);
      return this.exifData;
    } catch (error) {
      console.error('Failed to load EXIF data:', error);
      throw error;
    }
  }

  render(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container with ID "${containerId}" not found`);
      throw new Error(`Container not found: ${containerId}`);
    }

    if (!this.exifData) {
      console.error('No EXIF data loaded');
      container.innerHTML = '<p>No EXIF data loaded</p>';
      throw new Error('No EXIF data loaded');
    }

    // Handle both direct exif object and wrapped response
    const exif = this.exifData.exif || this.exifData;
    const summary = this.exifData.summary;
    
    console.log('=== EXIF RENDER DEBUG ===');
    console.log('this.exifData:', this.exifData);
    console.log('exif object:', exif);
    console.log('exif type:', typeof exif);
    console.log('exif keys:', exif ? Object.keys(exif) : 'exif is null/undefined');
    
    // Check if exif has any data
    const hasData = exif && typeof exif === 'object' && Object.keys(exif).length > 0;
    console.log('hasData check result:', hasData);
    
    if (!hasData) {
      console.error('EXIF check failed. exifData:', this.exifData);
      container.innerHTML = '<p>No EXIF data available for this photo.</p>';
      throw new Error('No EXIF data available');
    }

    console.log('Proceeding to render HTML...');
    let html = '<div class="exif-container" style="padding: 15px; font-size: 13px; line-height: 1.6; color: #333; background: #fff;">';

    // Summary section
    if (summary) {
      html += `
        <div class="exif-summary" style="background: #f5f5f5; padding: 12px; border-radius: 4px; margin-bottom: 15px; color: #222; border-left: 4px solid #0066cc;">
          <h3 style="margin: 0 0 8px 0; color: #000; font-size: 16px;">📸 Quick Summary</h3>
          <p class="summary-text" style="margin: 0; color: #444; font-size: 12px;">${summary}</p>
        </div>
      `;
    }

    // Camera section
    const camera = exif.camera || {};
    if (camera.make || camera.model || camera.lens) {
      html += `
        <div class="exif-section" style="margin-bottom: 12px;">
          <h4 style="margin: 0 0 8px 0; color: #000; font-size: 14px; border-bottom: 1px solid #ddd; padding-bottom: 4px;">📷 Camera</h4>
          <table class="exif-table" style="width: 100%; font-size: 12px;">
            ${camera.make ? `<tr><td style="width: 40%; padding: 4px 0; color: #666; font-weight: 500;"><strong>Make</strong></td><td style="color: #222;">${this.escapeHtml(camera.make)}</td></tr>` : ''}
            ${camera.model ? `<tr><td style="width: 40%; padding: 4px 0; color: #666; font-weight: 500;"><strong>Model</strong></td><td style="color: #222;">${this.escapeHtml(camera.model)}</td></tr>` : ''}
            ${camera.serialNumber ? `<tr><td style="width: 40%; padding: 4px 0; color: #666; font-weight: 500;"><strong>Serial #</strong></td><td style="color: #222;">${this.escapeHtml(camera.serialNumber)}</td></tr>` : ''}
            ${camera.lens ? `<tr><td style="width: 40%; padding: 4px 0; color: #666; font-weight: 500;"><strong>Lens</strong></td><td style="color: #222;">${this.escapeHtml(camera.lens)}</td></tr>` : ''}
          </table>
        </div>
      `;
    }

    // Shooting parameters section
    const shooting = exif.shooting || {};
    if (shooting.iso || shooting.fNumber || shooting.exposureTime || shooting.focalLength) {
      html += `
        <div class="exif-section" style="margin-bottom: 12px;">
          <h4 style="margin: 0 0 8px 0; color: #000; font-size: 14px; border-bottom: 1px solid #ddd; padding-bottom: 4px;">⚙️ Shooting Parameters</h4>
          <table class="exif-table" style="width: 100%; font-size: 12px;">
            ${shooting.focalLength ? `<tr><td style="width: 40%; padding: 4px 0; color: #666; font-weight: 500;"><strong>Focal Length</strong></td><td style="color: #222;">${shooting.focalLength}</td></tr>` : ''}
            ${shooting.fNumber ? `<tr><td style="width: 40%; padding: 4px 0; color: #666; font-weight: 500;"><strong>Aperture</strong></td><td style="color: #222;">${shooting.fNumber}</td></tr>` : ''}
            ${shooting.exposureTime ? `<tr><td style="width: 40%; padding: 4px 0; color: #666; font-weight: 500;"><strong>Shutter Speed</strong></td><td style="color: #222;">${shooting.exposureTime}</td></tr>` : ''}
            ${shooting.iso ? `<tr><td style="width: 40%; padding: 4px 0; color: #666; font-weight: 500;"><strong>ISO</strong></td><td style="color: #222;">${shooting.iso}</td></tr>` : ''}
            ${shooting.flash ? `<tr><td style="width: 40%; padding: 4px 0; color: #666; font-weight: 500;"><strong>Flash</strong></td><td style="color: #222;">${this.escapeHtml(String(shooting.flash))}</td></tr>` : ''}
            ${shooting.meteringMode ? `<tr><td style="width: 40%; padding: 4px 0; color: #666; font-weight: 500;"><strong>Metering Mode</strong></td><td style="color: #222;">${this.escapeHtml(String(shooting.meteringMode))}</td></tr>` : ''}
            ${shooting.exposureProgram ? `<tr><td style="width: 40%; padding: 4px 0; color: #666; font-weight: 500;"><strong>Exposure Program</strong></td><td style="color: #222;">${this.escapeHtml(String(shooting.exposureProgram))}</td></tr>` : ''}
          </table>
        </div>
      `;
    }

    // Image properties section
    const image = exif.image || {};
    if (image.width || image.height || image.colorSpace) {
      html += `
        <div class="exif-section" style="margin-bottom: 12px;">
          <h4 style="margin: 0 0 8px 0; color: #000; font-size: 14px; border-bottom: 1px solid #ddd; padding-bottom: 4px;">🖼️ Image Properties</h4>
          <table class="exif-table" style="width: 100%; font-size: 12px;">
            ${image.width ? `<tr><td style="width: 40%; padding: 4px 0; color: #666; font-weight: 500;"><strong>Width</strong></td><td style="color: #222;">${image.width}px</td></tr>` : ''}
            ${image.height ? `<tr><td style="width: 40%; padding: 4px 0; color: #666; font-weight: 500;"><strong>Height</strong></td><td style="color: #222;">${image.height}px</td></tr>` : ''}
            ${image.colorSpace ? `<tr><td style="width: 40%; padding: 4px 0; color: #666; font-weight: 500;"><strong>Color Space</strong></td><td style="color: #222;">${image.colorSpace}</td></tr>` : ''}
            ${image.orientation ? `<tr><td style="width: 40%; padding: 4px 0; color: #666; font-weight: 500;"><strong>Orientation</strong></td><td style="color: #222;">${image.orientation}</td></tr>` : ''}
          </table>
        </div>
      `;
    }

    // Date/Time section
    if (shooting.dateTime || shooting.dateTimeOriginal || shooting.dateTimeDigitized) {
      html += `
        <div class="exif-section" style="margin-bottom: 12px;">
          <h4 style="margin: 0 0 8px 0; color: #000; font-size: 14px; border-bottom: 1px solid #ddd; padding-bottom: 4px;">📅 Date & Time</h4>
          <table class="exif-table" style="width: 100%; font-size: 12px;">
            ${shooting.dateTime ? `<tr><td style="width: 40%; padding: 4px 0; color: #666; font-weight: 500;"><strong>Date Modified</strong></td><td style="color: #222;">${this.formatDateTime(shooting.dateTime)}</td></tr>` : ''}
            ${shooting.dateTimeOriginal ? `<tr><td style="width: 40%; padding: 4px 0; color: #666; font-weight: 500;"><strong>Date Taken</strong></td><td style="color: #222;">${this.formatDateTime(shooting.dateTimeOriginal)}</td></tr>` : ''}
            ${shooting.dateTimeDigitized ? `<tr><td style="width: 40%; padding: 4px 0; color: #666; font-weight: 500;"><strong>Date Digitized</strong></td><td style="color: #222;">${this.formatDateTime(shooting.dateTimeDigitized)}</td></tr>` : ''}
          </table>
        </div>
      `;
    }

    // GPS section
    if (exif.gpsLatitude || exif.gpsLongitude) {
      const mapsUrl = `https://maps.google.com/?q=${exif.gpsLatitude},${exif.gpsLongitude}`;
      html += `
        <div class="exif-section">
          <h4>📍 GPS Location</h4>
          <table class="exif-table">
            <tr><td>Latitude</td><td>${exif.gpsLatitude}</td></tr>
            <tr><td>Longitude</td><td>${exif.gpsLongitude}</td></tr>
            ${exif.gpsAltitude ? `<tr><td>Altitude</td><td>${exif.gpsAltitude}m</td></tr>` : ''}
            <tr><td colspan="2">
              <a href="${mapsUrl}" target="_blank" class="btn-link">🗺️ View on Google Maps</a>
            </td></tr>
          </table>
        </div>
      `;
    }

    // Copyright/Artist section
    const copyright = exif.copyright || {};
    const software = exif.software || {};
    if (copyright.artist || copyright.copyright || software.software) {
      html += `
        <div class="exif-section" style="margin-bottom: 12px;">
          <h4 style="margin: 0 0 8px 0; color: #000; font-size: 14px; border-bottom: 1px solid #ddd; padding-bottom: 4px;">📝 Copyright & Credits</h4>
          <table class="exif-table" style="width: 100%; font-size: 12px;">
            ${copyright.artist ? `<tr><td style="width: 40%; padding: 4px 0; color: #666; font-weight: 500;"><strong>Photographer</strong></td><td style="color: #222;">${this.escapeHtml(copyright.artist)}</td></tr>` : ''}
            ${copyright.copyright ? `<tr><td style="width: 40%; padding: 4px 0; color: #666; font-weight: 500;"><strong>Copyright</strong></td><td style="color: #222;">${this.escapeHtml(copyright.copyright)}</td></tr>` : ''}
            ${software.software ? `<tr><td style="width: 40%; padding: 4px 0; color: #666; font-weight: 500;"><strong>Software</strong></td><td style="color: #222;">${this.escapeHtml(software.software)}</td></tr>` : ''}
          </table>
        </div>
      `;
    }

    html += '</div>';

    container.innerHTML = html;

    return html;
  }

  renderModal() {
    const modal = document.createElement('div');
    modal.className = 'exif-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>📸 Photo Details</h2>
          <button class="btn-close" onclick="this.closest('.exif-modal').remove()">&times;</button>
        </div>
        <div class="modal-body" id="exif-modal-body"></div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.exif-modal').remove()">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this.render('exif-modal-body');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  formatDateTime(dateString) {
    // Handle both string and object formats
    if (!dateString) return '';
    
    // If it's an object with display property, use that
    if (typeof dateString === 'object') {
      if (dateString.display) return dateString.display;
      if (dateString.iso) return new Date(dateString.iso).toLocaleString();
      return '';
    }
    
    // If it's a numeric timestamp
    if (!isNaN(dateString) && dateString.length < 13) {
      return new Date(parseInt(dateString) * 1000).toLocaleString();
    }
    
    // EXIF format is typically "YYYY:MM:DD HH:MM:SS"
    if (typeof dateString === 'string') {
      const formatted = dateString.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
      try {
        return new Date(formatted).toLocaleString();
      } catch (e) {
        return dateString;
      }
    }
    
    return String(dateString);
  }
}

// Global helper function for quick EXIF display
async function showExifData(photoId) {
  try {
    const exif = new ExifDisplay(photoId);
    await exif.load();
    exif.renderModal();
  } catch (error) {
    console.error('Error showing EXIF data:', error);
    // Show error in modal
    const modal = document.createElement('div');
    modal.className = 'exif-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>📸 Photo Details</h2>
          <button class="btn-close" onclick="this.closest('.exif-modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <p style="color: red;">Error loading EXIF data: ${error.message}</p>
          <p>Check browser console for more details.</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.exif-modal').remove()">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
}

// Helper to embed EXIF in photo detail view
async function embedExifData(photoId, containerId) {
  try {
    const exif = new ExifDisplay(photoId);
    await exif.load();
    exif.render(containerId);
  } catch (error) {
    console.error('Error embedding EXIF data:', error);
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `<p style="color: red;">Error loading EXIF: ${error.message}</p>`;
    }
  }
}

// Expose to global scope for integration
window.ExifDisplay = ExifDisplay;
