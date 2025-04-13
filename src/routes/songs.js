const express = require('express');
const router = express.Router();
const songController = require('../controllers/songController');

// Get list of all songs
router.get('/list', songController.getSongsList);

// Get song metadata by index
router.get('/metadata/:index', songController.getSongMetadata);

// Stream song by index
router.get('/stream/:index', songController.streamSong);

// New route for changing repository
router.post('/source', songController.setSource);

module.exports = router; 