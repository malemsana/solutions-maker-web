// Storage Manager: IndexedDB (Binaries/Blobs/Questions) & LocalStorage (Secrets/Config)
const DB_NAME = 'ContinuaSolutionsDB';
const DB_VERSION = 1;

const ROUTING_TASKS = ['extraction', 'solving', 'latexFix'];

function normalizeRoutingEntry(raw) {
  if (!raw || typeof raw !== 'object') return { mode: 'auto', modelId: null };
  // Support both {mode,modelId} and legacy {mode,selectedModelId} shapes.
  const modelId = raw.modelId !== undefined ? raw.modelId : (raw.selectedModelId !== undefined ? raw.selectedModelId : null);
  if (raw.mode === 'explicit' && modelId) return { mode: 'explicit', modelId: String(modelId) };
  if (modelId && modelId !== 'auto') return { mode: 'explicit', modelId: String(modelId) };
  return { mode: 'auto', modelId: null };
}

function qualifyLegacyModelId(rawId) {
  if (!rawId) return null;
  const s = String(rawId).trim();
  if (!s || s === 'auto') return null;
  if (s.includes(':')) return s;
  return `gemini:${s}`;
}

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

  getZenKey() {
    try {
      return (localStorage.getItem('zen_api_key') || '').trim();
    } catch (e) {
      return '';
    }
  }

  saveZenKey(key) {
    const v = String(key || '').trim();
    if (v) localStorage.setItem('zen_api_key', v);
    else localStorage.removeItem('zen_api_key');
  }

  getRouting() {
    let raw = null;
    try {
      raw = JSON.parse(localStorage.getItem('ai_routing') || 'null');
    } catch (e) {
      raw = null;
    }
    const routing = {
      extraction: normalizeRoutingEntry(raw?.extraction),
      solving: normalizeRoutingEntry(raw?.solving),
      latexFix: normalizeRoutingEntry(raw?.latexFix)
    };
    // Backward-compat migration from legacy per-model keys (no cross-task leakage).
    const legacyExtraction = (localStorage.getItem('gemini_extraction_model') || '').trim();
    const legacySolver = (localStorage.getItem('gemini_solver_model') || '').trim();
    let migrated = false;
    if (routing.extraction.mode === 'auto' && legacyExtraction) {
      const q = qualifyLegacyModelId(legacyExtraction);
      if (q) {
        routing.extraction = { mode: 'explicit', modelId: q };
        migrated = true;
      }
    }
    if (routing.solving.mode === 'auto' && legacySolver) {
      const q = qualifyLegacyModelId(legacySolver);
      if (q) {
        routing.solving = { mode: 'explicit', modelId: q };
        migrated = true;
      }
    }
    if (migrated) {
      try {
        localStorage.setItem('ai_routing', JSON.stringify(routing));
      } catch (e) { /* ignore */ }
    }
    return routing;
  }

  saveRouting(routing) {
    const clean = {
      extraction: normalizeRoutingEntry(routing?.extraction),
      solving: normalizeRoutingEntry(routing?.solving),
      latexFix: normalizeRoutingEntry(routing?.latexFix)
    };
    localStorage.setItem('ai_routing', JSON.stringify(clean));
    return clean;
  }

  async setTaskModel(task, modelId) {
    const norm = task === 'latex_fix' ? 'latexFix' : task;
    if (!ROUTING_TASKS.includes(norm)) throw new Error(`Unknown task: ${task}`);
    const routing = this.getRouting();
    routing[norm] = modelId ? { mode: 'explicit', modelId: String(modelId) } : { mode: 'auto', modelId: null };
    return this.saveRouting(routing);
  }

  hasAnyProvider() {
    return this.getApiKeys().length > 0 || !!this.getZenKey();
  }

  getConfig() {
    const keys = this.getApiKeys();
    const routing = this.getRouting();
    return {
      // Legacy shape (preserved for backward compat)
      apiKeys: keys,
      apiKey: keys.length > 0 ? keys[0].key : '',
      extractionModel: routing.extraction.mode === 'explicit'
        ? routing.extraction.modelId
        : (localStorage.getItem('gemini_extraction_model') || 'gemini-flash-lite-latest'),
      solverModel: routing.solving.mode === 'explicit'
        ? routing.solving.modelId
        : (localStorage.getItem('gemini_solver_model') || 'gemini-flash-latest'),
      // New provider-oriented shape
      gemini: { apiKeys: keys },
      zen: { apiKey: this.getZenKey() },
      zenApiKey: this.getZenKey(),
      routing,
      webpQuality: parseFloat(localStorage.getItem('webp_quality') || '0.85')
    };
  }

  saveConfig(cfg) {
    if (cfg.apiKeys !== undefined) this.saveApiKeys(cfg.apiKeys);
    else if (cfg.gemini?.apiKeys !== undefined) this.saveApiKeys(cfg.gemini.apiKeys);
    else if (cfg.apiKey !== undefined && cfg.apiKey !== null) {
      const v = String(cfg.apiKey).trim();
      if (v) this.saveApiKeys([{ id: 'key_1', name: 'Default Key', key: v }]);
    }
    if (cfg.zen?.apiKey !== undefined) this.saveZenKey(cfg.zen.apiKey);
    else if (cfg.zenApiKey !== undefined) this.saveZenKey(cfg.zenApiKey);

    if (cfg.routing !== undefined) this.saveRouting(cfg.routing);
    // Allow independent per-task updates without touching other tasks.
    for (const t of ROUTING_TASKS) {
      if (cfg[t] !== undefined) {
        const routing = this.getRouting();
        routing[t] = normalizeRoutingEntry(cfg[t]);
        this.saveRouting(routing);
      }
    }

    // Legacy model-id fields update only their own task's routing entry.
    if (cfg.extractionModel !== undefined) {
      const v = String(cfg.extractionModel || '').trim();
      localStorage.setItem('gemini_extraction_model', v);
      const routing = this.getRouting();
      // Only adopt legacy field when no explicit new-style selection exists,
      // and never copy it into another task.
      if (routing.extraction.mode === 'auto' && v) {
        routing.extraction = { mode: 'explicit', modelId: qualifyLegacyModelId(v) };
        this.saveRouting(routing);
      }
    }
    if (cfg.solverModel !== undefined) {
      const v = String(cfg.solverModel || '').trim();
      localStorage.setItem('gemini_solver_model', v);
      const routing = this.getRouting();
      if (routing.solving.mode === 'auto' && v) {
        routing.solving = { mode: 'explicit', modelId: qualifyLegacyModelId(v) };
        this.saveRouting(routing);
      }
    }
    if (cfg.webpQuality !== undefined) localStorage.setItem('webp_quality', String(cfg.webpQuality));
  }
}

window.Storage = new StorageService();
