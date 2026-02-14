/**
 * Image Editing Routes
 * REST API endpoints for image editing with version history
 */

import express from 'express';
import {
  getPhotoVersions,
  getCurrentVersion,
  cropImage,
  rotateImage,
  resizeImage,
  flipImage,
  restoreVersion,
  deleteVersion,
  getImageMetadata
} from '../controllers/imageEditingController.js';

const router = express.Router();

// Get all versions of a photo
router.get('/photos/:photoId/versions', getPhotoVersions);

// Get current active version
router.get('/photos/:photoId/current-version', getCurrentVersion);

// Get image metadata  
router.get('/photos/:photoId/metadata', getImageMetadata);

// Image editing operations (create new versions)
router.post('/photos/:photoId/crop', cropImage);
router.post('/photos/:photoId/rotate', rotateImage);
router.post('/photos/:photoId/resize', resizeImage);
router.post('/photos/:photoId/flip', flipImage);

// Version management
router.put('/photos/:photoId/restore', restoreVersion);
router.delete('/photos/:photoId/versions/:versionNumber', deleteVersion);

export default router;
