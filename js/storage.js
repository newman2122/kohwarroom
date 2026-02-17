/* ============================================
   KoH War Room - Storage Manager
   Dual-mode: Firebase Realtime DB (shared)
   or localStorage (solo/testing).
   Auto-detects based on firebase-config.js.
   ============================================ */

const StorageManager = (() => {
  'use strict';

  const LOCAL_KEYS = {
    activities: 'koh_activities',
    gatherNodes: 'koh_gather_nodes',
    mobHits: 'koh_mob_hits',
  };

  const FIREBASE_PATHS = {
    activities: 'activities',
    gatherNodes: 'gatherNodes',
    mobHits: 'mobHits',
  };

  const USER_KEYS = {
    username: 'koh_username',
    usernameHistory: 'koh_username_history',
    timezone: 'koh_viewer_tz',
    setupDone: 'koh_setup_done',
  };

  // ── Helpers ──────────────────────────────────────────────────

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function _isFirebase() {
    return typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED;
  }

  function _dbRef(path) {
    return firebase.database().ref(path);
  }

  // ── localStorage adapter ────────────────────────────────────

  function _localGet(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function _localSet(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // ── Firebase adapter ────────────────────────────────────────

  async function _fbGetAll(path) {
    const snapshot = await _dbRef(path).orderByChild('utcTime').once('value');
    const results = [];
    snapshot.forEach((child) => {
      results.push({ id: child.key, ...child.val() });
    });
    // Newest first
    return results.reverse();
  }

  async function _fbAdd(path, record) {
    const ref = _dbRef(path).push();
    record.id = ref.key;
    await ref.set(record);
    return record;
  }

  async function _fbRemove(path, recordId) {
    await _dbRef(`${path}/${recordId}`).remove();
  }

  // ── Public CRUD API ─────────────────────────────────────────

  async function getAll(category) {
    if (_isFirebase()) {
      const path = FIREBASE_PATHS[category];
      return path ? await _fbGetAll(path) : [];
    }
    const key = LOCAL_KEYS[category];
    return key ? _localGet(key) : [];
  }

  async function add(category, record) {
    record.id = record.id || generateId();

    if (_isFirebase()) {
      const path = FIREBASE_PATHS[category];
      if (path) return await _fbAdd(path, record);
    } else {
      const key = LOCAL_KEYS[category];
      if (key) {
        const data = _localGet(key);
        data.unshift(record);
        _localSet(key, data);
      }
    }
    return record;
  }

  async function remove(category, recordId) {
    if (_isFirebase()) {
      const path = FIREBASE_PATHS[category];
      if (path) await _fbRemove(path, recordId);
    } else {
      const key = LOCAL_KEYS[category];
      if (key) {
        const data = _localGet(key);
        _localSet(key, data.filter((r) => r.id !== recordId));
      }
    }
  }

  // ── User Profile (always localStorage — per-device) ─────────

  function getUsername() {
    return localStorage.getItem(USER_KEYS.username) || '';
  }

  function setUsername(name) {
    const oldName = getUsername();

    // Track history if changing from a previous name
    if (oldName && oldName !== name) {
      const history = getUsernameHistory();
      history.push({
        from: oldName,
        to: name,
        changedAt: new Date().toISOString(),
      });
      localStorage.setItem(USER_KEYS.usernameHistory, JSON.stringify(history));
    }

    localStorage.setItem(USER_KEYS.username, name);
  }

  function getUsernameHistory() {
    try {
      const raw = localStorage.getItem(USER_KEYS.usernameHistory);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function isSetupDone() {
    return localStorage.getItem(USER_KEYS.setupDone) === 'true';
  }

  function markSetupDone() {
    localStorage.setItem(USER_KEYS.setupDone, 'true');
  }

  // ── Firebase mode check ─────────────────────────────────────

  function isFirebaseMode() {
    return _isFirebase();
  }

  /**
   * Subscribe to real-time updates from Firebase.
   * Calls the callback whenever data changes.
   * Returns an unsubscribe function.
   */
  function onDataChange(category, callback) {
    if (!_isFirebase()) return () => {};

    const path = FIREBASE_PATHS[category];
    if (!path) return () => {};

    const ref = _dbRef(path);
    const handler = ref.on('value', () => {
      callback();
    });

    return () => ref.off('value', handler);
  }

  return {
    getAll,
    add,
    remove,
    getUsername,
    setUsername,
    getUsernameHistory,
    isSetupDone,
    markSetupDone,
    isFirebaseMode,
    onDataChange,
    generateId,
  };
})();
