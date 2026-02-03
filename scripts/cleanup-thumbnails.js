/**
 * Thumbnail Cleanup Utility
 * 
 * This script identifies and removes orphaned thumbnails whose original media files
 * no longer exist. Run periodically to manage disk space.
 * 
 * Usage:
 *   node scripts/cleanup-thumbnails.js [--dry-run] [--verbose]
 * 
 * Options:
 *   --dry-run   Show what would be deleted without actually deleting
 *   --verbose   Show detailed progress information
 */

import { readdirSync, statSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const THUMBNAIL_DIR = process.env.THUMBNAIL_DIR || './temp-pic/thumbnails';
const MEDIA_ROOTS = [
    './data/pictures',
    './pictures',
    './data'
];

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose');

// Generate hash for a file path (same as media.js)
function generateHash(filepath) {
    return crypto.createHash('md5').update(filepath).digest('hex');
}

// Recursively find all media files
function findMediaFiles(dir, fileList = []) {
    if (!existsSync(dir)) return fileList;

    const files = readdirSync(dir);
    
    files.forEach(file => {
        const filePath = join(dir, file);
        
        try {
            const stat = statSync(filePath);
            
            if (stat.isDirectory()) {
                // Skip thumbnail directories
                if (!filePath.includes('thumbs') && !filePath.includes('thumbnails')) {
                    findMediaFiles(filePath, fileList);
                }
            } else if (stat.isFile()) {
                // Include image and video files
                const ext = file.toLowerCase().split('.').pop();
                const mediaExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg',
                                 'mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm', '3gp', 'mpg', 'mpeg'];
                if (mediaExts.includes(ext)) {
                    fileList.push(filePath);
                }
            }
        } catch (err) {
            if (isVerbose) {
                console.error(`Error accessing ${filePath}:`, err.message);
            }
        }
    });
    
    return fileList;
}

// Main cleanup function
async function cleanupThumbnails() {
    console.log('🔍 Scanning for orphaned thumbnails...\n');
    
    // Find all media files
    const mediaFiles = [];
    MEDIA_ROOTS.forEach(root => {
        if (existsSync(root)) {
            if (isVerbose) console.log(`Scanning ${root}...`);
            const files = findMediaFiles(root);
            mediaFiles.push(...files);
        }
    });
    
    console.log(`✓ Found ${mediaFiles.length} media files\n`);
    
    // Create set of expected thumbnail hashes
    const expectedHashes = new Set();
    mediaFiles.forEach(file => {
        const hash = generateHash(file);
        expectedHashes.add(hash);
    });
    
    // Check thumbnails
    if (!existsSync(THUMBNAIL_DIR)) {
        console.log(`⚠ Thumbnail directory doesn't exist: ${THUMBNAIL_DIR}`);
        return;
    }
    
    const thumbnails = readdirSync(THUMBNAIL_DIR);
    let orphanedCount = 0;
    let totalSize = 0;
    const orphanedFiles = [];
    
    thumbnails.forEach(thumb => {
        const thumbPath = join(THUMBNAIL_DIR, thumb);
        
        try {
            const stat = statSync(thumbPath);
            if (!stat.isFile()) return;
            
            // Extract hash from filename (before first dot)
            const hash = thumb.split('.')[0];
            
            if (!expectedHashes.has(hash)) {
                orphanedCount++;
                totalSize += stat.size;
                orphanedFiles.push({ file: thumb, size: stat.size, path: thumbPath });
                
                if (isVerbose) {
                    console.log(`  Orphaned: ${thumb} (${formatBytes(stat.size)})`);
                }
            }
        } catch (err) {
            if (isVerbose) {
                console.error(`Error checking ${thumb}:`, err.message);
            }
        }
    });
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total thumbnails: ${thumbnails.length}`);
    console.log(`   Orphaned thumbnails: ${orphanedCount}`);
    console.log(`   Disk space to reclaim: ${formatBytes(totalSize)}\n`);
    
    if (orphanedCount > 0) {
        if (isDryRun) {
            console.log('🔸 DRY RUN - No files deleted. Remove --dry-run to actually delete.');
            console.log('\nFiles that would be deleted:');
            orphanedFiles.forEach(({ file, size }) => {
                console.log(`  - ${file} (${formatBytes(size)})`);
            });
        } else {
            console.log('🗑️  Deleting orphaned thumbnails...');
            
            let deleted = 0;
            orphanedFiles.forEach(({ file, path }) => {
                try {
                    unlinkSync(path);
                    deleted++;
                    if (isVerbose) {
                        console.log(`  ✓ Deleted: ${file}`);
                    }
                } catch (err) {
                    console.error(`  ✗ Failed to delete ${file}:`, err.message);
                }
            });
            
            console.log(`\n✅ Cleanup complete! Deleted ${deleted} files (${formatBytes(totalSize)})`);
        }
    } else {
        console.log('✨ No orphaned thumbnails found. All clean!');
    }
}

// Format bytes to human-readable string
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run cleanup
cleanupThumbnails().catch(err => {
    console.error('❌ Error during cleanup:', err);
    process.exit(1);
});
