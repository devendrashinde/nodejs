# Playlist Feature - Quick Start Guide

## What's New in v4.0?

Create and manage **playlists** - virtual albums that group media from different folders!

---

## Quick Actions

### 1️⃣ Create a Playlist

1. **Switch to Playlists Tab**
   - Click the "Playlists" button in the sidebar header

2. **Create New**
   - Click "➕ New Playlist" button
   - Enter playlist name (required)
   - Add optional description and tags
   - Click "Create Playlist"

### 2️⃣ Add Files to Playlist

#### Method A: Bulk Selection
1. Select multiple files using checkboxes in the gallery
2. Click "📋 Add to Playlist" in the bulk toolbar
3. Choose:
   - **Create new** - Type name and create on-the-fly
   - **Add to existing** - Select from list (1-based numbering)
4. Items are added with automatic position ordering

#### Method B: Select Files First
1. Make sure files are selected in an album view
2. Use bulk operations toolbar for seamless addition

### 3️⃣ View a Playlist

1. Switch to **Playlists** tab
2. Click a playlist name
3. Gallery displays all items in that playlist
4. See item count next to playlist name

### 4️⃣ Manage Playlist Items

**Remove Specific Item:**
- Open playlist
- Click ✕ button on the item
- Confirm removal
- Item count auto-decrements

**View Item Count:**
- Shows as badge next to playlist name: `Playlist Name [5]`

### 5️⃣ Organize with Tags

**Add Tags to Playlist:**
1. Click 🏷️ (tag icon) next to playlist name
2. Enter tags (comma-separated)
3. Click "Update"

**Search by Tag:**
1. Type in "Search playlists..." box
2. Results filtered instantly

### 6️⃣ Delete a Playlist

1. Click 🗑️ (trash icon) next to playlist
2. Confirm deletion
3. **Note:** Items stay in their original albums; only playlist is deleted

---

## Sidebar Controls

### Albums View
```
┌─────────────────────────┐
│ [Albums] [Playlists]    │  ← Toggle view
├─────────────────────────┤
│ 🔍 Search albums...     │
├─────────────────────────┤
│ 📂 All Albums (15)      │
│ ❤️ Favorites (2)        │
│                         │
│ 📂 Album 1  [2]         │  ← Tag badges
│    spring, 2025         │
│ [🏷️] [🗑️]              │
├─────────────────────────┤
```

### Playlists View
```
┌─────────────────────────┐
│ [Albums] [Playlists]    │  ← Toggle view
├─────────────────────────┤
│ 🔍 Search playlists...  │
│ [➕ New Playlist]       │
├─────────────────────────┤
│ 📋 Vacation  [8]        │  ← Item count
│    summer, travel       │
│ [🏷️] [🗑️]              │
│                         │
│ 📋 Favorites [3]       │
│    best-of              │
│ [🏷️] [🗑️]              │
├─────────────────────────┤
```

---

## Bulk Operations Workflow

### Step-by-Step Example

**Goal:** Add 10 beach photos from different albums to "Vacation" playlist

1. **Navigate to Album 1** with beach photos
2. **Select files:**
   - Check 3 photos from Album 1
3. **Navigate to Album 2** with more beach photos
   - Check 5 more photos
4. **Navigate to Album 3**
   - Check 2 more photos
5. **Click "📋 Add to Playlist"** in bulk toolbar
6. Choose **"Add to existing"**
7. Select **"1. Vacation [5]"** (shows current count)
8. **Confirm** - "Successfully added 10 item(s) to playlist"
9. Playlist now shows **"Vacation [15]"** in sidebar

---

## Modal Dialogs

### Create Playlist Modal
```
┌─────────────────────────────────────┐
│ ➕ Create New Playlist              │
├─────────────────────────────────────┤
│ Playlist Name *                     │
│ [Summer Trip                      ] │
│                                     │
│ Description                         │
│ [Photos from summer vacation...   ] │
│                                     │
│ Tags                                │
│ [summer, travel, 2025, family    ] │
├─────────────────────────────────────┤
│     [Cancel]      [Create Playlist] │
└─────────────────────────────────────┘
```

