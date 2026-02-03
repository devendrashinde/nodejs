# Photo Gallery Application

A modern, feature-rich web-based photo gallery application built with Node.js, Express, and AngularJS. This application automatically generates a photo gallery from a directory structure, supports video playback, provides image tagging capabilities, and includes a REST API for photo management.

**Version 2.0** includes major improvements in performance, security, error handling, and code quality with ES6+ modernization.

## 🌟 Features

### Core Functionality
- **Auto-Generated Gallery**: Automatically scans directories and generates photo galleries
- **Album Management**: Organize photos into albums with hierarchical folder structure
- **Media Support**: Handles images (JPG, PNG, GIF, SVG, WebP, BMP) and videos (MP4, MOV, AVI, MKV, WebM, MPG, 3GP, etc.)
- **Smart Thumbnail Generation**: 
  - Automatic thumbnail creation with quality control and caching
  - **Separate storage** for thumbnails (configurable directory)
  - **Hash-based filenames** to prevent collisions
  - Thumbnails stored outside media directories for better organization
  - Easy cache management and cleanup utilities
- **Photo Tagging**: Add and manage tags for photos with autocomplete support
- **Secure File Upload**: Upload photos with validation (type, size, filename sanitization)
- **Optimized Pagination**: Efficient pagination with validation (max 100 items per page)
- **Advanced Caching**: Map-based cache with statistics tracking (hits/misses)
- **Responsive Design**: Mobile-friendly interface using Bootstrap 5

### Performance & Security 🔐
- **Connection Pooling**: Database connection pool for better performance
- **Input Validation**: File type, size, and path validation to prevent attacks
- **Path Traversal Protection**: Prevents unauthorized directory access
- **SQL Injection Prevention**: Parameterized queries throughout
- **Rate Limiting Ready**: Infrastructure for API rate limiting
- **Security Headers**: Helmet.js support for HTTP security headers
- **Graceful Shutdown**: Proper cleanup on server termination

### User Interface
- **Fancybox Integration**: Beautiful lightbox for viewing photos and videos
- **Search Functionality**: Search photos by tags
- **Album Navigation**: Easy navigation through nested album structure
- **Filter Options**: Filter photos by tags
- **Sticky Header**: Collapsible header with album selector and controls
- **Loading Indicators**: Visual feedback during data loading

### REST API
- Full CRUD operations for photos and albums
- MySQL database with connection pooling
- Async/await support throughout
- Comprehensive error handling
- JWT authentication support (optional)
- CORS enabled for cross-origin requests

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **MySQL** (v5.7+ or MySQL 8.0+) or MariaDB
- **GraphicsMagick** or ImageMagick (for image processing)
- **FFmpeg** (for video thumbnail generation)

## 🚀 Installation

### 1. Clone or download the repository

```bash
cd c:\MyData\photos
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure:

```bash
copy .env.example .env
```

Edit `.env` file with your settings:

```env
PORT=8082
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=photos
DB_NAME=mydb
DB_CONNECTION_LIMIT=10
```

### 4. Install System Dependencies

#### GraphicsMagick (for image thumbnails)
- **Windows**: Download from http://www.graphicsmagick.org/download.html
- **Linux**: `sudo apt-get install graphicsmagick`
- **macOS**: `brew install graphicsmagick`

#### FFmpeg (for video thumbnails)
- **Windows**: Download from https://ffmpeg.org/download.html
- **Linux**: `sudo apt-get install ffmpeg`
- **macOS**: `brew install ffmpeg`

### 5. Database Setup

#### Option A: Using Docker Compose (Recommended)

```bash
docker-compose -f docker-compose-mysql.yaml up -d
```

This will start:
- MySQL 8.0.30 on port 3306 (root password: `photos`)
- Adminer (database management UI) on port 8080

#### Option B: Manual MySQL Setup

1. Create a database named `mydb`
2. Run the SQL scripts in order:
   ```bash
   mysql -u root -p mydb < sql/mydb-mysql.sql
   mysql -u root -p mydb < sql/photos.sql
   mysql -u root -p mydb < sql/tags.sql
   mysql -u root -p mydb < sql/users.sql
   ```

### 6. Database Connection

The database connection is now configured via environment variables in `.env`:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=photos
DB_NAME=mydb
DB_CONNECTION_LIMIT=10
```

