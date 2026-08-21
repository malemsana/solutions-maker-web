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

  // LocalStorage Settings API
  getConfig() {
    return {
      apiKey: localStorage.getItem('gemini_api_key') || '',
      extractionModel: localStorage.getItem('gemini_extraction_model') || 'gemini-2.5-flash',
      solverModel: localStorage.getItem('gemini_solver_model') || 'gemini-2.5-flash',
      webpQuality: parseFloat(localStorage.getItem('webp_quality') || '0.80')
    };
  }

  saveConfig(cfg) {
    if (cfg.apiKey !== undefined) localStorage.setItem('gemini_api_key', cfg.apiKey.trim());
    if (cfg.extractionModel !== undefined) localStorage.setItem('gemini_extraction_model', cfg.extractionModel.trim());
    if (cfg.solverModel !== undefined) localStorage.setItem('gemini_solver_model', cfg.solverModel.trim());
    if (cfg.webpQuality !== undefined) localStorage.setItem('webp_quality', String(cfg.webpQuality));
  }
}

window.Storage = new StorageService();