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

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'team_garuda_videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'mkv']
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }
});

// Admin Upload Route
app.post('/upload', upload.single('video'), (req, res) => {
  const adminPassword = process.env.ADMIN_PASSWORD || 'garuda123';

  if (req.body.password !== adminPassword) {
    return res.status(401).json({ error: 'Incorrect Admin Password!' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Please choose a valid video file.' });
  }

  res.json({ message: 'Video uploaded successfully!', url: req.file.path });
});

// Public Route: Returns all uploaded video links to visitors
app.get('/videos', async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'team_garuda_videos/',
      resource_type: 'video'
    });
    const videoUrls = result.resources.map(file => file.secure_url);
    res.json(videoUrls);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch videos.' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
