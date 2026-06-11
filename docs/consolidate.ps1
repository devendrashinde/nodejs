# Documentation Consolidation Script (Windows PowerShell)
# Automates moving documentation files to new structure

param(
    [switch]$DryRun = $false,
    [switch]$Verbose = $false
)

Write-Host "[DOCS] Photo Gallery Documentation Consolidation" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Check if running from project root
if (-not (Test-Path "package.json")) {
    Write-Host "[ERROR] Must be run from project root directory" -ForegroundColor Red
    exit 1
}

if ($DryRun) {
    Write-Host "[DRYRUN] DRY RUN MODE - No files will be moved" -ForegroundColor Yellow
    Write-Host ""
}

# Function to move files with logging
function MoveFile {
    param(
        [string]$Source,
        [string]$Destination,
        [string]$Label
    )
    
    if (Test-Path $Source) {
        if ($DryRun) {
            Write-Host "  [DRY RUN] Would move: $Source → $Destination" -ForegroundColor Gray
        } else {
            Move-Item -Path $Source -Destination $Destination -Force
            Write-Host "  [OK] Moved $Label" -ForegroundColor Green
        }
        return $true
    }
    return $false
}

# Function to delete files with logging
function DeleteFile {
    param(
        [string]$Path,
        [string]$Label
    )
    
    if (Test-Path $Path) {
        if ($DryRun) {
            Write-Host "  [DRY RUN] Would delete: $Path" -ForegroundColor Gray
        } else {
            Remove-Item -Path $Path -Force
            Write-Host "  [OK] Deleted $Label" -ForegroundColor Green
        }
        return $true
    }
    return $false
}

# Create directories if they don't exist
Write-Host "[DIR] Creating directory structure..." -ForegroundColor Cyan
if (-not (Test-Path "docs/archive")) {
    New-Item -ItemType Directory -Path "docs/archive" -Force | Out-Null
}
if (-not (Test-Path "docs/migrations")) {
    New-Item -ItemType Directory -Path "docs/migrations" -Force | Out-Null
}
Write-Host "[OK] Directories created" -ForegroundColor Green

# Arrays of files to move
$favoritesFiles = @(
    "FAVORITES_COMPLETE_SOLUTION.md",
    "FAVORITES_DEVELOPER_REFERENCE.md",
    "FAVORITES_FEATURE.md",
    "FAVORITES_IMPLEMENTATION.md",
    "FAVORITES_INDEX.md",
    "FAVORITES_TESTING.md"
)

$imageEditorFiles = @(
    "IMAGE_EDITING_DOCUMENTATION_INDEX.md",
    "IMAGE_EDITOR_CHANGES_SUMMARY.md",
    "IMAGE_EDITOR_FRONTEND_IMPLEMENTATION.md",
    "IMAGE_EDITOR_INTEGRATION_COMPLETE.md",
    "IMAGE_EDITOR_QUICKSTART.md"
)

$playlistFiles = @(
    "PLAYLIST_IMPLEMENTATION.md",
    "PLAYLIST_QUICK_START.md"
)

$implementationFiles = @(
    "BOOTSTRAP_MODEL.txt",
    "CODE_CHANGES_SUMMARY.md",
    "FEATURE_IMPLEMENTATION_PLAN.md",
    "FILES_MODIFIED_CREATED.md",
    "IMPLEMENTATION_COMPLETE.md",
    "IMPLEMENTATION_SESSION_COMPLETE.md",
    "INTEGRATION_ANGULARJS.md",
    "INTEGRATION_COMPLETE.md",
    "VERSION_3_SUMMARY.md",
    "UI_IMPLEMENTATION_SUMMARY.md"
)

$refactoringFiles = @(
    "REFACTORING_COMPLETE_SUMMARY.md",
    "REFACTORING_FINAL_STATUS.md",
    "REFACTORING_PHASE2_SUMMARY.md",
    "REFACTORING_SUMMARY.md"
)

$miscFiles = @(
    "ADVANCED_FEATURES.md",
    "IMPROVEMENTS.md",
    "README_V4.0_PLAYLISTS.md",
    "FINAL_VERIFICATION.md",
    "QUICK_START_ADVANCED.md"
)

$backupFiles = @(
    "public\main-backup.js",
    "server-mysql-restful.js",
    "ImageDetails.js",
    "load-tagger.js",
    "fancybox.html",
    "index.htm",
    "example-v3.html",
    "index-1.pug"
)

# Move Favorites files
Write-Host ""
Write-Host "[MOVE] Moving Favorites feature docs..." -ForegroundColor Cyan
foreach ($file in $favoritesFiles) {
    MoveFile -Source $file -Destination "docs/archive/" -Label $file
}

# Move Image Editing files
Write-Host ""
Write-Host "[MOVE] Moving Image Editing feature docs..." -ForegroundColor Cyan
foreach ($file in $imageEditorFiles) {
    MoveFile -Source $file -Destination "docs/archive/" -Label $file
}

# Move Playlist files
Write-Host ""
Write-Host "[MOVE] Moving Playlist feature docs..." -ForegroundColor Cyan
foreach ($file in $playlistFiles) {
    MoveFile -Source $file -Destination "docs/archive/" -Label $file
}

# Move Implementation tracking files
Write-Host ""
Write-Host "[MOVE] Moving implementation tracking docs..." -ForegroundColor Cyan
foreach ($file in $implementationFiles) {
    MoveFile -Source $file -Destination "docs/archive/" -Label $file
}