### Edit Tags Modal
```
┌─────────────────────────────────────┐
│ 🏷️ Edit Playlist Tags               │
├─────────────────────────────────────┤
│ 📋 Summer Trip                      │
│                                     │
│ Current Tags:                       │
│ [summer] [travel] [2025]            │
│                                     │
│ Tags                                │
│ [summer, travel, 2025, family...] │
├─────────────────────────────────────┤
│  [Cancel]  [Clear]      [Update]    │
└─────────────────────────────────────┘
```

---

## Tips & Tricks

### 💡 Pro Tips

1. **Use Descriptive Names**
   - Good: "Wedding Photos - June 2025"
   - Bad: "Playlist1", "Photos"

2. **Tag Everything**
   - Makes searching easier later
   - Example: `wedding, june, 2025, family`

3. **Organize by Theme**
   - Create playlists by occasion: "Birthday", "Holiday", etc.
   - Or by date: "Q1-2025", "Summer"

4. **Use Bulk Operations**
   - Faster than adding items one-by-one
   - Select from multiple albums at once

5. **Keep Playlists Lean**
   - Too many items = harder to navigate
   - Ideal range: 5-50 items per playlist

### 🔍 Search Tips

- **By Name:** Type in "Search playlists..." box
- **By Tag:** Type tag name in search
- **Case Insensitive:** "SUMMER" = "summer" = "Summer"

### ⚡ Keyboard Shortcuts

- **Create:** Focus input → Type name → Enter
- **Clear Search:** Click ✕ in search box
- **Delete:** Click 🗑️ → Confirm

---

## Common Questions

### Q: Can I move a file from one item count to another?
**A:** No - a file can be in multiple playlists simultaneously. Adding to a second playlist doesn't remove it from the first.

### Q: What happens if I delete a playlist?
**A:** The playlist is deleted, but all original files & albums are preserved. Only the playlist grouping is removed.

### Q: Can I reorder items in a playlist?
**A:** Items are ordered by position in the database. In future versions, drag-and-drop reordering will be available.

### Q: How many items can a playlist hold?
**A:** Technically unlimited - practically limited by browser memory and server resources.

### Q: Can I share playlists with others?
**A:** Not in v4.0. This feature is planned for future releases.

### Q: Are playlists backed up?
**A:** Yes - they're stored in the database and included in standard backups.

### Q: Can I export a playlist?
**A:** Not in v4.0. Export to JSON/M3U is planned for v4.1+.

---

## Troubleshooting

### Issue: "A playlist with this name already exists"
**Solution:** Use a unique name. Check existing playlists in sidebar.

### Issue: "No playlists available" when bulk adding
**Solution:** Create at least one playlist first using "New Playlist" button.

### Issue: Playlist doesn't appear in sidebar after creation
**Solution:** Refresh page (F5) or switch tabs and back.

### Issue: Items not appearing in playlist
**Solution:** 
- Verify items were actually selected
- Check browser console (F12) for errors
- Ensure database connection is active

### Issue: Search isn't working
**Solution:**
- Verify playlist has tags
- Use exact or partial tag names
- Case doesn't matter

---

## Data Storage

### What Gets Stored?
- ✅ Playlist name (unique)
- ✅ Playlist tags
- ✅ Playlist description
- ✅ Item positions
- ✅ Creation & update timestamps

### What Doesn't Get Stored?
- ❌ Original file paths (references only)
- ❌ File copies (links only)
- ❌ Playlist views/analytics (v4.0)

---

## Updates & Maintenance

### How to Backup Playlists
Database backup automatically includes playlists:
```bash
mysqldump mydb playlists playlist_items > backup.sql
```

### How to Restore
```bash
mysql mydb < backup.sql
```

### Database Migration
If upgrading from v3.0 → v4.0:
```bash
mysql mydb < sql/migration_v3_to_v4_mysql.sql
```

---

## Version Info

- **Current Version:** v4.0 (Playlist System)
- **Database:** MySQL 8.0+ / MariaDB 10.5+
- **UI Framework:** Bootstrap 5
- **JavaScript:** Angular 1.6

---

**Last Updated:** 2026-02-02  
**Documentation Version:** 1.0  
**Status:** Production Ready ✅