Connection pooling is automatically configured with:
- 10 concurrent connections
- Auto-reconnect on connection loss
- Graceful shutdown support

### 7. Prepare Your Photo Directory

Place your photos in the `data/` directory. The application will automatically organize them by albums.

Directory structure example:
```
data/
  ├── pictures/
  │   ├── 2020-Jun/
  │   ├── 2018-Nov/
  │   └── nature/
  ├── movies/
  └── Home/
```

## 🎯 Usage

### Start the Application

**Production mode:**
```bash
npm start
```

**Development mode with auto-reload:**
```bash
npm run dev
```

**Thumbnail Cleanup:**
```bash
# Preview what would be deleted (dry-run)
npm run cleanup-thumbnails:dry

# Remove orphaned thumbnails
npm run cleanup-thumbnails
```

The application will be available at: **http://localhost:8082**

You'll see startup messages:
```
✓ Database connected successfully
✓ Application is running at: http://localhost:8082
✓ Cache clear interval: 600s
✓ Data directory: C:\MyData\photos\data
✓ Thumbnail directory: ./temp-pic/thumbnails
```

### Main Server Endpoints

#### Web Interface
- `GET /` - Main photo gallery interface
- `GET /photos?id={album}&page={page}&items={items}` - Get photos from an album (with validation)
- `GET /thumb?id={photoPath}&w={width}&h={height}&q={quality}` - Get optimized thumbnail
- `POST /upload` - Upload a new photo (with validation)

#### REST API Endpoints

**Photos:**
- `POST /photos` - Create a new photo record
- `GET /photos?id={id}` - Get photo by ID
- `GET /photos?name={name}` - Get photo by name
- `GET /photos?tag={tag}` - Get photos by tag
- `PATCH /photos` - Update photo tags
- `DELETE /photos?id={id}` - Delete a photo

**Albums:**
- `GET /albums` - Get all albums
- `POST /albums` - Create a new album
- `GET /albums/:albumId` - Get specific album
- `PUT /albums/:albumId` - Update album tags
- `DELETE /albums/:albumId` - Delete an album

**Tags:**
- `GET /alltags` - Get all available tags

### Thumbnail Generation

The thumbnail endpoint now supports quality control:

```
GET /thumb?id=data/pictures/photo.jpg&w=300&h=300&q=85
```

Parameters:
- `w` - Width (max 1200px)
- `h` - Height (max 1200px)
- `q` - Quality (1-100, default 80)

Thumbnails are cached for 24 hours and EXIF data is removed for privacy.

### File Naming Convention

The application can auto-detect album names from photo filenames:
- Photos with format `IMG_YYYYMM*` or `VID_YYYYMM*` will be sorted into `YYYY-MMM` albums
- Example: `IMG_202401_001.jpg` → Album `2024-Jan`

### Supported File Formats

**Images:** JPG, JPEG, PNG, GIF, SVG  
**Videos:** MP4, MOV, AVI, MKV, WebM, FLV, WMV, MPEG, MPG, OGV, 3GP

**Excluded:** DB, EXE, TMP, DOC, DAT, INI, SRT, IDX, RAR, SUB, ZIP, PHP, WMDB

## 🏗️ Project Structure

```
.
├── app/
│   ├── controllers/
│   │   ├── photoController.js    # Photo CRUD operations
│   │   └── taskController.js     # Task management
│   ├── models/
│   │   ├── albumModel.js         # Album database model
│   │   ├── photoModel.js         # Photo database model
│   │   ├── taskModel.js          # Task database model
│   │   ├── usersModel.js         # User database model
│   │   └── db.js                 # MySQL connection config
│   ├── routes/
│   │   └── appRoutes.js          # API route definitions
│   └── services/
│       └── media.js              # Media processing (thumbnails)
├── public/
│   ├── js/                       # Angular app and controllers
│   ├── main.js                   # Main JavaScript functionality
│   ├── gallery.css               # Gallery styles
│   ├── main.css                  # Main styles
│   └── jquery.fancybox.min.js    # Fancybox library
├── sql/                          # Database schema files
├── data/                         # Photo storage directory
├── views/                        # Pug templates (if used)
├── server-photos.js              # Main application server
├── server-mysql-restful.js       # Alternative REST API server
├── ImageDetails.js               # Image metadata class
├── index.pug                     # Main gallery template
├── package.json                  # Dependencies
└── docker-compose-mysql.yaml     # Docker setup for MySQL
```

