/**
 * Image Editing Controller
 * Handles image editing operations: crop, rotate, resize, flip
 * Supports version history and restoration
 */

import ImageEditingService from '../services/imageEditingService.js';
import { query } from '../models/db.js';
import logger from '../config/logger.js';

// Get all versions of a photo
export async function getPhotoVersions(req, res) {
  try {
    const photoId = req.params.photoId;

    if (!photoId) {
      return res.status(400).json({ error: true, message: 'Photo ID is required' });
    }

    const versions = await ImageEditingService.getPhotoVersions(photoId);

    res.json({
      success: true,
      photoId,
      versions,
      totalVersions: versions.length
    });
  } catch (error) {
    logger.error('Error fetching photo versions', { error: error.message });
    res.status(500).json({
      error: true,
      message: 'Failed to fetch photo versions',
      details: error.message
    });
  }
}

// Get current active version
export async function getCurrentVersion(req, res) {
  try {
    const photoId = req.params.photoId;

    if (!photoId) {
      return res.status(400).json({ error: true, message: 'Photo ID is required' });
    }

    const version = await ImageEditingService.getCurrentVersion(photoId);

    res.json({
      success: true,
      photoId,
      version
    });
  } catch (error) {
    logger.error('Error fetching current version', { error: error.message });
    res.status(500).json({
      error: true,
      message: 'Failed to fetch current version',
      details: error.message
    });
  }
}

// Crop image and save as new version
export async function cropImage(req, res) {
  try {
    const photoId = req.params.photoId;
    const { coordinates } = req.body;

    if (!photoId || !coordinates) {
      return res.status(400).json({
        error: true,
        message: 'Photo ID and crop coordinates (x, y, width, height) are required'
      });
    }

    // Get current version to find file path
    const currentVersion = await ImageEditingService.getCurrentVersion(photoId);
    if (!currentVersion) {
      return res.status(404).json({ error: true, message: 'Photo not found' });
    }

    const imagePath = `${currentVersion.path}/${currentVersion.filename}`;

    const result = await ImageEditingService.cropAndSave(photoId, imagePath, coordinates);

    logger.info('Image cropped and saved', { photoId, result });

    res.json({
      success: true,
      message: 'Image cropped successfully',
      ...result
    });
  } catch (error) {
    logger.error('Crop error', { error: error.message });
    res.status(500).json({
      error: true,
      message: 'Failed to crop image',
      details: error.message
    });
  }
}

// Rotate image and save as new version
export async function rotateImage(req, res) {
  try {
    const photoId = req.params.photoId;
    const { degrees } = req.body;

    if (!photoId || !degrees) {
      return res.status(400).json({
        error: true,
        message: 'Photo ID and degrees (90, 180, or 270) are required'
      });
    }

    // Get current version to find file path
    const currentVersion = await ImageEditingService.getCurrentVersion(photoId);
    if (!currentVersion) {
      return res.status(404).json({ error: true, message: 'Photo not found' });
    }

    const imagePath = `${currentVersion.path}/${currentVersion.filename}`;

    const result = await ImageEditingService.rotateAndSave(photoId, imagePath, degrees);

    logger.info('Image rotated and saved', { photoId, degrees });

    res.json({
      success: true,
      message: `Image rotated ${degrees}°`,
      ...result
    });
  } catch (error) {
    logger.error('Rotate error', { error: error.message });
    res.status(500).json({
      error: true,
      message: 'Failed to rotate image',
      details: error.message
    });
  }
}

// Resize image and save as new version
export async function resizeImage(req, res) {
  try {
    const photoId = req.params.photoId;
    const { width, height, fit } = req.body;

    if (!photoId || !width || !height) {
      return res.status(400).json({
        error: true,
        message: 'Photo ID, width, and height are required'
      });
    }

    // Get current version to find file path
    const currentVersion = await ImageEditingService.getCurrentVersion(photoId);
    if (!currentVersion) {
      return res.status(404).json({ error: true, message: 'Photo not found' });
    }

    const imagePath = `${currentVersion.path}/${currentVersion.filename}`;

    const result = await ImageEditingService.resizeAndSave(photoId, imagePath, {
      width,
      height,
      fit: fit || 'inside'
    });

    logger.info('Image resized and saved', { photoId, width, height });

    res.json({
      success: true,
      message: `Image resized to ${width}x${height}`,
      ...result
    });
  } catch (error) {
    logger.error('Resize error', { error: error.message });
    res.status(500).json({
      error: true,
      message: 'Failed to resize image',
      details: error.message
    });
  }
}

// Flip image and save as new version
export async function flipImage(req, res) {
  try {
    const photoId = req.params.photoId;
    const { direction } = req.body;

    if (!photoId || !direction) {
      return res.status(400).json({
        error: true,
        message: 'Photo ID and direction (horizontal or vertical) are required'
      });
    }

    // Get current version to find file path
    const currentVersion = await ImageEditingService.getCurrentVersion(photoId);
    if (!currentVersion) {
      return res.status(404).json({ error: true, message: 'Photo not found' });
    }

    const imagePath = `${currentVersion.path}/${currentVersion.filename}`;

    const result = await ImageEditingService.flipAndSave(photoId, imagePath, direction);

    logger.info('Image flipped and saved', { photoId, direction });

    res.json({
      success: true,
      message: `Image flipped ${direction}`,
      ...result
    });
  } catch (error) {
    logger.error('Flip error', { error: error.message });
    res.status(500).json({
      error: true,
      message: 'Failed to flip image',
      details: error.message
    });
  }
}

// Restore previous version
export async function restoreVersion(req, res) {
  try {
    const photoId = req.params.photoId;
    const { versionNumber } = req.body;

    if (!photoId || !versionNumber) {
      return res.status(400).json({
        error: true,
        message: 'Photo ID and version number are required'
      });
    }

    const result = await ImageEditingService.restoreVersion(photoId, versionNumber);

    logger.info('Version restored', { photoId, versionNumber });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Restore version error', { error: error.message });
    res.status(500).json({
      error: true,
      message: 'Failed to restore version',
      details: error.message
    });
  }
}

// Delete a specific version
export async function deleteVersion(req, res) {
  try {
    const photoId = req.params.photoId;
    const versionNumber = req.params.versionNumber;

    if (!photoId || !versionNumber) {
      return res.status(400).json({
        error: true,
        message: 'Photo ID and version number are required'
      });
    }

    const result = await ImageEditingService.deleteVersion(photoId, parseInt(versionNumber));

    logger.info('Version deleted', { photoId, versionNumber });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Delete version error', { error: error.message });
    res.status(500).json({
      error: true,
      message: 'Failed to delete version',
      details: error.message
    });
  }
}

// Get image metadata
export async function getImageMetadata(req, res) {
  try {
    const photoId = req.params.photoId;

    if (!photoId) {
      return res.status(400).json({ error: true, message: 'Photo ID is required' });
    }

    // Get current version to find file path
    const currentVersion = await ImageEditingService.getCurrentVersion(photoId);
    if (!currentVersion) {
      return res.status(404).json({ error: true, message: 'Photo not found' });
    }

    const imagePath = `${currentVersion.path}/${currentVersion.filename}`;
    const metadata = await ImageEditingService.getImageMetadata(imagePath);

    res.json({
      success: true,
      photoId,
      metadata
    });
  } catch (error) {
    logger.error('Error getting image metadata', { error: error.message });
    res.status(500).json({
      error: true,
      message: 'Failed to get image metadata',
      details: error.message
    });
  }
}
