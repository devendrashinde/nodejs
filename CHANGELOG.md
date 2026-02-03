# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-02-02

### 🔧 Fixed
- Fixed syntax errors in `server-mysql-restful.js` (missing const declarations)
- Fixed typo in `app/models/db.js` ('user strict' → 'use strict')
- Removed undefined variables and functions

### ✨ Added
- **Environment Configuration**: Added `.env.example` for environment variables support
- **Security Enhancements**:
  - File upload validation (type, size, filename sanitization)
  - Path traversal attack prevention
  - Pagination parameter validation (max 100 items per page)
  - Input sanitization for album names
- **Database Improvements**:
  - Connection pooling for better performance
  - Promisified query function for async/await support
  - Better error handling with detailed error messages
  - Graceful database shutdown
- **Caching Enhancements**:
  - Upgraded from object to Map for better cache management
  - Cache statistics tracking (hits/misses)
  - HTTP cache headers for static files and thumbnails
  - Better cache key generation
- **Image Optimization**:
  - Quality parameter support for thumbnails
  - Dimension limits to prevent abuse (max 1200px)
  - EXIF data removal from thumbnails for privacy
  - Better cache headers (24-hour cache for thumbnails)
- **Error Handling**:
  - Centralized error handling middleware
  - AsyncHandler wrapper for route handlers
  - Detailed error logging with stack traces in development
  - Proper HTTP status codes
- **Developer Experience**:
  - Graceful server shutdown (SIGTERM/SIGINT handlers)
  - Enhanced logging with emojis for better visibility
  - Development and production npm scripts
  - Better console output with cache stats

### 🚀 Improved
- **Modernized JavaScript**:
  - Replaced all `var` with `const`/`let`
  - Converted callbacks to async/await
  - Used ES6+ features (arrow functions, template literals, destructuring)
  - Used Map instead of plain objects for caching
- **Code Quality**:
  - Consistent error handling patterns
  - Better function names and organization
  - Removed dead code and comments
  - Improved code readability
- **Performance**:
  - Database connection pooling (10 concurrent connections)
  - Efficient cache management with Map
  - Pagination validation prevents excessive queries
  - Thumbnail size limits prevent memory issues
- **Media Service**:
  - Async/await for thumbnail generation
  - Better error handling for FFmpeg operations
  - Cache headers for generated thumbnails
  - Quality control for image compression

### 📦 Dependencies
- Added `dotenv` (^16.0.3) - Environment variable management
- Added `helmet` (^7.1.0) - Security headers
- Added `express-rate-limit` (^7.1.5) - API rate limiting
- Added `winston` (^3.11.0) - Advanced logging
- Updated `express` (^4.17.1 → ^4.18.2)
- Updated `express-fileupload` (^1.2.0 → ^1.4.0)
- Updated `nodemon` (^2.0.4 → ^3.0.2)

### 📝 Documentation
- Enhanced README with comprehensive documentation
- Added `.env.example` for configuration template
- Updated `.gitignore` with better patterns
- Added CHANGELOG.md

### 🔐 Security
- File upload size limits (100MB default)
- File type validation (whitelist approach)
- Filename sanitization to prevent injection attacks
- Path traversal protection
- SQL injection prevention with parameterized queries

### 🎯 Breaking Changes
- Database connection now uses connection pooling instead of single connection
- Photo model methods now use async/await (backward compatible with callbacks)
- Error responses now return JSON instead of plain text
- Cache implementation changed from plain object to Map

## [1.0.0] - Initial Release

### Features
- Auto-generated photo gallery from directories
- Album management
- Photo tagging system
- File upload functionality
- Video thumbnail generation
- MySQL database integration
- REST API
- Responsive UI with Bootstrap and AngularJS
