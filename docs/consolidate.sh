#!/bin/bash
# Documentation Consolidation Script
# Automates moving documentation files to new structure

set -e  # Exit on error

echo "📚 Photo Gallery Documentation Consolidation"
echo "=============================================="
echo ""

# Check if running from project root
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must be run from project root directory"
    exit 1
fi

# Create directories if they don't exist
echo "📁 Creating directory structure..."
mkdir -p docs/archive
mkdir -p docs/migrations
echo "✓ Directories created"

# Move Favorites documentation (6 files)
echo ""
echo "📂 Moving Favorites feature docs..."
for file in FAVORITES_*.md; do
    if [ -f "$file" ]; then
        mv "$file" docs/archive/
        echo "  ✓ Moved $file"
    fi
done

# Move Image Editing documentation (5 files)
echo ""
echo "📂 Moving Image Editing feature docs..."
for file in IMAGE_*.md; do
    if [ -f "$file" ]; then
        mv "$file" docs/archive/
        echo "  ✓ Moved $file"
    fi
done

# Move Playlist documentation (2 files)
echo ""
echo "📂 Moving Playlist feature docs..."
for file in PLAYLIST_*.md; do
    if [ -f "$file" ]; then
        mv "$file" docs/archive/
        echo "  ✓ Moved $file"
    fi
done

# Move Implementation tracking files (10 files)
echo ""
echo "📂 Moving implementation tracking docs..."
tracking_files=(
    "BOOTSTRAP_MODEL.txt"
    "CODE_CHANGES_SUMMARY.md"
    "FEATURE_IMPLEMENTATION_PLAN.md"
    "FILES_MODIFIED_CREATED.md"
    "IMPLEMENTATION_COMPLETE.md"
    "IMPLEMENTATION_SESSION_COMPLETE.md"
    "INTEGRATION_ANGULARJS.md"
    "INTEGRATION_COMPLETE.md"
    "VERSION_3_SUMMARY.md"
    "UI_IMPLEMENTATION_SUMMARY.md"
)
for file in "${tracking_files[@]}"; do
    if [ -f "$file" ]; then
        mv "$file" docs/archive/
        echo "  ✓ Moved $file"
    fi
done

# Move Refactoring tracking files (4 files)
echo ""
echo "📂 Moving refactoring docs..."
for file in REFACTORING_*.md; do
    if [ -f "$file" ]; then
        mv "$file" docs/archive/
        echo "  ✓ Moved $file"
    fi
done

# Move Advanced Features
echo ""
echo "📂 Moving advanced features doc..."
if [ -f "ADVANCED_FEATURES.md" ]; then
    mv "ADVANCED_FEATURES.md" docs/archive/
    echo "  ✓ Moved ADVANCED_FEATURES.md"
fi

# Move misc docs
echo ""
echo "📂 Moving miscellaneous docs..."
misc_files=(
    "IMPROVEMENTS.md"
    "README_V4.0_PLAYLISTS.md"
    "FINAL_VERIFICATION.md"
    "QUICK_START_ADVANCED.md"
)
for file in "${misc_files[@]}"; do
    if [ -f "$file" ]; then
        mv "$file" docs/archive/
        echo "  ✓ Moved $file"
    fi
done

# Delete backup/old files
echo ""
echo "🗑️  Deleting obsolete backup files..."
backup_files=(
    "public/main-backup.js"
    "server-mysql-restful.js"
    "ImageDetails.js"
    "load-tagger.js"
    "fancybox.html"
    "index.htm"
    "example-v3.html"
    "index-1.pug"
)
for file in "${backup_files[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        echo "  ✓ Deleted $file"
    fi
done

# Create migration guide stubs
echo ""
echo "📄 Creating migration guide stubs..."

cat > docs/migrations/v1_to_v2.md << 'EOF'
# v1 to v2 Migration

Core schema migration for Photo Gallery v1 to v2.

## Details

SQL migration file: `sql/migration_v1_to_v2.sql`

For detailed implementation information, see archived documentation:
- [../archive/ADVANCED_FEATURES.md](../archive/ADVANCED_FEATURES.md)

## Quick Run

```bash
mysqldump -u root -p mydb > backup_before_migration.sql
mysql -u root -p mydb < sql/migration_v1_to_v2.sql
```
EOF
echo "  ✓ Created v1_to_v2.md"

cat > docs/migrations/v2_to_v2.1.md << 'EOF'
# v2 to v2.1 Migration

Image editing features added in v2.1.

## Details

SQL migration files:
- `sql/migration_v2_to_v2.1_image_editing.sql`
- `sql/migration_v2_to_v2.1_image_editing_mariadb.sql`

For detailed implementation information, see archived documentation:
- [../archive/IMAGE_EDITOR_CHANGES_SUMMARY.md](../archive/IMAGE_EDITOR_CHANGES_SUMMARY.md)

## Quick Run

```bash
mysqldump -u root -p mydb > backup_before_migration.sql
mysql -u root -p mydb < sql/migration_v2_to_v2.1_image_editing.sql
```
EOF
echo "  ✓ Created v2_to_v2.1.md"

cat > docs/migrations/v2_to_v3.md << 'EOF'
# v2 to v3 Migration

Playlists and advanced features added in v3.

## Details

SQL migration files:
- `sql/migration_v2_to_v3_mysql.sql`
- `sql/migration_v2_to_v3_mariadb.sql`

For detailed implementation information, see archived documentation:
- [../archive/PLAYLIST_IMPLEMENTATION.md](../archive/PLAYLIST_IMPLEMENTATION.md)

## Quick Run

```bash
mysqldump -u root -p mydb > backup_before_migration.sql
mysql -u root -p mydb < sql/migration_v2_to_v3_mysql.sql
```
EOF
echo "  ✓ Created v2_to_v3.md"

cat > docs/migrations/v3_to_v4.md << 'EOF'
# v3 to v4 Migration

Latest version with all advanced features.

## Details

SQL migration files:
- `sql/migration_v3_to_v4_mysql.sql`
- `sql/migration_v3_to_v4_mariadb.sql`

See [DEPLOYMENT_CHECKLIST.md](../../DEPLOYMENT_CHECKLIST.md) for detailed deployment steps.

## Quick Run

```bash
mysqldump -u root -p mydb > backup_before_migration.sql
mysql -u root -p mydb < sql/migration_v3_to_v4_mysql.sql
```
EOF
echo "  ✓ Created v3_to_v4.md"

# Summary
echo ""
echo "=============================================="
echo "✅ Documentation consolidation complete!"
echo ""
echo "Summary of changes:"
echo "  - Moved 32+ documentation files to docs/archive/"
echo "  - Deleted 8 obsolete backup files"
echo "  - Created migration guides in docs/migrations/"
echo ""
echo "Next steps:"
echo "  1. Review changes: git status"
echo "  2. Commit: git commit -m 'docs: consolidate documentation'"
echo "  3. Push: git push origin main"
echo ""
echo "New structure:"
echo "  📄 Root: core docs (README, QUICKSTART, DEPLOYMENT, etc.)"
echo "  📁 docs/: DEVELOPMENT.md, FEATURES.md, DATABASE.md"
echo "  📁 docs/archive/: historical feature and implementation docs"
echo "  📁 docs/migrations/: migration guides"
echo ""
