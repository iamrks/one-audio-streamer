class CacheManager {
  constructor(maxSize = 200 * 1024 * 1024) { // 200MB max cache size for free tier
    this.cache = new Map();
    this.maxSize = maxSize;
    this.currentSize = 0;
  }

  set(key, buffer) {
    const size = buffer.length;

    // If adding this item would exceed max size, clear some space
    while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
      const firstKey = this.cache.keys().next().value;
      this.currentSize -= this.cache.get(firstKey).length;
      this.cache.delete(firstKey);
    }

    // Add new item
    this.cache.set(key, buffer);
    this.currentSize += size;
  }

  get(key) {
    return this.cache.get(key);
  }

  has(key) {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
    this.currentSize = 0;
  }
}

module.exports = new CacheManager(); 