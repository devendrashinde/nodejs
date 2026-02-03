/**
 * EXIF Data Service
 * 
 * Extracts and manages EXIF metadata from images including:
 * - Camera info (model, make, lens)
 * - Location data (GPS coordinates)
 * - Date/time information
 * - Image dimensions and orientation
 */

import ExifParser from 'exif-parser';
import { readFileSync } from 'fs';

class ExifService {
    /**
     * Extract all available EXIF data from an image file
     * @param {string} imagePath - Full path to the image file
     * @returns {Object} EXIF data object or empty object if no data
     */
    static extractExifData(imagePath) {
        try {
            const buffer = readFileSync(imagePath);
            const parser = new ExifParser(buffer);
            const result = parser.parse();
            
            if (!result || !result.tags) {
                return {};
            }

            const tags = result.tags;
            return {
                // Camera Information
                camera: {
                    make: tags.Make || null,
                    model: tags.Model || null,
                    lens: tags.LensModel || null,
                    serialNumber: tags.InternalSerialNumber || null
                },
                
                // Shooting Parameters
                shooting: {
                    dateTime: tags.DateTime ? this._parseDateTime(tags.DateTime) : null,
                    dateTimeOriginal: tags.DateTimeOriginal ? this._parseDateTime(tags.DateTimeOriginal) : null,
                    exposureTime: tags.ExposureTime ? `1/${Math.round(1 / tags.ExposureTime)}` : null,
                    fNumber: tags.FNumber ? `f/${tags.FNumber.toFixed(1)}` : null,
                    iso: tags.ISOSpeedRatings || null,
                    focalLength: tags.FocalLength ? `${tags.FocalLength.toFixed(1)}mm` : null,
                    focalLengthIn35mm: tags.FocalLengthIn35mmFilm ? `${tags.FocalLengthIn35mmFilm}mm` : null,
                    flash: tags.Flash ? this._parseFlash(tags.Flash) : null,
                    meteringMode: tags.MeteringMode ? this._parseMeteringMode(tags.MeteringMode) : null,
                    exposureProgram: tags.ExposureProgram ? this._parseExposureProgram(tags.ExposureProgram) : null
                },
                
                // Image Properties
                image: {
                    width: tags.PixelXDimension || null,
                    height: tags.PixelYDimension || null,
                    orientation: tags.Orientation ? this._parseOrientation(tags.Orientation) : 'Normal',
                    colorSpace: tags.ColorSpace || null,
                    whiteBalance: tags.WhiteBalance ? this._parseWhiteBalance(tags.WhiteBalance) : null
                },
                
                // Location Data
                location: this._extractGPS(tags),
                
                // Software & Processing
                software: {
                    software: tags.Software || null,
                    processingMode: tags.ProcessingMode || null
                },

                // Copyright & Artist
                copyright: {
                    artist: tags.Artist || null,
                    copyright: tags.Copyright || null,
                    photographer: tags.Photographer || null
                }
            };
        } catch (error) {
            console.error(`Error extracting EXIF data from ${imagePath}:`, error.message);
            return {};
        }
    }

    /**
     * Extract GPS location data from EXIF tags
     * @private
     */
    static _extractGPS(tags) {
        if (!tags.GPSLatitude || !tags.GPSLongitude) {
            return null;
        }

        const latitude = tags.GPSLatitude;
        const longitude = tags.GPSLongitude;
        const latRef = tags.GPSLatitudeRef || 'N';
        const longRef = tags.GPSLongitudeRef || 'E';

        return {
            latitude: latitude * (latRef === 'N' ? 1 : -1),
            longitude: longitude * (longRef === 'E' ? 1 : -1),
            latRef,
            longRef,
            altitude: tags.GPSAltitude || null,
            mapUrl: `https://maps.google.com/maps?q=${latitude},${longitude}`
        };
    }

    /**
     * Parse DateTime EXIF tag format (YYYY:MM:DD HH:MM:SS)
     * @private
     */
    static _parseDateTime(dateTimeStr) {
        if (!dateTimeStr) return null;
        const parts = dateTimeStr.split(' ');
        const dateParts = parts[0].split(':');
        const timeParts = parts[1] ? parts[1].split(':') : ['00', '00', '00'];
        
        return {
            raw: dateTimeStr,
            iso: new Date(`${dateParts[0]}-${dateParts[1]}-${dateParts[2]}T${timeParts[0]}:${timeParts[1]}:${timeParts[2]}`).toISOString(),
            display: dateTimeStr
        };
    }

    /**
     * Parse flash setting
     * @private
     */
    static _parseFlash(flashValue) {
        const flashMap = {
            0: 'No Flash',
            1: 'Fired',
            5: 'Fired, Return light not detected',
            7: 'Fired, Return light detected',
            8: 'On, Did not fire',
            9: 'On, Fired',
            10: 'On, Return light not detected',
            11: 'On, Return light detected',
            16: 'Off',
            24: 'Auto, Did not fire',
            25: 'Auto, Fired',
            29: 'Auto, Fired, Return light detected'
        };
        return flashMap[flashValue] || `Unknown (${flashValue})`;
    }

