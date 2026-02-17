/* ============================================
   KoH War Room - App (Main Entry Point)
   Welcome flow, forms, settings, event
   handlers, and module initialization.
   ============================================ */

(() => {
  'use strict';

  // ── Initialization ──────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', async () => {
    // Load saved timezone
    TimezoneManager.loadSavedTimezone();

    // Populate ALL timezone selects
    _populateAllTimezoneSelects();

    // Start clock
    TimezoneManager.startClock(document.getElementById('viewer-clock'));

    // Set default datetime values
    _setAllDatetimeDefaults();

    // Initialize tabs
    UI.initTabs();

    // Wire up forms
    _initActivityForm();
    _initGatherForm();
    _initMobForm();
    _initSettingsForm();
    _initWelcomeForm();

    // Wire up search/filter
    _initSearchFilters();

    // Wire up delete handlers (event delegation)
    document.addEventListener('click', _handleDeleteClick);

    // Wire up enemy profile selector
    const profileSelect = document.getElementById('profile-enemy-select');
    if (profileSelect) {
      profileSelect.addEventListener('change', () => {
        Dashboard.renderEnemyProfile(profileSelect.value);
      });
    }

    // Check if first-time user — show welcome
    if (!StorageManager.isSetupDone()) {
      _showWelcome();
    } else {
      _updateUserBadge();
    }

    // Firebase real-time listeners (auto-refresh when others add data)
    if (StorageManager.isFirebaseMode()) {
      StorageManager.onDataChange('activities', refreshAllViews);
      StorageManager.onDataChange('gatherNodes', refreshAllViews);
      StorageManager.onDataChange('mobHits', refreshAllViews);
    }

    // Initial render
    await refreshAllViews();
  });

  // ── Timezone Selects ──────────────────────────────────────

  function _populateAllTimezoneSelects() {
    const ids = ['viewer-timezone', 'welcome-timezone', 'settings-timezone'];
    const currentTz = TimezoneManager.getViewerTimezone();

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        TimezoneManager.populateSelect(el);
        el.value = currentTz;
      }
    });

    // Header timezone change handler
    const headerTz = document.getElementById('viewer-timezone');
    if (headerTz) {
      headerTz.addEventListener('change', async () => {
        TimezoneManager.setViewerTimezone(headerTz.value);
        // Sync settings dropdown too
        const settingsTz = document.getElementById('settings-timezone');
        if (settingsTz) settingsTz.value = headerTz.value;
        UI.toast('Timezone updated!', 'info');
        await refreshAllViews();
      });
    }
  }

  // ── Welcome Flow ─────────────────────────────────────────

  function _showWelcome() {
    const dialog = document.getElementById('welcome-dialog');
    if (dialog) dialog.showModal();
  }

  function _initWelcomeForm() {
    const form = document.getElementById('welcome-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = document.getElementById('welcome-username').value.trim();
      const timezone = document.getElementById('welcome-timezone').value;

      if (!username) {
        UI.toast('Please enter your in-game username!', 'error');
        return;
      }

      // Save profile
      StorageManager.setUsername(username);
      TimezoneManager.setViewerTimezone(timezone);
      StorageManager.markSetupDone();

      // Sync all timezone selects
      document.getElementById('viewer-timezone').value = timezone;
      const settingsTz = document.getElementById('settings-timezone');
      if (settingsTz) settingsTz.value = timezone;

      // Close dialog and update UI
      document.getElementById('welcome-dialog').close();
      _updateUserBadge();
      _updateSettingsForm();

      UI.toast(`Welcome, ${username}! You're in the War Room. ⚔️`, 'success');
      await refreshAllViews();
    });
  }

  // ── User Badge ───────────────────────────────────────────

  function _updateUserBadge() {
    const nameEl = document.getElementById('user-badge-name');
    const username = StorageManager.getUsername();
    if (nameEl) {
      nameEl.textContent = username || 'Not Set';
      nameEl.classList.toggle('not-set', !username);
    }
  }

  // ── Settings ─────────────────────────────────────────────

  function _initSettingsForm() {
    const form = document.getElementById('settings-username-form');
    if (!form) return;

    // Pre-fill current values
    _updateSettingsForm();

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const newUsername = document.getElementById('settings-username').value.trim();
      const newTimezone = document.getElementById('settings-timezone').value;

      if (!newUsername) {
        UI.toast('Username cannot be empty!', 'error');
        return;
      }

      const oldUsername = StorageManager.getUsername();
      StorageManager.setUsername(newUsername);
      TimezoneManager.setViewerTimezone(newTimezone);

      // Sync header timezone dropdown
      document.getElementById('viewer-timezone').value = newTimezone;

      _updateUserBadge();
      _renderUsernameHistory();

      if (oldUsername && oldUsername !== newUsername) {
        UI.toast(`Username changed: ${oldUsername} → ${newUsername}`, 'success');
      } else {
        UI.toast('Settings saved! 💾', 'success');
      }

      await refreshAllViews();
    });
  }

  function _updateSettingsForm() {
    const usernameInput = document.getElementById('settings-username');
    const timezoneSelect = document.getElementById('settings-timezone');

    if (usernameInput) usernameInput.value = StorageManager.getUsername();
    if (timezoneSelect) timezoneSelect.value = TimezoneManager.getViewerTimezone();

    _renderUsernameHistory();
  }

  function _renderUsernameHistory() {
    const container = document.getElementById('username-history');
    if (!container) return;

    const history = StorageManager.getUsernameHistory();

    if (history.length === 0) {
      container.innerHTML = '<p class="empty-state">No name changes recorded yet.</p>';
      return;
    }

    container.innerHTML = history
      .reverse()
      .map((entry) => {
        const date = TimezoneManager.utcToViewerLocal(entry.changedAt);
        return `
          <div class="history-item">
            <span class="history-names">
              <span class="history-old">${UI.escapeHtml(entry.from)}</span>
              <span class="history-arrow" aria-hidden="true">→</span>
              <span class="history-new">${UI.escapeHtml(entry.to)}</span>
            </span>
            <span class="history-date">${date}</span>
          </div>
        `;
      })
      .join('');
  }

  // ── Refresh Everything ──────────────────────────────────────

  async function refreshAllViews() {
    await Promise.all([
      Dashboard.refreshAll(),
      _renderActivityTable(),
      _renderGatherTable(),
      _renderMobTable(),
    ]);
  }

  // ── Datetime Defaults ──────────────────────────────────────

  function _setAllDatetimeDefaults() {
    ['act-time', 'gath-time', 'mob-time'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) TimezoneManager.setDefaultDatetime(el);
    });
  }

  // ── Username Validation Helper ───────────────────────────────

  function _requireUsername() {
    const username = StorageManager.getUsername();
    if (!username) {
      UI.toast('Please set up your username first!', 'error');
      // Switch to settings tab
      document.getElementById('tab-settings')?.click();
      return null;
    }
    return username;
  }

  // ── Activity Form ──────────────────────────────────────────

  function _initActivityForm() {
    const form = document.getElementById('activity-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = _requireUsername();
      if (!username) return;

      const localTime = document.getElementById('act-time').value;
      const utcTime = TimezoneManager.localToUTC(
        localTime, TimezoneManager.getViewerTimezone()
      );

      await StorageManager.add('activities', {
        enemyTag: document.getElementById('act-enemy-tag').value.trim(),
        utcTime,
        activityType: document.getElementById('act-type').value,
        notes: document.getElementById('act-notes').value.trim(),
        reporterCallsign: username,
        reporterTz: TimezoneManager.getViewerTimezone(),
      });

      UI.toast('Activity logged! 📡', 'success');
      form.reset();
      _setAllDatetimeDefaults();
      if (!StorageManager.isFirebaseMode()) await refreshAllViews();
    });
  }

  // ── Gather Form ────────────────────────────────────────────

  function _initGatherForm() {
    const form = document.getElementById('gather-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = _requireUsername();
      if (!username) return;

      const localTime = document.getElementById('gath-time').value;
      const utcTime = TimezoneManager.localToUTC(
        localTime, TimezoneManager.getViewerTimezone()
      );

      await StorageManager.add('gatherNodes', {
        enemyTag: document.getElementById('gath-enemy-tag').value.trim(),
        utcTime,
        nodeLevel: document.getElementById('gath-node-level').value,
        resource: document.getElementById('gath-resource').value,
        coords: document.getElementById('gath-coords').value.trim(),
        notes: document.getElementById('gath-notes').value.trim(),
        reporterCallsign: username,
        reporterTz: TimezoneManager.getViewerTimezone(),
      });

      UI.toast('Gather sighting logged! ⛏️', 'success');
      form.reset();
      _setAllDatetimeDefaults();
      if (!StorageManager.isFirebaseMode()) await refreshAllViews();
    });
  }

  // ── Mob Form ───────────────────────────────────────────────

  function _initMobForm() {
    const form = document.getElementById('mob-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = _requireUsername();
      if (!username) return;

      const localTime = document.getElementById('mob-time').value;
      const utcTime = TimezoneManager.localToUTC(
        localTime, TimezoneManager.getViewerTimezone()
      );

      await StorageManager.add('mobHits', {
        enemyTag: document.getElementById('mob-enemy-tag').value.trim(),
        utcTime,
        mobLevel: document.getElementById('mob-level').value,
        mobType: document.getElementById('mob-type').value,
        coords: document.getElementById('mob-coords').value.trim(),
        notes: document.getElementById('mob-notes').value.trim(),
        reporterCallsign: username,
        reporterTz: TimezoneManager.getViewerTimezone(),
      });

      UI.toast('Mob hit logged! 🐉', 'success');
      form.reset();
      _setAllDatetimeDefaults();
      if (!StorageManager.isFirebaseMode()) await refreshAllViews();
    });
  }

  // ── Table Renderers ────────────────────────────────────────

  async function _renderActivityTable() {
    const records = await StorageManager.getAll('activities');
    const searchText = document.getElementById('activity-search')?.value || '';
    const filtered = UI.filterRecords(records, searchText);

    UI.renderTable('activity-tbody', filtered, (r) => `
      <tr>
        <td>${TimezoneManager.utcToViewerLocal(r.utcTime)}</td>
        <td><strong style="color:var(--text-warning)">${UI.escapeHtml(r.enemyTag)}</strong></td>
        <td>${UI.activityLabel(r.activityType)}</td>
        <td>${UI.escapeHtml(r.notes || '—')}</td>
        <td style="color:var(--text-muted)">${UI.escapeHtml(r.reporterCallsign || '???')}</td>
        <td>${UI.deleteButton('activities', r.id)}</td>
      </tr>
    `, 'No activity logged yet', 6);
  }

  async function _renderGatherTable() {
    const records = await StorageManager.getAll('gatherNodes');
    const searchText = document.getElementById('gather-search')?.value || '';
    const levelFilter = document.getElementById('gather-level-filter')?.value || '';
    const filtered = UI.filterRecords(records, searchText, 'nodeLevel', levelFilter);

    UI.renderTable('gather-tbody', filtered, (r) => `
      <tr>
        <td>${TimezoneManager.utcToViewerLocal(r.utcTime)}</td>
        <td><strong style="color:var(--text-warning)">${UI.escapeHtml(r.enemyTag)}</strong></td>
        <td>${UI.levelBadge(r.nodeLevel, 'gather')}</td>
        <td>${UI.resourceLabel(r.resource)}</td>
        <td>${UI.escapeHtml(r.coords || '—')}</td>
        <td>${UI.escapeHtml(r.notes || '—')}</td>
        <td style="color:var(--text-muted)">${UI.escapeHtml(r.reporterCallsign || '???')}</td>
        <td>${UI.deleteButton('gatherNodes', r.id)}</td>
      </tr>
    `, 'No gather sightings logged', 8);
  }

  async function _renderMobTable() {
    const records = await StorageManager.getAll('mobHits');
    const searchText = document.getElementById('mob-search')?.value || '';
    const filtered = UI.filterRecords(records, searchText);

    UI.renderTable('mob-tbody', filtered, (r) => `
      <tr>
        <td>${TimezoneManager.utcToViewerLocal(r.utcTime)}</td>
        <td><strong style="color:var(--text-warning)">${UI.escapeHtml(r.enemyTag)}</strong></td>
        <td>${UI.levelBadge(r.mobLevel, 'mob')}</td>
        <td>${UI.mobTypeLabel(r.mobType)}</td>
        <td>${UI.escapeHtml(r.coords || '—')}</td>
        <td>${UI.escapeHtml(r.notes || '—')}</td>
        <td style="color:var(--text-muted)">${UI.escapeHtml(r.reporterCallsign || '???')}</td>
        <td>${UI.deleteButton('mobHits', r.id)}</td>
      </tr>
    `, 'No mob hits logged', 8);
  }

  // ── Search / Filter Handlers ─────────────────────────────────

  function _initSearchFilters() {
    const debounce = (fn, ms) => {
      let timer;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
      };
    };

    const bind = (id, fn) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', debounce(fn, 250));
    };

    bind('activity-search', _renderActivityTable);
    bind('gather-search', _renderGatherTable);
    bind('mob-search', _renderMobTable);

    const gathFilter = document.getElementById('gather-level-filter');
    if (gathFilter) gathFilter.addEventListener('change', _renderGatherTable);
  }

  // ── Delete Handler (Event Delegation) ─────────────────────────

  async function _handleDeleteClick(e) {
    const btn = e.target.closest('.delete-btn');
    if (!btn) return;

    const confirmed = await UI.confirm(
      'Are you sure you want to delete this entry? This cannot be undone.'
    );

    if (confirmed) {
      await StorageManager.remove(btn.dataset.category, btn.dataset.id);
      UI.toast('Entry deleted', 'info');
      if (!StorageManager.isFirebaseMode()) await refreshAllViews();
    }
  }
})();
