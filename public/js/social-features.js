/**
 * Social Features Component
 * Comments, ratings, favorites, sharing functionality
 */

class SocialFeatures {
  constructor() {
    this.currentPhotoId = null;
    this.ratings = {};
  }

  // ===== COMMENTS =====

  async loadComments(photoId) {
    try {
      const response = await fetch(`/api/photos/${encodeURIComponent(photoId)}/comments`);
      return await response.json();
    } catch (error) {
      console.error('Failed to load comments:', error);
      return { comments: [] };
    }
  }

  async addComment(photoId, text, userName = 'Anonymous') {
    try {
      const response = await fetch(`/api/photos/${encodeURIComponent(photoId)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          userName,
          userId: this.getUserId(),
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to add comment:', error);
      throw error;
    }
  }

  renderComments(photoId, containerId) {
    this.currentPhotoId = photoId;
    const container = document.getElementById(containerId);

    container.innerHTML = `
      <div class="comments-section">
        <h3>💬 Comments</h3>

        <!-- Comment Form -->
        <div class="comment-form">
          <input 
            type="text" 
            id="commenter-name" 
            class="form-input" 
            placeholder="Your name (optional)"
            maxlength="50"
          />
          <textarea 
            id="comment-text" 
            class="form-input" 
            placeholder="Write a comment... (1-1000 characters)"
            maxlength="1000"
            rows="3"
          ></textarea>
          <button id="btn-submit-comment" class="btn btn-primary">Post Comment</button>
        </div>

        <!-- Comments List -->
        <div id="comments-list" class="comments-list"></div>
      </div>
    `;

    document.getElementById('btn-submit-comment').addEventListener('click', () => {
      this.submitComment(photoId);
    });

    // Load and display comments
    this.loadComments(photoId).then((data) => {
      this.displayComments(data.comments || []);
    });
  }

  async submitComment(photoId) {
    const text = document.getElementById('comment-text').value.trim();
    const userName = document.getElementById('commenter-name').value.trim() || 'Anonymous';

    if (!text) {
      alert('Please write a comment');
      return;
    }

    try {
      await this.addComment(photoId, text, userName);
      document.getElementById('comment-text').value = '';
      this.loadComments(photoId).then((data) => {
        this.displayComments(data.comments || []);
      });
    } catch (error) {
      alert('Failed to post comment');
    }
  }

  displayComments(comments) {
    const container = document.getElementById('comments-list');
    if (!comments.length) {
      container.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
      return;
    }

    let html = '';
    comments.forEach((comment) => {
      const date = new Date(comment.createdAt).toLocaleString();
      html += `
        <div class="comment-item">
          <div class="comment-header">
            <strong>${this.escapeHtml(comment.userName)}</strong>
            <span class="comment-date">${date}</span>
          </div>
          <p class="comment-text">${this.escapeHtml(comment.text)}</p>
          ${comment.replies && comment.replies.length > 0 ? `
            <div class="comment-replies">
              ${comment.replies.map((reply) => `
                <div class="reply-item">
                  <strong>${this.escapeHtml(reply.userName)}</strong>: 
                  ${this.escapeHtml(reply.text)}
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // ===== RATINGS =====

  async loadRatings(photoId) {
    try {
      const response = await fetch(`/api/photos/${encodeURIComponent(photoId)}/ratings`);
      return await response.json();
    } catch (error) {
      console.error('Failed to load ratings:', error);
      return { average: 0, count: 0, distribution: {} };
    }
  }

  async addRating(photoId, rating) {
    try {
      const response = await fetch(`/api/photos/${encodeURIComponent(photoId)}/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          userId: this.getUserId(),
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to add rating:', error);
      throw error;
    }
  }

  renderRatings(photoId, containerId) {
    const container = document.getElementById(containerId);

    container.innerHTML = `
      <div class="ratings-section">
        <h3>⭐ Rating</h3>
        <div class="rating-input">
          ${[1, 2, 3, 4, 5].map((star) => `
            <button 
              class="star-btn" 
              data-rating="${star}"
              title="${star} star${star !== 1 ? 's' : ''}"
            >
              ⭐
            </button>
          `).join('')}
        </div>
        <div id="rating-stats" class="rating-stats"></div>
      </div>
    `;

    // Attach rating button listeners
    container.querySelectorAll('.star-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const rating = parseInt(e.target.dataset.rating);
        this.submitRating(photoId, rating);
      });
    });

    // Load and display rating stats
    this.loadRatings(photoId).then((data) => {
      this.displayRatingStats(data);
    });
  }

  async submitRating(photoId, rating) {
    try {
      await this.addRating(photoId, rating);
      this.loadRatings(photoId).then((data) => {
        this.displayRatingStats(data);
      });
    } catch (error) {
      alert('Failed to save rating');
    }
  }

  displayRatingStats(data) {
    const container = document.getElementById('rating-stats');
    if (!data.count) {
      container.innerHTML = '<p>No ratings yet</p>';
      return;
    }

    const percentage = (data.count > 0 ? (data.average / 5) * 100 : 0).toFixed(1);
    let html = `
      <div class="rating-stats-display">
        <p>
          <strong>${data.average.toFixed(1)}</strong> / 5 stars 
          <span class="rating-count">(${data.count} rating${data.count !== 1 ? 's' : ''})</span>
        </p>
        <div class="rating-bar">
          <div class="rating-fill" style="width: ${percentage}%"></div>
        </div>
    `;

    if (data.distribution) {
      html += '<div class="rating-distribution">';
      for (let i = 5; i >= 1; i--) {
        const count = data.distribution[i] || 0;
        const distPercentage = data.count > 0 ? (count / data.count) * 100 : 0;
        html += `
          <div class="distribution-row">
            <span>${i}★</span>
            <div class="dist-bar">
              <div class="dist-fill" style="width: ${distPercentage}%"></div>
            </div>
            <span>${count}</span>
          </div>
        `;
      }
      html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
  }

  // ===== FAVORITES =====

  async toggleFavorite(photoId, isFavorite = true) {
    try {
      const response = await fetch(`/api/photos/${encodeURIComponent(photoId)}/favorite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isFavorite,
          userId: this.getUserId(),
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      throw error;
    }
  }

  createFavoriteButton(photoId) {
    const button = document.createElement('button');
    button.id = `btn-favorite-${photoId}`;
    button.className = 'btn btn-favorite';
    button.textContent = '🤍 Favorite';
    button.dataset.photoId = photoId;
    button.dataset.isFavorite = false;

    button.addEventListener('click', async () => {
      const isFavorite = button.dataset.isFavorite === 'false';
      try {
        await this.toggleFavorite(photoId, isFavorite);
        button.dataset.isFavorite = isFavorite;
        button.textContent = isFavorite ? '❤️ Favorited' : '🤍 Favorite';
        button.classList.toggle('is-favorite', isFavorite);
      } catch (error) {
        alert('Failed to update favorite');
      }
    });

    return button;
  }

  // ===== SHARING =====

  async generateShareLink(photoId, expiresIn = 86400) {
    // expiresIn default 24 hours
    try {
      const response = await fetch(`/api/photos/${encodeURIComponent(photoId)}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expiresIn,
          viewerName: prompt('Share with (optional name):') || 'Guest',
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to generate share link:', error);
      throw error;
    }
  }

  async createShareLink(photoId) {
    try {
      const data = await this.generateShareLink(photoId);
      if (data.shareLink) {
        const url = `${window.location.origin}/shared/${data.shareLink}`;
        this.showShareModal(url);
      }
    } catch (error) {
      alert('Failed to create share link');
    }
  }

  showShareModal(shareUrl) {
    const modal = document.createElement('div');
    modal.className = 'share-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>🔗 Share Photo</h2>
          <button class="btn-close" onclick="this.closest('.share-modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <p>Share this link:</p>
          <div class="share-link-group">
            <input 
              type="text" 
              id="share-url-input" 
              class="form-input" 
              value="${shareUrl}" 
              readonly 
            />
            <button id="btn-copy-link" class="btn btn-primary">📋 Copy</button>
          </div>
          <p>Expires in 24 hours</p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('btn-copy-link').addEventListener('click', () => {
      document.getElementById('share-url-input').select();
      document.execCommand('copy');
      alert('Link copied to clipboard!');
    });
  }

  createShareButton(photoId) {
    const button = document.createElement('button');
    button.className = 'btn btn-share';
    button.textContent = '🔗 Share';
    button.addEventListener('click', () => this.createShareLink(photoId));
    return button;
  }

  // ===== ACTIVITY =====

  async getActivity(photoId) {
    try {
      const response = await fetch(`/api/photos/${encodeURIComponent(photoId)}/activity`);
      return await response.json();
    } catch (error) {
      console.error('Failed to load activity:', error);
      return { comments: 0, favorites: 0, ratings: 0, shares: 0, activityScore: 0 };
    }
  }

  async displayActivity(photoId, containerId) {
    const activity = await this.getActivity(photoId);
    const container = document.getElementById(containerId);

    container.innerHTML = `
      <div class="activity-summary">
        <h3>📊 Activity</h3>
        <div class="activity-stats">
          <div class="stat">
            <span class="stat-icon">💬</span>
            <span class="stat-value">${activity.comments}</span>
            <span class="stat-label">Comments</span>
          </div>
          <div class="stat">
            <span class="stat-icon">❤️</span>
            <span class="stat-value">${activity.favorites}</span>
            <span class="stat-label">Favorites</span>
          </div>
          <div class="stat">
            <span class="stat-icon">⭐</span>
            <span class="stat-value">${activity.ratings}</span>
            <span class="stat-label">Ratings</span>
          </div>
          <div class="stat">
            <span class="stat-icon">🔗</span>
            <span class="stat-value">${activity.shares}</span>
            <span class="stat-label">Shares</span>
          </div>
        </div>
        <p class="activity-score">Activity Score: <strong>${activity.activityScore.toFixed(1)}</strong></p>
      </div>
    `;
  }

  // ===== UTILITIES =====

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  getUserId() {
    // Return a user ID - in a real app, this would be from auth
    return localStorage.getItem('userId') || 'anonymous-' + Date.now();
  }
}

// Initialize social features
document.addEventListener('DOMContentLoaded', () => {
  window.socialFeatures = new SocialFeatures();
});
