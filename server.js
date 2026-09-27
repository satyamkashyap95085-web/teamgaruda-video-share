const express = require('express');
const multer = require('multer');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));

// Configure Cloudinary Credentials
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'team_garuda_videos',
      resource_type: 'video',
      public_id: Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9]/g, "_")
    };
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100 MB Limit
});

// 1. Admin Upload Route
app.post('/upload', (req, res, next) => {
  upload.single('video')(req, res, (err) => {
    const adminPassword = process.env.ADMIN_PASSWORD || 'garuda123';

    // Verify Password First
    if (req.body.password !== adminPassword) {
      return res.status(401).json({ error: 'Incorrect Admin Password!' });
    }

    if (err) {
      console.error('Upload Error Details:', err);
      return res.status(500).json({ error: 'Upload failed: ' + (err.message || 'Server error during upload') });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Please choose a valid video file.' });
    }

    res.json({ message: 'Video uploaded successfully!', url: req.file.path });
  });
});

// 2. Public Route: Get all uploaded videos
app.get('/videos', async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'team_garuda_videos/',
      resource_type: 'video',
      max_results: 50
    });
    const videoUrls = result.resources.map(file => file.secure_url);
    res.json(videoUrls);
  } catch (error) {
    console.error('Cloudinary API Error:', error);
    res.status(500).json({ error: 'Failed to fetch videos.', details: error.message });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
