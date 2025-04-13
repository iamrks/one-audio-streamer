const streamService = require('../services/streamService');
const fileUtils = require('../utils/fileUtils');

exports.getSongsList = async (req, res) => {
  try {
    const songs = await fileUtils.getAllSongs();
    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get songs list' });
  }
};

exports.getSongMetadata = async (req, res) => {
  try {
    const { index } = req.params;
    const metadata = await fileUtils.getSongMetadata(index);
    res.json(metadata);
  } catch (error) {
    res.status(404).json({ error: 'Song not found' });
  }
};

exports.streamSong = async (req, res) => {
  try {
    const { index } = req.params;
    const range = req.headers.range;
    await streamService.streamAudio(index, range, res);
  } catch (error) {
    res.status(500).json({ error: 'Streaming failed' });
  }
};

exports.setSource = async (req, res) => {
  try {
    const { repo } = req.body;
    fileUtils.setCurrentRepo(repo);
    const songs = await fileUtils.getAllSongs();
    res.json({ success: true, songs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change source' });
  }
}; 