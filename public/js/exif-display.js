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
      
      if (!response.ok) {
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
      return;
    }

    if (!this.exifData) {
      container.innerHTML = '<p>No EXIF data loaded</p>';
      return;
    }

    // Handle both direct exif object and wrapped response
    const exif = this.exifData.exif || this.exifData;
    const summary = this.exifData.summary;
    
    if (!exif || Object.keys(exif).length === 0) {
      container.innerHTML = '<p>No EXIF data available for this photo.</p>';
      return;
    }

    let html = '<div class="exif-container">';

    // Summary section
    if (summary) {
      html += `
        <div class="exif-summary">
          <h3>📸 Quick Summary</h3>
          <p class="summary-text">${summary}</p>
        </div>
      `;
    }

    // Camera section
    if (exif.make || exif.model || exif.lens) {
      html += `
        <div class="exif-section">
          <h4>📷 Camera</h4>
          <table class="exif-table">
            ${exif.make ? `<tr><td>Make</td><td>${this.escapeHtml(exif.make)}</td></tr>` : ''}
            ${exif.model ? `<tr><td>Model</td><td>${this.escapeHtml(exif.model)}</td></tr>` : ''}
            ${exif.serialNumber ? `<tr><td>Serial #</td><td>${this.escapeHtml(exif.serialNumber)}</td></tr>` : ''}
            ${exif.lens ? `<tr><td>Lens</td><td>${this.escapeHtml(exif.lens)}</td></tr>` : ''}
            ${exif.lensModel ? `<tr><td>Lens Model</td><td>${this.escapeHtml(exif.lensModel)}</td></tr>` : ''}
          </table>
        </div>
      `;
    }

    // Shooting parameters section
    if (exif.iso || exif.fNumber || exif.exposureTime || exif.focalLength) {
      html += `
        <div class="exif-section">
          <h4>⚙️ Shooting Parameters</h4>
          <table class="exif-table">
            ${exif.focalLength ? `<tr><td>Focal Length</td><td>${exif.focalLength}mm</td></tr>` : ''}
            ${exif.fNumber ? `<tr><td>Aperture</td><td>f/${exif.fNumber}</td></tr>` : ''}
            ${exif.exposureTime ? `<tr><td>Shutter Speed</td><td>${exif.exposureTime}s</td></tr>` : ''}
            ${exif.iso ? `<tr><td>ISO</td><td>${exif.iso}</td></tr>` : ''}
            ${exif.flash ? `<tr><td>Flash</td><td>${exif.flash}</td></tr>` : ''}
            ${exif.flashEnergy ? `<tr><td>Flash Energy</td><td>${exif.flashEnergy}</td></tr>` : ''}
            ${exif.meteringMode ? `<tr><td>Metering Mode</td><td>${exif.meteringMode}</td></tr>` : ''}
            ${exif.exposureProgram ? `<tr><td>Exposure Program</td><td>${exif.exposureProgram}</td></tr>` : ''}
          </table>
        </div>
      `;
    }

    // Image properties section
    if (exif.imageWidth || exif.imageHeight || exif.colorSpace) {
      html += `
        <div class="exif-section">
          <h4>🖼️ Image Properties</h4>
          <table class="exif-table">
            ${exif.imageWidth ? `<tr><td>Width</td><td>${exif.imageWidth}px</td></tr>` : ''}
            ${exif.imageHeight ? `<tr><td>Height</td><td>${exif.imageHeight}px</td></tr>` : ''}
            ${exif.xResolution ? `<tr><td>X Resolution</td><td>${exif.xResolution} dpi</td></tr>` : ''}
            ${exif.yResolution ? `<tr><td>Y Resolution</td><td>${exif.yResolution} dpi</td></tr>` : ''}
            ${exif.colorSpace ? `<tr><td>Color Space</td><td>${exif.colorSpace}</td></tr>` : ''}
            ${exif.orientation ? `<tr><td>Orientation</td><td>${exif.orientation}</td></tr>` : ''}
            ${exif.bitsPerSample ? `<tr><td>Bits Per Sample</td><td>${exif.bitsPerSample}</td></tr>` : ''}
          </table>
        </div>
      `;
    }

    // Date/Time section
    if (exif.dateTime || exif.dateTimeOriginal || exif.dateTimeDigitized) {
      html += `
        <div class="exif-section">
          <h4>📅 Date & Time</h4>
          <table class="exif-table">
            ${exif.dateTime ? `<tr><td>Date Modified</td><td>${this.formatDateTime(exif.dateTime)}</td></tr>` : ''}
            ${exif.dateTimeOriginal ? `<tr><td>Date Taken</td><td>${this.formatDateTime(exif.dateTimeOriginal)}</td></tr>` : ''}
            ${exif.dateTimeDigitized ? `<tr><td>Date Digitized</td><td>${this.formatDateTime(exif.dateTimeDigitized)}</td></tr>` : ''}
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
    if (exif.artist || exif.copyright || exif.software) {
      html += `
        <div class="exif-section">
          <h4>📝 Copyright & Credits</h4>
          <table class="exif-table">
            ${exif.artist ? `<tr><td>Photographer</td><td>${this.escapeHtml(exif.artist)}</td></tr>` : ''}
            ${exif.copyright ? `<tr><td>Copyright</td><td>${this.escapeHtml(exif.copyright)}</td></tr>` : ''}
            ${exif.software ? `<tr><td>Software</td><td>${this.escapeHtml(exif.software)}</td></tr>` : ''}
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
    // EXIF format is typically "YYYY:MM:DD HH:MM:SS"
    if (!dateString) return '';
    const formatted = dateString.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
    return new Date(formatted).toLocaleString();
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