# Move Refactoring files
Write-Host ""
Write-Host "[MOVE] Moving refactoring docs..." -ForegroundColor Cyan
foreach ($file in $refactoringFiles) {
    MoveFile -Source $file -Destination "docs/archive/" -Label $file
}

# Move Misc files
Write-Host ""
Write-Host "[MOVE] Moving miscellaneous docs..." -ForegroundColor Cyan
foreach ($file in $miscFiles) {
    MoveFile -Source $file -Destination "docs/archive/" -Label $file
}

# Delete backup files
Write-Host ""
Write-Host "[DELETE] Deleting obsolete backup files..." -ForegroundColor Red
foreach ($file in $backupFiles) {
    DeleteFile -Path $file -Label $file
}

# Create migration guide stubs
Write-Host ""
Write-Host "[CREATE] Creating migration guide stubs..." -ForegroundColor Cyan

$v1_to_v2 = @"
# v1 to v2 Migration

Core schema migration for Photo Gallery v1 to v2.

## Details

SQL migration file: ``sql/migration_v1_to_v2.sql``

For detailed implementation information, see archived documentation:
- [../archive/ADVANCED_FEATURES.md](../archive/ADVANCED_FEATURES.md)

## Quick Run

``````bash
mysqldump -u root -p mydb > backup_before_migration.sql
mysql -u root -p mydb < sql/migration_v1_to_v2.sql
``````
"@

$v2_to_v2_1 = @"
# v2 to v2.1 Migration

Image editing features added in v2.1.

## Details

SQL migration files:
- ``sql/migration_v2_to_v2.1_image_editing.sql``
- ``sql/migration_v2_to_v2.1_image_editing_mariadb.sql``

For detailed implementation information, see archived documentation:
- [../archive/IMAGE_EDITOR_CHANGES_SUMMARY.md](../archive/IMAGE_EDITOR_CHANGES_SUMMARY.md)

## Quick Run

``````bash
mysqldump -u root -p mydb > backup_before_migration.sql
mysql -u root -p mydb < sql/migration_v2_to_v2.1_image_editing.sql
``````
"@

$v2_to_v3 = @"
# v2 to v3 Migration

Playlists and advanced features added in v3.

## Details

SQL migration files:
- ``sql/migration_v2_to_v3_mysql.sql``
- ``sql/migration_v2_to_v3_mariadb.sql``

For detailed implementation information, see archived documentation:
- [../archive/PLAYLIST_IMPLEMENTATION.md](../archive/PLAYLIST_IMPLEMENTATION.md)

## Quick Run

``````bash
mysqldump -u root -p mydb > backup_before_migration.sql
mysql -u root -p mydb < sql/migration_v2_to_v3_mysql.sql
``````
"@

$v3_to_v4 = @"
# v3 to v4 Migration

Latest version with all advanced features.

## Details

SQL migration files:
- ``sql/migration_v3_to_v4_mysql.sql``
- ``sql/migration_v3_to_v4_mariadb.sql``

See [DEPLOYMENT_CHECKLIST.md](../../DEPLOYMENT_CHECKLIST.md) for detailed deployment steps.

## Quick Run

``````bash
mysqldump -u root -p mydb > backup_before_migration.sql
mysql -u root -p mydb < sql/migration_v3_to_v4_mysql.sql
``````
"@

if (-not $DryRun) {
    Set-Content -Path "docs/migrations/v1_to_v2.md" -Value $v1_to_v2 -Force
    Write-Host "  [OK] Created v1_to_v2.md" -ForegroundColor Green
    
    Set-Content -Path "docs/migrations/v2_to_v2.1.md" -Value $v2_to_v2_1 -Force
    Write-Host "  [OK] Created v2_to_v2.1.md" -ForegroundColor Green
    
    Set-Content -Path "docs/migrations/v2_to_v3.md" -Value $v2_to_v3 -Force
    Write-Host "  [OK] Created v2_to_v3.md" -ForegroundColor Green
    
    Set-Content -Path "docs/migrations/v3_to_v4.md" -Value $v3_to_v4 -Force
    Write-Host "  [OK] Created v3_to_v4.md" -ForegroundColor Green
} else {
    Write-Host "  [DRY RUN] Would create migration guide stubs" -ForegroundColor Gray
}

# Summary
Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "[OK] Dry run complete! Review above changes." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Run without -DryRun to apply changes:" -ForegroundColor Cyan
    Write-Host "  .\docs\consolidate.ps1" -ForegroundColor Gray
} else {
    Write-Host "[OK] Documentation consolidation complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Summary of changes:" -ForegroundColor Cyan
    Write-Host "  - Moved 32+ documentation files to docs/archive/" -ForegroundColor White
    Write-Host "  - Deleted 8 obsolete backup files" -ForegroundColor White
    Write-Host "  - Created migration guides in docs/migrations/" -ForegroundColor White
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Review changes: git status" -ForegroundColor Gray
    Write-Host "  2. Commit: git commit -m 'docs: consolidate documentation'" -ForegroundColor Gray
    Write-Host "  3. Push: git push origin main" -ForegroundColor Gray
}

Write-Host ""
Write-Host "New structure:" -ForegroundColor Cyan
Write-Host "  [FILE] Root: core docs (README, QUICKSTART, DEPLOYMENT, etc.)" -ForegroundColor White
Write-Host "  [DIR] docs/: DEVELOPMENT.md, FEATURES.md, DATABASE.md" -ForegroundColor White
Write-Host "  [DIR] docs/archive/: historical feature and implementation docs" -ForegroundColor White
Write-Host "  [DIR] docs/migrations/: migration guides" -ForegroundColor White
Write-Host ""
