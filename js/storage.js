// Storage Manager: IndexedDB (Binaries/Blobs/Questions) & LocalStorage (Secrets/Config)
const DB_NAME = 'ContinuaSolutionsDB';
const DB_VERSION = 1;

class StorageService {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = e => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('chapters')) {
          db.createObjectStore('chapters', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('questions')) {
          const qStore = db.createObjectStore('questions', { keyPath: 'id' });
          qStore.createIndex('chapterId', 'chapterId', { unique: false });
        }
        if (!db.objectStoreNames.contains('assets')) {
          const aStore = db.createObjectStore('assets', { keyPath: 'path' });
          aStore.createIndex('chapterId', 'chapterId', { unique: false });
        }
        if (!db.objectStoreNames.contains('raw_files')) {
          db.createObjectStore('raw_files', { keyPath: 'id' });
        }
      };
      req.onsuccess = e => {
        this.db = e.target.result;
        resolve(this.db);
      };
      req.onerror = e => reject(e.target.error);
    });
  }

  async put(storeName, data) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(data);
      tx.oncomplete = () => resolve(true);
      tx.onerror = e => reject(e.target.error);
    });
  }

  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = e => reject(e.target.error);
    });
  }

  async getAllByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).index(indexName).getAll(value);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = e => reject(e.target.error);
    });
  }

  async delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = e => reject(e.target.error);
    });
  }

  // LocalStorage Settings API with Multi-Key Pool Support
  getApiKeys() {
    try {
      const raw = localStorage.getItem('gemini_api_keys');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}

    // Legacy migration: check gemini_api_key
    const legacyKey = (localStorage.getItem('gemini_api_key') || '').trim();
    if (legacyKey) {
      const initialKeys = [{ id: 'key_1', name: 'Default Key', key: legacyKey }];
      localStorage.setItem('gemini_api_keys', JSON.stringify(initialKeys));
      return initialKeys;
    }
    return [];
  }

  saveApiKeys(keysArray) {
    const valid = Array.isArray(keysArray) ? keysArray.filter(k => k && k.key && k.key.trim()) : [];
    localStorage.setItem('gemini_api_keys', JSON.stringify(valid));
    if (valid.length > 0) {
      localStorage.setItem('gemini_api_key', valid[0].key.trim());
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  }

  getConfig() {
    const keys = this.getApiKeys();
    return {
      apiKeys: keys,
      apiKey: keys.length > 0 ? keys[0].key : '',
      extractionModel: localStorage.getItem('gemini_extraction_model') || 'gemini-flash-lite-latest',
      solverModel: localStorage.getItem('gemini_solver_model') || 'gemini-flash-latest',
      webpQuality: parseFloat(localStorage.getItem('webp_quality') || '0.85')
    };
  }

  saveConfig(cfg) {
    if (cfg.apiKeys !== undefined) this.saveApiKeys(cfg.apiKeys);
    else if (cfg.apiKey !== undefined) this.saveApiKeys([{ id: 'key_1', name: 'Default Key', key: cfg.apiKey.trim() }]);

    if (cfg.extractionModel !== undefined) localStorage.setItem('gemini_extraction_model', cfg.extractionModel.trim());
    if (cfg.solverModel !== undefined) localStorage.setItem('gemini_solver_model', cfg.solverModel.trim());
    if (cfg.webpQuality !== undefined) localStorage.setItem('webp_quality', String(cfg.webpQuality));
  }
}

window.Storage = new StorageService();