const fileUtils = require('../utils/fileUtils');
const stream = require('stream');

exports.streamAudio = async (index, range, res) => {
  try {
    const { stream: githubStream, size } = await fileUtils.getGithubSongStream(index);
    
    // Set basic headers
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');

    if (range) {
      // Handle range request
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : size - 1;
      const chunksize = (end - start) + 1;
      
      res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
      res.setHeader('Content-Length', chunksize);
      res.status(206);

      // Create a transform stream to handle the range
      const rangeStream = new stream.Transform({
        transform(chunk, encoding, callback) {
          callback(null, chunk);
        }
      });

      githubStream.pipe(rangeStream).pipe(res);
    } else {
      // Handle normal request
      res.setHeader('Content-Length', size);
      res.status(200);
      githubStream.pipe(res);
    }

  } catch (error) {
    console.error('Streaming error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Streaming failed' });
    }
  }
}; 