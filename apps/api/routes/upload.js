import express from 'express';
import { uploadSingle, handleUploadError } from '../middleware/upload.js';
import { authenticateToken } from '../middleware/auth.js';
import { isAdmin } from '../middleware/isAdmin.js';

const router = express.Router();

/**
 * @desc    Upload a single image
 * @route   POST /api/upload/single
 * @access  Admin
 * @body    FormData with a field 'image'
 */
router.post('/single', authenticateToken, isAdmin, (req, res, next) => {
    // `uploadSingle` will process the file upload
    uploadSingle(req, res, (err) => {
        if (err) {
            // Let the error handler middleware deal with it
            return next(err);
        }

        // Check if a file was uploaded
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                message: 'No file uploaded. Please select a file.' 
            });
        }

        // The frontend expects the URL to be relative to the API server
    // Support both Cloudinary and Local
    const fileUrl = (req.file.path && req.file.path.startsWith('http')) 
      ? req.file.path 
      : `/uploads/products/${req.file.filename}`;
    
    res.status(200).json({
      success: true,
      message: 'File uploaded successfully.',
      data: {
        url: fileUrl,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      }
    });
    });
}, handleUploadError); // Add the custom error handler at the end

export default router;
