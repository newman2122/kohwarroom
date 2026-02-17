/* ============================================
   KoH War Room - UI Helpers
   Tab switching, toasts, dialogs, table
   rendering, search / filter, form utils.
   ============================================ */

const UI = (() => {
  'use strict';

  // ── Tab Switching ───────────────────────────────────────────

  function initTabs() {
    const buttons = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.tab-panel');

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetTab = btn.dataset.tab;

        buttons.forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        panels.forEach((p) => {
          p.classList.remove('active');
          p.hidden = true;
        });

        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        const panel = document.getElementById(`panel-${targetTab}`);
        if (panel) {
          panel.classList.add('active');
          panel.hidden = false;
        }
      });
    });
  }

  // ── Toast Notifications ────────────────────────────────────

  const TOAST_ICONS = { success: '\u2705', error: '\u274C', info: '\u2139\uFE0F' };

  function toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.setAttribute('role', 'status');
    el.innerHTML = `
      <span class="toast-icon" aria-hidden="true">${TOAST_ICONS[type] || ''}</span>
      <span class="toast-message">${_escapeHtml(message)}</span>
    `;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  // ── Confirm Dialog ─────────────────────────────────────────

  function confirm(message) {
    return new Promise((resolve) => {
      const dialog = document.getElementById('confirm-dialog');
      const msgEl = document.getElementById('confirm-message');
      const okBtn = document.getElementById('confirm-ok');
      const cancelBtn = document.getElementById('confirm-cancel');

      msgEl.textContent = message;
      dialog.showModal();

      const cleanup = (result) => {
        dialog.close();
        okBtn.removeEventListener('click', onOk);
        cancelBtn.removeEventListener('click', onCancel);
        resolve(result);
      };

      const onOk = () => cleanup(true);
      const onCancel = () => cleanup(false);

      okBtn.addEventListener('click', onOk);
      cancelBtn.addEventListener('click', onCancel);
    });
  }

  // ── Table Rendering ────────────────────────────────────────

  /**
   * Render an array of records into a <tbody>.
   *
   * @param {string} tbodyId - ID of the <tbody> element
   * @param {Array} records - data records
   * @param {Function} rowRenderer - (record) => <tr> innerHTML string
   * @param {string} emptyMessage - message when no records
   * @param {number} colSpan - column span for empty message
   */
  function renderTable(tbodyId, records, rowRenderer, emptyMessage, colSpan) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    if (records.length === 0) {
      tbody.innerHTML = `<tr class="empty-row"><td colspan="${colSpan}">${_escapeHtml(emptyMessage)}</td></tr>`;
      return;
    }

    tbody.innerHTML = records.map(rowRenderer).join('');
  }

  // ── Search / Filter ────────────────────────────────────────

  function filterRecords(records, searchText, filterKey, filterValue) {
    let filtered = records;

    if (searchText) {
      const lower = searchText.toLowerCase();
      filtered = filtered.filter((r) =>
        Object.values(r).some(
          (v) => v && v.toString().toLowerCase().includes(lower)
        )
      );
    }

    if (filterKey && filterValue) {
      filtered = filtered.filter((r) => r[filterKey] === filterValue);
    }

    return filtered;
  }

  // ── Level Badge ───────────────────────────────────────────

  function levelBadge(level, type = 'gather') {
    const cls = type === 'gather' ? `level-badge level-${level}` : 'mob-level-badge';
    return `<span class="${cls}">Lv.${_escapeHtml(String(level))}</span>`;
  }

  // ── Resource Label ─────────────────────────────────────────

  const RESOURCE_ICONS = {
    food: '\uD83C\uDF3E',
    wood: '\uD83E\uDEB5',
    stone: '\uD83E\uDEA8',
    iron: '\u26D3\uFE0F',
    gold: '\uD83D\uDCB0',
    unknown: '\u2753',
  };

  function resourceLabel(type) {
    const icon = RESOURCE_ICONS[type] || '';
    const name = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'N/A';
    return `<span class="resource-${type || 'unknown'}">${icon} ${_escapeHtml(name)}</span>`;
  }

  // ── Activity Type Label ─────────────────────────────────────

  const ACTIVITY_LABELS = {
    online: '\uD83D\uDFE2 Came Online',
    gathering: '\u26CF\uFE0F Gathering',
    'mob-hunting': '\uD83D\uDC09 Mob Hunting',
    rallying: '\uD83D\uDEA8 Rallying',
    scouting: '\uD83D\uDD0D Scouting',
    attacking: '\u2694\uFE0F Attacking',
    other: '\u2753 Other',
  };

  function activityLabel(type) {
    return ACTIVITY_LABELS[type] || type;
  }

  // ── Mob Type Label ─────────────────────────────────────────

  const MOB_LABELS = {
    dragon: '\uD83D\uDC09 Dragon',
    gryphon: '\uD83E\uDD85 Gryphon',
    goblin: '\uD83D\uDC7A Goblin',
    troll: '\uD83E\uDDCC Troll',
    hydra: '\uD83D\uDC0D Hydra',
    other: '\u2753 Other',
  };

  function mobTypeLabel(type) {
    return MOB_LABELS[type] || type || 'N/A';
  }

  // ── Delete Button ──────────────────────────────────────────

  function deleteButton(category, recordId) {
    return `<button class="btn-icon delete-btn"
              data-category="${_escapeHtml(category)}"
              data-id="${_escapeHtml(recordId)}"
              aria-label="Delete this entry"
              title="Delete entry">
              \uD83D\uDDD1\uFE0F
            </button>`;
  }

  // ── XSS prevention ─────────────────────────────────────────

  function _escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // Make escape available to other modules
  function escapeHtml(str) {
    return _escapeHtml(str);
  }

  return {
    initTabs,
    toast,
    confirm,
    renderTable,
    filterRecords,
    levelBadge,
    resourceLabel,
    activityLabel,
    mobTypeLabel,
    deleteButton,
    escapeHtml,
  };
})();
