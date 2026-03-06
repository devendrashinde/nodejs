/**
 * Video Conversion Service
 * 
 * Handles automatic conversion of unsupported video formats to MP4
 * - Converting non-MP4 videos to MP4 format
 * - Caching converted files alongside originals
 * - Preserving original files
 * - Progress tracking
 */

import ffmpeg from 'fluent-ffmpeg';
import { promises as fs, existsSync } from 'fs';
import path from 'path';

const SUPPORTED_BROWSER_CODECS = ['.mp4', '.webm', '.ogg'];
const CONVERSION_QUALITY = 'medium'; // fast, medium, slow

class VideoConversionService {
    /**
     * Check if video format is natively supported by browsers
     * @param {string} filePath - Path to video file
     * @returns {boolean} True if format is browser-supported
     */
    static isBrowserSupportedFormat(filePath) {
        if (!filePath) return false;
        const ext = path.extname(filePath).toLowerCase();
        return SUPPORTED_BROWSER_CODECS.includes(ext);
    }

    /**
     * Get MP4 conversion path for a video
     * @param {string} filePath - Original file path
     * @returns {string} Path where MP4 will be saved
     */
    static getMp4ConversionPath(filePath) {
        if (!filePath) return '';
        const dir = path.dirname(filePath);
        const basename = path.basename(filePath, path.extname(filePath));
        const mp4Path = path.join(dir, `${basename}.mp4`);
        console.log(`[VideoConversion] MP4 path: ${mp4Path}`);
        return mp4Path;
    }

    /**
     * Check if an MP4 version exists for a video
     * @param {string} filePath - Original file path
     * @returns {boolean} True if MP4 version exists
     */
    static async mp4VersionExists(filePath) {
        if (!filePath) return false;
        const mp4Path = this.getMp4ConversionPath(filePath);
        try {
            await fs.access(mp4Path);
            console.log(`[VideoConversion] MP4 exists: ${mp4Path}`);
            return true;
        } catch {
            console.log(`[VideoConversion] MP4 does not exist: ${mp4Path}`);
            return false;
        }
    }

    /**
     * Convert video to MP4 format
     * @param {string} inputPath - Input video file path
     * @param {Object} options - Conversion options
     * @returns {Promise<Object>} Conversion result with output path
     */
    static async convertToMp4(inputPath, options = {}) {
        if (!inputPath) {
            return {
                success: false,
                error: 'No input path provided'
            };
        }

        // If already MP4, return original path
        if (path.extname(inputPath).toLowerCase() === '.mp4') {
            console.log(`[VideoConversion] File already MP4: ${inputPath}`);
            return {
                success: true,
                originalPath: inputPath,
                mp4Path: inputPath,
                converted: false,
                message: 'File is already MP4'
            };
        }

        const {
            outputPath = this.getMp4ConversionPath(inputPath),
            videoCodec = 'libx264',
            audioCodec = 'aac',
            videoBitrate = '2500k',
            audioSampleRate = 48000,
            onProgress = null
        } = options;

        // Check if MP4 version already exists
        try {
            await fs.access(outputPath);
            return {
                success: true,
                originalPath: inputPath,
                mp4Path: outputPath,
                converted: false,
                message: 'MP4 version already exists'
            };
        } catch {
            // MP4 doesn't exist, proceed with conversion
        }

        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        try {
            await fs.mkdir(outputDir, { recursive: true });
        } catch (err) {
            console.error('Failed to create output directory:', err);
            throw err;
        }

        return new Promise((resolve, reject) => {
            console.log(`Starting conversion: ${inputPath} → ${outputPath}`);

            ffmpeg(inputPath)
                .videoCodec(videoCodec)
                .audioCodec(audioCodec)
                .videoBitrate(videoBitrate)
                .audioSampleRate(audioSampleRate)
                .outputOption('-preset ' + CONVERSION_QUALITY)
                .outputOption('-movflags +faststart') // Enable progressive download
                .outputOption('-max_muxing_queue_size 9999') // Prevent buffer errors
                .output(outputPath)
                .on('progress', (progress) => {
                    if (onProgress) {
                        onProgress({
                            frames: progress.frames,
                            fps: progress.currentFps,
                            quality: progress.quality,
                            percent: Math.min(progress.percent || 0, 100)
                        });
                    }
                })
                .on('end', () => {
                    console.log(`Conversion completed: ${outputPath}`);
                    resolve({
                        success: true,
                        originalPath: inputPath,
                        mp4Path: outputPath,
                        converted: true,
                        message: 'Video successfully converted to MP4'
                    });
                })
                .on('error', (err) => {
                    console.error(`Conversion failed: ${err.message}`);
                    reject({
                        success: false,
                        originalPath: inputPath,
                        error: err.message
                    });
                })
                .run();
        });
    }

