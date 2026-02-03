/**
 * Video Enhancement Service
 * 
 * Enhanced video handling:
 * - Video metadata extraction
 * - Multiple quality options
 * - Video stream/player support
 * - Video thumbnail generation with better options
 */

import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';

class VideoEnhancementService {
    /**
     * Extract comprehensive video metadata
     * @param {string} videoPath - Path to video file
     * @returns {Promise<Object>} Video metadata
     */
    static async extractMetadata(videoPath) {
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .ffprobe((err, data) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    const videoStream = data.streams.find(s => s.codec_type === 'video');
                    const audioStream = data.streams.find(s => s.codec_type === 'audio');

                    const metadata = {
                        file: {
                            duration: data.format.duration,
                            size: data.format.size,
                            bitrate: data.format.bit_rate,
                            format: data.format.format_name
                        },
                        video: videoStream ? {
                            codec: videoStream.codec_name,
                            codecLong: videoStream.codec_long_name,
                            width: videoStream.width,
                            height: videoStream.height,
                            aspectRatio: `${videoStream.display_aspect_ratio || 'unknown'}`,
                            fps: this._parseFps(videoStream.r_frame_rate),
                            bitrate: videoStream.bit_rate,
                            duration: videoStream.duration
                        } : null,
                        audio: audioStream ? {
                            codec: audioStream.codec_name,
                            channels: audioStream.channels,
                            sampleRate: audioStream.sample_rate,
                            bitrate: audioStream.bit_rate,
                            language: audioStream.tags?.language || 'unknown'
                        } : null,
                        chapters: data.chapters || [],
                        tags: data.format.tags || {}
                    };

                    resolve(metadata);
                });
        });
    }

    /**
     * Generate video thumbnail at specific timestamp
     * @param {string} videoPath - Path to video
     * @param {Object} options - Generation options
     * @param {number} options.timestamp - Timestamp in seconds (or 'middle' for middle of video)
     * @param {number} options.width - Thumbnail width
     * @param {number} options.height - Thumbnail height
     * @param {string} options.outputPath - Where to save thumbnail
     * @returns {Promise<string>} Path to generated thumbnail
     */
    static async generateThumbnail(videoPath, options = {}) {
        const {
            timestamp = '00:00:01',
            width = 320,
            height = 240,
            outputPath = null
        } = options;

        return new Promise((resolve, reject) => {
            const outPath = outputPath || `${videoPath}_thumb_${Date.now()}.jpg`;

            ffmpeg(videoPath)
                .on('end', () => resolve(outPath))
                .on('error', reject)
                .screenshots({
                    timestamps: [timestamp === 'middle' ? '50%' : timestamp],
                    filename: path.basename(outPath),
                    folder: path.dirname(outPath),
                    size: `${width}x${height}`
                });
        });
    }

    /**
     * Generate multiple quality versions of a video
     * @param {string} videoPath - Source video path
     * @param {Object} options - Encoding options
     * @returns {Promise<Array>} Array of encoded file paths
     */
    static async encodeVideoQualities(videoPath, options = {}) {
        const {
            outputDir = './temp-pic/videos',
            qualities = ['360p', '720p', '1080p']
        } = options;

        const qualitySettings = {
            '360p': { bitrate: '500k', scale: '640:360' },
            '480p': { bitrate: '1000k', scale: '854:480' },
            '720p': { bitrate: '2500k', scale: '1280:720' },
            '1080p': { bitrate: '5000k', scale: '1920:1080' }
        };

        const results = [];

        for (const quality of qualities) {
            if (!qualitySettings[quality]) {
                console.warn(`Unknown quality: ${quality}`);
                continue;
            }

            const settings = qualitySettings[quality];
            const outputFile = path.join(
                outputDir,
                `${path.basename(videoPath, path.extname(videoPath))}_${quality}.mp4`
            );

            try {
                await this._encodeVideo(videoPath, outputFile, settings);
                results.push({
                    quality,
                    path: outputFile,
                    settings
                });
            } catch (err) {
                console.error(`Failed to encode ${quality}:`, err);
            }
        }

        return results;
    }

    /**
     * Encode single video version
     * @private
     */
    static async _encodeVideo(inputPath, outputPath, settings) {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .output(outputPath)
                .videoCodec('libx264')
                .audioCodec('aac')
                .outputOption('-preset medium')
                .outputOption(`-vf scale=${settings.scale}`)
                .outputOption(`-b:v ${settings.bitrate}`)
                .outputOption('-movflags +faststart')
                .on('end', () => resolve(outputPath))
                .on('error', reject)
                .run();
        });
    }

    /**
     * Get video streaming options for player
     * @param {string} videoPath - Path to video
     * @param {Array} availableQualities - Available quality versions
     * @returns {Object} Streaming configuration
     */
    static getStreamingConfig(videoPath, availableQualities = []) {
        return {
            primary: {
                src: videoPath,
                type: this._getVideoMimeType(videoPath)
            },
            qualities: availableQualities.map(q => ({
                src: q.path,
                type: 'video/mp4',
                label: q.quality,
                bitrate: this._getQualityBitrate(q.quality)
            })),
            poster: `${videoPath}_thumb.jpg`,
            controls: true,
            preload: 'metadata'
        };
    }

    /**
     * Get video MIME type
     * @private
     */
    static _getVideoMimeType(videoPath) {
        const ext = path.extname(videoPath).toLowerCase();
        const mimeMap = {
            '.mp4': 'video/mp4',
            '.webm': 'video/webm',
            '.ogg': 'video/ogg',
            '.mov': 'video/quicktime',
            '.mkv': 'video/x-matroska',
            '.avi': 'video/x-msvideo',
            '.flv': 'video/x-flv',
            '.wmv': 'video/x-ms-wmv',
            '.3gp': 'video/3gpp'
        };
        return mimeMap[ext] || 'video/mp4';
    }

    /**
     * Parse FPS from fraction
     * @private
     */
    static _parseFps(fpsStr) {
        if (!fpsStr) return 0;
        const parts = fpsStr.split('/');
        if (parts.length === 2) {
            return (parseInt(parts[0]) / parseInt(parts[1])).toFixed(2);
        }
        return parseInt(fpsStr);
    }

    /**
     * Get quality bitrate
     * @private
     */
    static _getQualityBitrate(quality) {
        const bitrateMap = {
            '360p': '500k',
            '480p': '1000k',
            '720p': '2500k',
            '1080p': '5000k'
        };
        return bitrateMap[quality] || '2500k';
    }

    /**
     * Validate video file
     * @param {string} videoPath - Path to video
     * @param {Object} options - Validation options
     * @returns {Promise<Object>} Validation result
     */
    static async validateVideo(videoPath, options = {}) {
        const {
            maxDuration = 3600, // 1 hour in seconds
            maxSize = 5000000000, // 5GB
            allowedFormats = ['mp4', 'webm', 'ogg', 'mov', 'mkv', 'avi']
        } = options;

        try {
            const stat = await fs.stat(videoPath);
            const metadata = await this.extractMetadata(videoPath);

            const errors = [];

            // Check format
            const ext = path.extname(videoPath).slice(1).toLowerCase();
            if (!allowedFormats.includes(ext)) {
                errors.push(`Format ${ext} not allowed`);
            }

            // Check size
            if (stat.size > maxSize) {
                errors.push(`File size ${(stat.size / 1024 / 1024 / 1024).toFixed(2)}GB exceeds limit`);
            }

            // Check duration
            if (metadata.file.duration > maxDuration) {
                errors.push(`Duration ${metadata.file.duration}s exceeds limit`);
            }

            return {
                valid: errors.length === 0,
                errors,
                metadata,
                fileSize: stat.size
            };
        } catch (err) {
            return {
                valid: false,
                errors: [err.message]
            };
        }
    }

    /**
     * Get available video qualities
     * @returns {Array} List of available qualities
     */
    static getAvailableQualities() {
        return [
            { name: '360p', label: '360p (Low)', bitrate: '500k', scale: '640:360' },
            { name: '480p', label: '480p (Standard)', bitrate: '1000k', scale: '854:480' },
            { name: '720p', label: '720p (HD)', bitrate: '2500k', scale: '1280:720' },
            { name: '1080p', label: '1080p (Full HD)', bitrate: '5000k', scale: '1920:1080' }
        ];
    }

    /**
     * Format duration for display
     * @param {number} seconds - Duration in seconds
     * @returns {string} Formatted duration
     */
    static formatDuration(seconds) {
        if (!seconds) return '0:00';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }

        return `${minutes}:${String(secs).padStart(2, '0')}`;
    }

    /**
     * Get video codec recommendations
     * @returns {Object} Recommended codecs for different scenarios
     */
    static getCodecRecommendations() {
        return {
            web: {
                video: 'libx264',
                audio: 'aac',
                container: 'mp4',
                reason: 'Best web compatibility'
            },
            highQuality: {
                video: 'libx265',
                audio: 'aac',
                container: 'mp4',
                reason: 'Better compression, smaller file size'
            },
            streaming: {
                video: 'libx264',
                audio: 'aac',
                container: 'mp4',
                reason: 'Optimized for streaming with faststart flag'
            }
        };
    }
}

export default VideoEnhancementService;
