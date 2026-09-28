const express = require('express');
const multer = require('multer');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
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

// Configure Multer with Temp Disk Storage (50MB Limit)
const upload = multer({ 
  dest: '/tmp/',
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB Hard Limit
});

// Admin Upload Route
app.post('/upload', upload.single('video'), async (req, res) => {
  const adminPassword = process.env.ADMIN_PASSWORD || 'garuda123';

  // Check Password
  if (req.body.password !== adminPassword) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(401).json({ error: 'Incorrect Admin Password!' });
  }

  // Check File
  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided or file exceeds 50MB.' });
  }

  try {
    // Correct Cloudinary method for large disk files
    const result = await cloudinary.uploader.upload_large(req.file.path, {
      folder: 'team_garuda_videos',
      resource_type: 'video',
      chunk_size: 6000000 // 6MB chunks for stable uploading
    });

    // Delete temp file after successful upload
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    return res.json({ message: 'Video uploaded successfully!', url: result.secure_url });
  } catch (error) {
    // Cleanup file on error
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('Cloudinary Upload Error:', error);
    return res.status(500).json({ error: 'Upload failed: ' + (error.message || 'Server error') });
  }
});

// Public Route: Fetch all uploaded videos
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
    console.error('Fetch Error:', error);
    res.status(500).json({ error: 'Failed to fetch videos.' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
