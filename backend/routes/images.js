// ========================================
// IMAGE UPLOAD ROUTES - routes/images.js
// ========================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import auth middleware - adjust path if needed
let authenticateToken;
try {
  const auth = require('../middleware/auth');
  authenticateToken = auth.authenticateToken || auth.verifyToken || auth;
} catch (e) {
  // Fallback: create simple auth check
  const jwt = require('jsonwebtoken');
  authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'freshbread-secret-key', (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      }
      req.user = user;
      next();
    });
  };
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save to uploads folder in backend
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const key = req.body.key || 'image';
    cb(null, key + '-' + uniqueSuffix + ext);
  }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// POST /api/images/upload - Upload a new image
router.post('/upload', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const imageKey = req.body.key;
    const targetPath = req.body.targetPath;
    
    // The uploaded file path
    const uploadedFilename = req.file.filename;
    let finalUrl = `/uploads/${uploadedFilename}`;

    // Store the image path in database if we have access
    try {
      const db = require('../database/db');
      if (db && imageKey) {
        const stmt = db.prepare(`
          INSERT OR REPLACE INTO content (key, value, updated_at)
          VALUES (?, ?, datetime('now'))
        `);
        stmt.run(`image_${imageKey}`, finalUrl);
      }
    } catch (dbErr) {
      console.log('Could not save to database:', dbErr.message);
    }

    console.log(`Image uploaded: ${uploadedFilename}`);

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      url: finalUrl,
      filename: uploadedFilename
    });

  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({ success: false, message: error.message || 'Upload failed' });
  }
});

// GET /api/images/list - List all uploaded images
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      return res.json({ images: [] });
    }

    const files = fs.readdirSync(uploadsDir);
    const images = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(file => ({
        filename: file,
        url: `/uploads/${file}`
      }));

    res.json({ images });

  } catch (error) {
    console.error('List images error:', error);
    res.status(500).json({ error: 'Failed to list images' });
  }
});

// DELETE /api/images/:filename - Delete an image
router.delete('/:filename', authenticateToken, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, '..', 'uploads', filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ error: 'Image not found' });
    }

    fs.unlinkSync(filepath);

    res.json({ success: true, message: 'Image deleted' });

  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

module.exports = router;
