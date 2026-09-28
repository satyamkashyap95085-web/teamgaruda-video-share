const express = require('express');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET
});

// 1. Password Verification Route (Fast JSON response)
app.post('/verify-admin', (req, res) => {
  const adminPassword = process.env.ADMIN_PASSWORD || 'garuda123';
  if (req.body.password !== adminPassword) {
    return res.status(401).json({ error: 'Incorrect Admin Password!' });
  }
  res.json({ success: true, cloudName: process.env.CLOUD_NAME });
});

// 2. Public Route: Fetch all uploaded videos
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