    /**
     * Get playable video path for a file
     * Converts if needed and returns path to MP4
     * @param {string} filePath - File path
     * @returns {Promise<string>} Path to MP4 file (either original or converted)
     */
    static async getPlayablePath(filePath) {
        if (!filePath) {
            throw new Error('No file path provided');
        }

        console.log(`[VideoConversion] getPlayablePath: ${filePath}`);

        // If already browser-supported, return as-is
        if (this.isBrowserSupportedFormat(filePath)) {
            console.log(`[VideoConversion] Format is browser-supported, returning as-is`);
            return filePath;
        }

        console.log(`[VideoConversion] Format needs conversion, checking if MP4 already exists`);

        // Check if MP4 version already exists
        if (await this.mp4VersionExists(filePath)) {
            const mp4Path = this.getMp4ConversionPath(filePath);
            console.log(`[VideoConversion] MP4 already exists, returning: ${mp4Path}`);
            return mp4Path;
        }

        // Convert to MP4
        console.log(`[VideoConversion] Starting conversion for: ${filePath}`);
        const result = await this.convertToMp4(filePath);
        
        if (result.success) {
            console.log(`[VideoConversion] Conversion success, returning: ${result.mp4Path}`);
            return result.mp4Path;
        } else {
            console.error(`[VideoConversion] Conversion failed: ${result.error}`);
            throw new Error(`Failed to convert video: ${result.error}`);
        }
    }

    /**
     * Batch convert multiple videos to MP4
     * @param {Array<string>} filePaths - Array of file paths
     * @param {Function} onProgress - Progress callback
     * @returns {Promise<Array>} Array of conversion results
     */
    static async batchConvert(filePaths, onProgress = null) {
        const results = [];
        const total = filePaths.length;
        let completed = 0;

        for (const filePath of filePaths) {
            try {
                // Skip if already browser-supported
                if (this.isBrowserSupportedFormat(filePath)) {
                    results.push({
                        filePath,
                        success: true,
                        message: 'Already browser-supported format'
                    });
                    completed++;
                    if (onProgress) {
                        onProgress({
                            current: completed,
                            total,
                            filePath,
                            status: 'skipped'
                        });
                    }
                    continue;
                }

                // Check if MP4 already exists
                if (await this.mp4VersionExists(filePath)) {
                    results.push({
                        filePath,
                        success: true,
                        message: 'MP4 version already exists'
                    });
                    completed++;
                    if (onProgress) {
                        onProgress({
                            current: completed,
                            total,
                            filePath,
                            status: 'exists'
                        });
                    }
                    continue;
                }

                // Convert
                const result = await this.convertToMp4(filePath);
                results.push({
                    filePath,
                    ...result
                });
                completed++;
                if (onProgress) {
                    onProgress({
                        current: completed,
                        total,
                        filePath,
                        status: 'completed'
                    });
                }
            } catch (err) {
                results.push({
                    filePath,
                    success: false,
                    error: err.message
                });
                completed++;
                if (onProgress) {
                    onProgress({
                        current: completed,
                        total,
                        filePath,
                        status: 'error'
                    });
                }
            }
        }

        return results;
    }

    /**
     * Clean up .mp4 files if originals are still present
     * Useful for verifying conversions
     * @param {string} dirPath - Directory to clean
     * @returns {Promise<Object>} Cleanup statistics
     */
    static async cleanupConversions(dirPath) {
        const stats = {
            scanned: 0,
            removed: 0,
            errors: 0
        };

        try {
            const files = await fs.readdir(dirPath);
            const mp4Files = files.filter(f => f.endsWith('.mp4'));

            for (const mp4File of mp4Files) {
                stats.scanned++;
                const mp4Path = path.join(dirPath, mp4File);
                const basename = path.basename(mp4File, '.mp4');

                // Check if any original file exists
                const originalFormats = ['avi', 'mkv', 'mov', 'flv', 'wmv', 'mpeg', 'mpg', 'webm', 'ogg', 'ogv', '3gp'];
                let originalExists = false;

                for (const format of originalFormats) {
                    const originalPath = path.join(dirPath, `${basename}.${format}`);
                    try {
                        await fs.access(originalPath);
                        originalExists = true;
                        break;
                    } catch {
                        // Original doesn't exist
                    }
                }

                // If no original found, keep the MP4 (it might be native)
                if (!originalExists) {
                    // This MP4 is likely native, don't delete
                    continue;
                }
            }
        } catch (err) {
            stats.errors++;
            console.error(`Cleanup failed for ${dirPath}:`, err);
        }

        return stats;
    }

    /**
     * Get conversion status for a file
     * @param {string} filePath - File path
     * @returns {Promise<Object>} Status object
     */
    static async getConversionStatus(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const supported = this.isBrowserSupportedFormat(filePath);
        const mp4Path = this.getMp4ConversionPath(filePath);
        const mp4Exists = await this.mp4VersionExists(filePath);

        return {
            filePath,
            fileExtension: ext,
            isBrowserSupported: supported,
            needsConversion: !supported,
            mp4Path,
            mp4Exists,
            conversionStatus: supported ? 'not_needed' : (mp4Exists ? 'completed' : 'pending')
        };
    }
}

export default VideoConversionService;
