const fetch = require('node-fetch');
const stream = require('stream');
const { promisify } = require('util');
const cacheManager = require('./cacheManager');
const pipeline = promisify(stream.pipeline);

const GITHUB_API_BASE = 'https://api.github.com/repos';
const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com';
const REPO_OWNER = "codekripa";
const DEFAULT_REPO = "NewSongs";

// Get GitHub token from environment variables
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

let currentRepo = DEFAULT_REPO;

// Cache to store downloaded songs in memory
const songCache = new Map();

exports.setCurrentRepo = (repo) => {
  currentRepo = repo;
};

exports.getCurrentRepo = () => {
  return currentRepo;
};

exports.getAllSongs = async () => {
  try {
    cacheManager.clear();
    const songs = await getMP3FilesRecursive();
    return songs.map((song, index) => ({
      id: index,
      name: song.name,
      path: `/songs/stream/${index}`,
      githubUrl: song.url
    }));
  } catch (error) {
    throw error;
  }
};

async function getMP3FilesRecursive(path = "") {
  const url = `${GITHUB_API_BASE}/${REPO_OWNER}/${currentRepo}/contents/${path}`;
  try {
    const headers = {
      'Accept': 'application/vnd.github.v3+json'
    };
    
    // Add Authorization header if token is available
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }
    
    const response = await fetch(url, { headers });
    
    // Check if the response is successful
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`GitHub API Error: ${response.status} - ${errorData.message}`);
      throw new Error(`GitHub API Error: ${response.status} - ${errorData.message}`);
    }
    
    const files = await response.json();
    
    // Check if files is an array
    if (!Array.isArray(files)) {
      console.error('GitHub API did not return an array of files:', files);
      throw new Error('Invalid response from GitHub API');
    }
    
    let mp3Files = [];
    
    for (let file of files) {
      if (file.type === "file" && file.name.endsWith(".mp3")) {
        mp3Files.push({
          name: file.name,
          url: `${GITHUB_RAW_BASE}/${REPO_OWNER}/${currentRepo}/main/${file.path}`,
          size: file.size
        });
      } else if (file.type === "dir") {
        const subDirectoryMP3s = await getMP3FilesRecursive(file.path);
        mp3Files = mp3Files.concat(subDirectoryMP3s);
      }
    }
    return mp3Files;
  } catch (error) {
    console.error("Error fetching file list:", error);
    throw error;
  }
}

exports.getSongMetadata = async (index) => {
  const songs = await this.getAllSongs();
  if (index >= 0 && index < songs.length) {
    return songs[index];
  }
  throw new Error('Song not found');
};

exports.getGithubSongStream = async (index) => {
  try {
    const songs = await this.getAllSongs();
    if (index >= 0 && index < songs.length) {
      const song = songs[index];
      
      // Check if song is already in cache
      if (cacheManager.has(song.githubUrl)) {
        const cachedBuffer = cacheManager.get(song.githubUrl);
        return {
          stream: stream.Readable.from(cachedBuffer),
          size: cachedBuffer.length
        };
      }

      // Download the file from GitHub
      const response = await fetch(song.githubUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch song from GitHub');
      }

      // Get the buffer of the entire file
      const buffer = await response.buffer();
      
      // Store in cache
      cacheManager.set(song.githubUrl, buffer);

      // Return a readable stream from the buffer
      return {
        stream: stream.Readable.from(buffer),
        size: buffer.length
      };
    }
    throw new Error('Song not found');
  } catch (error) {
    console.error('Error getting GitHub stream:', error);
    throw error;
  }
};

// Add a method to clear cache if needed
exports.clearCache = () => {
  songCache.clear();
}; 