const express = require('express');
const multer = require('multer');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// 1. Set Memory Storage with an 80MB File Limit
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 80 * 1024 * 1024 } // 80 MB Limit
});

// 2. Admin Upload Route using Chunked Large Upload Stream
app.post('/upload', upload.single('video'), (req, res) => {
  const adminPassword = process.env.ADMIN_PASSWORD || 'garuda123';

  if (req.body.password !== adminPassword) {
    return res.status(401).json({ error: 'Incorrect Admin Password!' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided.' });
  }

  // Use upload_large_stream with 20MB chunks for stable 80MB uploads
  const uploadStream = cloudinary.uploader.upload_large_stream(
    {
      folder: 'team_garuda_videos',
      resource_type: 'video',
      chunk_size: 20 * 1024 * 1024 // Uploads in 20MB chunks
    },
    (error, result) => {
      if (error) {
        console.error('Cloudinary Upload Error:', error);
        return res.status(500).json({ error: error.message || 'Cloudinary upload failed.' });
      }
      res.json({ message: 'Video uploaded successfully!', url: result.secure_url });
    }
  );

  uploadStream.end(req.file.buffer);
});

// 3. Public Route: Fetch all uploaded videos
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