## 🔧 Configuration

### Environment Variables

All configuration is now centralized in `.env` file:

```env
# Server Configuration
PORT=8082
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=photos
DB_NAME=mydb
DB_CONNECTION_LIMIT=10

# Cache Configuration
CACHE_CLEAR_INTERVAL=600000  # 10 minutes in milliseconds
ITEMS_PER_PAGE=20

# File Upload Configuration
MAX_FILE_SIZE=104857600  # 100MB in bytes

# Image Processing
THUMBNAIL_WIDTH=200
THUMBNAIL_HEIGHT=200
THUMBNAIL_QUALITY=80
```

### Application Settings

Key configuration constants in [server-photos.js](server-photos.js):

```javascript
const ITEMS_PER_PAGE = 20;           // Items per page (max 100)
const CACHE_CLEAR_INTERVAL = 600000; // Cache clear interval (10 min)
const MAX_FILE_SIZE = 100 * 1024 * 1024; // Max upload size (100MB)
```

### Database Pool Settings

Connection pool is configured in [app/models/db.js](app/models/db.js):

```javascript
const pool = createPool({
    connectionLimit: 10,              // Max concurrent connections
    waitForConnections: true,         // Queue when no connections available
    queueLimit: 0,                    // Unlimited queue
    enableKeepAlive: true            // Keep connections alive
});
```
var BASE_DIR = 'data/';
```

## 📦 Technologies Used

### Backend
- **Express.js** - Web framework
- **MySQL** - Database
- **GraphicsMagick** - Image manipulation
- **FFmpeg** - Video processing
- **Express-FileUpload** - File upload handling
- **Body-Parser** - Request body parsing
- **CORS** - Cross-origin resource sharing
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **Pug** - Template engine
- **Helmet** ⭐ NEW - Security headers
- **Express-Rate-Limit** ⭐ NEW - API rate limiting (ready to use)
- **Winston** ⭐ NEW - Advanced logging (ready to use)
- **Dotenv** ⭐ NEW - Environment variable management

### Frontend
- **AngularJS** - Frontend framework
- **Bootstrap 5** - UI framework
- **jQuery** - DOM manipulation
- **Fancybox 3** - Lightbox gallery
- **Font Awesome 6** - Icons

## 🐛 Troubleshooting

### Thumbnails not generating
- Ensure GraphicsMagick is installed and in system PATH
- For videos, ensure FFmpeg is installed
- Check file permissions on the data directory
- Check console for detailed error messages

### Database connection errors
- Verify MySQL is running: `docker ps` or check MySQL service
- Check credentials in `.env` file
- Ensure database `mydb` exists
- Check console for connection pool messages:
  - `✓ Database connected successfully` means it's working
  - `❌ Database connection failed` shows the error

### Port already in use
- Change the port in `.env` file: `PORT=8083`
- Or kill the process using the port: `netstat -ano | findstr :8082`

### Upload not working
- Check write permissions on the `data/` directory
- Verify the album folder exists
- Check file size (max 100MB by default in `.env`)
- Invalid file types are rejected (check console for details)
- Filenames are automatically sanitized

### Cache issues
- Cache is cleared every 10 minutes automatically
- Check cache stats in console: `Cache HIT` vs `Cache MISS`
- Restart server to clear cache immediately

### Server won't shut down gracefully
- The server has a 10-second timeout for graceful shutdown
- Check console for: `⚠ Received shutdown signal, closing server gracefully...`
- Force kill if needed (Ctrl+C twice)

## 📝 License

ISC

## 👤 Author

**Devendra**  
Email: geetds@googlemail.com

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📸 Usage Examples

### Upload a Photo

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('album', 'vacation-2024');

fetch('http://localhost:8082/upload', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => {
  if (data.error) {
    console.error('Upload failed:', data.error);
  } else {
    console.log('Upload successful:', data);
  }
})
.catch(error => console.error('Error:', error));
```

### Get Photos from Album with Pagination

```javascript
fetch('http://localhost:8082/photos?id=vacation-2024&page=0&items=20')
  .then(response => response.json())
  .then(data => {
    console.log('Total photos:', data.totalPhotos);
    console.log('Photos:', data.data);
    console.log('Cached?', data.cached);
    console.log('Page:', data.page);
  });
```

