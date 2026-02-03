# Quick Start Guide - Photo Gallery v2.0

## 🚀 Installation (5 Minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
# Copy example environment file
copy .env.example .env

# Edit .env (optional - defaults work with Docker)
# notepad .env
```

### 3. Start Database (Docker)
```bash
docker-compose -f docker-compose-mysql.yaml up -d
```

### 4. Start Application
```bash
npm run dev
```

### 5. Open Browser
```
http://localhost:8082
```

---

## ✅ Verification Checklist

When you start the app, you should see:
```
✓ Database connected successfully
✓ Application is running at: http://localhost:8082
✓ Cache clear interval: 600s
✓ Data directory: C:\MyData\photos\data
```

---

## 📝 Common Commands

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start

# Stop gracefully (Ctrl+C)
# Wait for: ✓ Server closed

# View database
http://localhost:8080  # Adminer interface
# Login: Server=db, User=root, Password=photos, Database=mydb
```

---

## 🧪 Test the Improvements

### Test Upload Validation
```bash
# Try uploading invalid file type (should fail)
curl -F "file=@test.exe" -F "album=test" http://localhost:8082/upload

# Expected response:
# {"error":"Invalid file type. Allowed types: images and videos only."}
```

### Test Pagination Validation
```bash
# Try requesting too many items (should limit to 100)
curl "http://localhost:8082/photos?id=Home&page=0&items=999"

# Check response - should return max 100 items
```

### Test Caching
```bash
# First request - should show "Cache MISS"
curl "http://localhost:8082/photos?id=Home&page=0&items=20"

# Second request - should show "Cache HIT"
curl "http://localhost:8082/photos?id=Home&page=0&items=20"

# Check console for cache statistics
```

### Test Error Handling
```bash
# Invalid album name (path traversal attempt)
curl "http://localhost:8082/photos?id=../../etc"

# Expected response:
# {"error":"Invalid album name."}
```

---

## 🔧 Configuration Quick Reference

### .env File
```env
PORT=8082                    # Server port
NODE_ENV=development         # Environment mode
DB_HOST=localhost           # Database host
DB_USER=root                # Database user
DB_PASSWORD=photos          # Database password
DB_NAME=mydb                # Database name
DB_CONNECTION_LIMIT=10      # Connection pool size
CACHE_CLEAR_INTERVAL=600000 # Cache clear (10 min)
MAX_FILE_SIZE=104857600     # Max upload (100MB)
```

### File Upload Limits
- Max size: 100MB (configurable in .env)
- Allowed image types: jpg, jpeg, png, gif, svg, bmp, webp
- Allowed video types: mp4, mov, avi, mkv, webm, flv, wmv, mpeg, mpg, ogv, 3gp

### Pagination Limits
- Min items per page: 1
- Max items per page: 100
- Default items per page: 20

### Thumbnail Limits
- Max width: 1200px
- Max height: 1200px
- Quality range: 1-100 (default 80)

---

## 🐛 Troubleshooting

### Database Won't Connect
```bash
# Check if Docker is running
docker ps

# Check MySQL logs
docker logs photos-db-1

# Restart database
docker-compose -f docker-compose-mysql.yaml restart
```

### Port Already in Use
```bash
# Find process using port 8082
netstat -ano | findstr :8082

# Change port in .env
PORT=8083
```

### Dependencies Issues
```bash
# Clear node_modules and reinstall
rmdir /s node_modules
npm install
```

### GraphicsMagick/FFmpeg Not Found
```bash
# Verify installation
gm version
ffmpeg -version

# Add to PATH if needed
# Windows: System Properties > Environment Variables > Path
```

---

## 📊 Monitoring

### Cache Statistics
Check console for cache performance:
```
✓ Cache HIT for album "Home" page 0 items 20
✗ Cache MISS for album "vacation-2024" page 0 items 20
Clearing image cache. Stats - Size: 15, Hits: 42, Misses: 8
```

### Database Pool
Check startup message:
```
✓ Database connected successfully
```

If you see errors:
```
❌ Database connection failed: [error message]
```

---

## 🎯 What's Different in v2.0?

### You'll Notice:
1. **Better Error Messages**: Clear JSON errors instead of generic messages
2. **Cache Stats**: Console shows cache hits/misses
3. **Validation**: Invalid uploads/requests are rejected with helpful errors
4. **Performance**: Faster response times due to connection pooling
5. **Visual Indicators**: ✓ and ✗ symbols in console logs

### Code Quality:
- Modern ES6+ syntax throughout
- Async/await instead of callbacks
- Comprehensive error handling
- Input validation everywhere
- Security improvements

---

## 📚 Further Reading

- [README.md](README.md) - Full documentation
- [CHANGELOG.md](CHANGELOG.md) - Detailed changes
- [IMPROVEMENTS.md](IMPROVEMENTS.md) - Technical improvements
- [.env.example](.env.example) - Configuration template

---

## 💡 Pro Tips

1. **Development Mode**: Use `npm run dev` for auto-reload
2. **Check Logs**: Console shows detailed info about cache, database, errors
3. **Test Validation**: Try uploading invalid files to see validation in action
4. **Monitor Cache**: Watch cache stats to understand performance
5. **Graceful Shutdown**: Always use Ctrl+C (once) to stop properly

---

**Version:** 2.0.0  
**Quick Start Time:** ~5 minutes  
**Status:** Production Ready ✅