    /**
     * Parse metering mode
     * @private
     */
    static _parseMeteringMode(mode) {
        const modeMap = {
            0: 'Unknown',
            1: 'Average',
            2: 'CenterWeightedAverage',
            3: 'Spot',
            4: 'MultiSpot',
            5: 'Pattern',
            6: 'Partial',
            255: 'Other'
        };
        return modeMap[mode] || 'Unknown';
    }

    /**
     * Parse exposure program
     * @private
     */
    static _parseExposureProgram(program) {
        const programMap = {
            0: 'Not defined',
            1: 'Manual',
            2: 'Normal program',
            3: 'Aperture priority',
            4: 'Shutter priority',
            5: 'Creative program',
            6: 'Action program',
            7: 'Portrait mode',
            8: 'Landscape mode'
        };
        return programMap[program] || 'Unknown';
    }

    /**
     * Parse white balance
     * @private
     */
    static _parseWhiteBalance(wb) {
        return wb === 0 ? 'Auto' : 'Manual';
    }

    /**
     * Parse image orientation
     * @private
     */
    static _parseOrientation(orientation) {
        const orientationMap = {
            1: 'Normal',
            2: 'Flipped horizontally',
            3: 'Rotated 180°',
            4: 'Flipped vertically',
            5: 'Rotated 90° CW and flipped',
            6: 'Rotated 90° CW',
            7: 'Rotated 90° CCW and flipped',
            8: 'Rotated 90° CCW'
        };
        return orientationMap[orientation] || 'Unknown';
    }

    /**
     * Get readable summary of EXIF data
     * @param {Object} exifData - EXIF data object from extractExifData
     * @returns {string} Formatted summary
     */
    static getSummary(exifData) {
        const parts = [];

        if (exifData.camera?.model) {
            parts.push(`📷 ${exifData.camera.model}`);
        }

        if (exifData.shooting?.dateTimeOriginal?.display) {
            parts.push(`📅 ${exifData.shooting.dateTimeOriginal.display}`);
        }

        if (exifData.shooting?.focalLength) {
            parts.push(`🔍 ${exifData.shooting.focalLength}`);
        }

        if (exifData.shooting?.fNumber) {
            parts.push(exifData.shooting.fNumber);
        }

        if (exifData.location?.latitude) {
            parts.push(`📍 ${exifData.location.latitude.toFixed(4)}, ${exifData.location.longitude.toFixed(4)}`);
        }

        return parts.join(' | ');
    }

    /**
     * Search EXIF data by keyword
     * @param {Object} exifData - EXIF data to search
     * @param {string} keyword - Search keyword
     * @returns {boolean} True if keyword found
     */
    static searchExifData(exifData, keyword) {
        const keywordLower = keyword.toLowerCase();
        const dataStr = JSON.stringify(exifData).toLowerCase();
        return dataStr.includes(keywordLower);
    }

    /**
     * Filter photos by EXIF criteria
     * @param {Array} exifDataArray - Array of EXIF data objects
     * @param {Object} filters - Filter criteria
     * @returns {Array} Filtered indices
     */
    static filterByExif(exifDataArray, filters = {}) {
        return exifDataArray
            .map((exif, index) => ({ exif, index }))
            .filter(({ exif }) => {
                // Filter by camera model
                if (filters.cameraModel && exif.camera?.model !== filters.cameraModel) {
                    return false;
                }

                // Filter by date range
                if (filters.dateFrom || filters.dateTo) {
                    const photoDate = exif.shooting?.dateTimeOriginal?.iso;
                    if (!photoDate) return false;
                    
                    if (filters.dateFrom && photoDate < filters.dateFrom) return false;
                    if (filters.dateTo && photoDate > filters.dateTo) return false;
                }

                // Filter by focal length
                if (filters.focalLengthMin || filters.focalLengthMax) {
                    const focalLength = exif.shooting?.focalLength;
                    if (!focalLength) return false;
                    
                    const fl = parseFloat(focalLength);
                    if (filters.focalLengthMin && fl < filters.focalLengthMin) return false;
                    if (filters.focalLengthMax && fl > filters.focalLengthMax) return false;
                }

                // Filter by ISO
                if (filters.isoMin || filters.isoMax) {
                    const iso = exif.shooting?.iso;
                    if (!iso) return false;
                    
                    if (filters.isoMin && iso < filters.isoMin) return false;
                    if (filters.isoMax && iso > filters.isoMax) return false;
                }

                return true;
            })
            .map(({ index }) => index);
    }
}

export default ExifService;