### Get Optimized Thumbnail

```javascript
// Get 300x300 thumbnail at 85% quality
const thumbUrl = 'http://localhost:8082/thumb?id=data/pictures/photo.jpg&w=300&h=300&q=85';

fetch(thumbUrl)
  .then(response => response.blob())
  .then(blob => {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(blob);
    document.body.appendChild(img);
  });
```

### Add Tags to Photo

```javascript
fetch('http://localhost:8082/photos', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    id: 123,
    tags: 'beach, sunset, family'
  })
});
```

## 🔐 Security Notes

- **Database Password**: Default password is `photos` - **MUST change in production**
- **Environment Variables**: Never commit `.env` file to version control
- **File Upload Security**:
  - ✅ File type validation (whitelist approach)
  - ✅ File size limits (100MB default)
  - ✅ Filename sanitization to prevent injection
  - ✅ Path traversal protection
- **SQL Injection Prevention**: 
  - ✅ Parameterized queries throughout
  - ✅ Connection pooling with proper escaping
- **Input Validation**:
  - ✅ Album names validated to prevent path traversal
  - ✅ Pagination parameters validated (max 100 items)
  - ✅ Image dimensions limited (max 1200px)
- **Ready for Production**:
  - Helmet.js for security headers (installed, ready to configure)
  - Rate limiting infrastructure (installed, ready to configure)
  - CORS properly configured
  - Graceful shutdown handling

### Production Checklist
- [ ] Change database password in `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Enable Helmet.js security headers
- [ ] Configure rate limiting for API endpoints
- [ ] Set up HTTPS/SSL
- [ ] Enable advanced logging with Winston
- [ ] Set up monitoring and error tracking
- [ ] Configure backups for database and photos
- [ ] Review and restrict CORS origins
- [ ] Implement user authentication if needed

## ✨ What's New in v2.0

### Code Quality & Modernization
- ✅ Modernized to ES6+ (const/let, arrow functions, template literals)
- ✅ Converted callbacks to async/await throughout
- ✅ Replaced plain objects with Map for caching
- ✅ Added comprehensive error handling
- ✅ Fixed all syntax errors and type issues

### Performance Improvements
- ✅ Database connection pooling (10 connections)
- ✅ Enhanced caching with statistics (hits/misses tracking)
- ✅ HTTP cache headers for static files and thumbnails
- ✅ Pagination validation to prevent excessive queries
- ✅ Optimized thumbnail generation with quality control

### Security Enhancements
- ✅ Input validation for uploads (type, size, filename)
- ✅ Path traversal attack prevention
- ✅ SQL injection prevention with prepared statements
- ✅ Environment variable support for sensitive data
- ✅ Security packages added (Helmet, rate-limit)

### Developer Experience
- ✅ Environment-based configuration (.env)
- ✅ Graceful shutdown with cleanup
- ✅ Enhanced logging with visual indicators
- ✅ Dev/prod npm scripts
- ✅ Comprehensive error messages

See [CHANGELOG.md](CHANGELOG.md) for full details.

## 🚀 Future Enhancements

### Planned Features
- [ ] Redis caching for distributed systems
- [ ] WebP image format support
- [ ] Multiple thumbnail sizes (small, medium, large)
- [ ] EXIF data extraction and display
- [ ] Bulk operations (upload, tag, delete)
- [ ] Advanced search with filters
- [ ] User authentication and authorization
- [ ] Social sharing features
- [ ] Photo editing capabilities (rotate, crop, filters)
- [ ] Facial recognition and auto-tagging
- [ ] Slideshow mode
- [ ] Export album as ZIP
- [ ] Comment system
- [ ] Photo ratings
- [ ] Progressive Web App (PWA) support

### Potential Upgrades
- [ ] Migrate from AngularJS to modern React/Vue
- [ ] TypeScript support
- [ ] GraphQL API option
- [ ] Microservices architecture
- [ ] Kubernetes deployment configuration
- [ ] ElasticSearch for advanced search
- [ ] Machine learning for auto-categorization

---

**Version:** 2.0.0  
**Last Updated:** February 2, 2026  
**Node.js:** 16+  
**License:** ISC
