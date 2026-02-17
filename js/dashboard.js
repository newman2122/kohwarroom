/* ============================================
   KoH War Room - Dashboard & Intel
   Heatmap, stats, intel summary, profiles.
   ============================================ */

const Dashboard = (() => {
  'use strict';

  // ── Stats Cards ────────────────────────────────────────────

  async function updateStats() {
    const [activities, gathers, mobs] = await Promise.all([
      StorageManager.getAll('activities'),
      StorageManager.getAll('gatherNodes'),
      StorageManager.getAll('mobHits'),
    ]);

    const allRecords = [...activities, ...gathers, ...mobs];
    const uniqueEnemies = new Set(allRecords.map((r) => r.enemyTag?.toLowerCase())).size;

    _setText('stat-total-sightings', allRecords.length);
    _setText('stat-active-enemies', uniqueEnemies);
    _setText('stat-gather-reports', gathers.length);
    _setText('stat-mob-reports', mobs.length);
  }

  // ── Activity Heatmap ───────────────────────────────────────

  async function renderHeatmap() {
    const container = document.getElementById('activity-heatmap');
    if (!container) return;

    const [activities, gathers, mobs] = await Promise.all([
      StorageManager.getAll('activities'),
      StorageManager.getAll('gatherNodes'),
      StorageManager.getAll('mobHits'),
    ]);

    const allRecords = [...activities, ...gathers, ...mobs];

    // Count activity per hour (0-23) in viewer's timezone
    const hourCounts = new Array(24).fill(0);
    allRecords.forEach((r) => {
      if (r.utcTime) {
        const hour = TimezoneManager.getViewerHour(r.utcTime);
        if (hour >= 0 && hour < 24) hourCounts[hour]++;
      }
    });

    const maxCount = Math.max(...hourCounts, 1);

    container.innerHTML = '';

    const HEAT_COLORS = [
      'var(--heat-0)',
      'var(--heat-1)',
      'var(--heat-2)',
      'var(--heat-3)',
      'var(--heat-4)',
      'var(--heat-5)',
    ];

    for (let h = 0; h < 24; h++) {
      const intensity = Math.ceil((hourCounts[h] / maxCount) * 5);
      const color = HEAT_COLORS[intensity] || HEAT_COLORS[0];
      const label = `${h.toString().padStart(2, '0')}:00`;
      const shortLabel = h % 3 === 0 ? `${h}h` : '';

      const cell = document.createElement('div');
      cell.className = 'heatmap-cell';
      cell.style.backgroundColor = color;
      cell.setAttribute('title', `${label}: ${hourCounts[h]} sighting(s)`);
      cell.setAttribute('aria-label', `${label}: ${hourCounts[h]} sightings`);
      cell.textContent = hourCounts[h] || '';
      container.appendChild(cell);
    }

    // Add hour labels row
    const labelsDiv = document.createElement('div');
    labelsDiv.style.cssText =
      'display:grid;grid-template-columns:repeat(24,1fr);gap:3px;margin-top:4px;';
    for (let h = 0; h < 24; h++) {
      const lbl = document.createElement('div');
      lbl.className = 'heatmap-label';
      lbl.textContent = h % 3 === 0 ? `${h}h` : '';
      labelsDiv.appendChild(lbl);
    }
    container.parentElement.appendChild(labelsDiv);
  }

  // ── Recent Feed ────────────────────────────────────────────

  async function renderRecentFeed() {
    const feed = document.getElementById('recent-feed');
    if (!feed) return;

    const [activities, gathers, mobs] = await Promise.all([
      StorageManager.getAll('activities'),
      StorageManager.getAll('gatherNodes'),
      StorageManager.getAll('mobHits'),
    ]);

    // Merge and sort by time, newest first
    const all = [
      ...activities.map((r) => ({ ...r, _type: 'activity', _cat: r.activityType })),
      ...gathers.map((r) => ({ ...r, _type: 'gather', _cat: 'gathering' })),
      ...mobs.map((r) => ({ ...r, _type: 'mob', _cat: 'mob-hunting' })),
    ].sort((a, b) => new Date(b.utcTime) - new Date(a.utcTime));

    const recent = all.slice(0, 20);

    if (recent.length === 0) {
      feed.innerHTML = '<p class="empty-state">No activity logged yet. Start tracking!</p>';
      return;
    }

    feed.innerHTML = recent
      .map((r) => {
        const time = TimezoneManager.utcToViewerTime(r.utcTime);
        const tag = UI.escapeHtml(r.enemyTag || '???');
        let detail = '';

        if (r._type === 'activity') {
          detail = UI.activityLabel(r.activityType);
        } else if (r._type === 'gather') {
          detail = `Gathering on Lv.${UI.escapeHtml(String(r.nodeLevel))} node`;
        } else {
          detail = `Hit Lv.${UI.escapeHtml(String(r.mobLevel))} mob`;
        }

        return `
          <div class="feed-item type-${r._cat}">
            <span class="feed-time">${time}</span>
            <span class="feed-content">
              <span class="feed-tag">${tag}</span> &mdash; ${detail}
            </span>
          </div>
        `;
      })
      .join('');
  }

  // ── Intel: Most Active Enemies ──────────────────────────────

  async function renderMostActive() {
    const list = document.getElementById('intel-most-active');
    if (!list) return;

    const [activities, gathers, mobs] = await Promise.all([
      StorageManager.getAll('activities'),
      StorageManager.getAll('gatherNodes'),
      StorageManager.getAll('mobHits'),
    ]);

    const counts = {};
    [...activities, ...gathers, ...mobs].forEach((r) => {
      const tag = (r.enemyTag || '').toLowerCase();
      if (tag) counts[tag] = (counts[tag] || 0) + 1;
    });

    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (sorted.length === 0) {
      list.innerHTML = '<li class="empty-state">No data yet</li>';
      return;
    }

    list.innerHTML = sorted
      .map(
        ([tag, count]) =>
          `<li><span class="enemy-name">${UI.escapeHtml(tag)}</span><span class="count">${count} sightings</span></li>`
      )
      .join('');
  }

  // ── Intel: Peak Hours ──────────────────────────────────────

  async function renderPeakHours() {
    const container = document.getElementById('intel-peak-hours');
    if (!container) return;

    const [activities, gathers, mobs] = await Promise.all([
      StorageManager.getAll('activities'),
      StorageManager.getAll('gatherNodes'),
      StorageManager.getAll('mobHits'),
    ]);

    const hourCounts = new Array(24).fill(0);
    [...activities, ...gathers, ...mobs].forEach((r) => {
      if (r.utcTime) {
        const hour = TimezoneManager.getViewerHour(r.utcTime);
        if (hour >= 0 && hour < 24) hourCounts[hour]++;
      }
    });

    const maxCount = Math.max(...hourCounts, 1);

    // Show top 6 peak hours
    const peaks = hourCounts
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    if (peaks[0]?.count === 0) {
      container.innerHTML = '<p class="empty-state">No data yet</p>';
      return;
    }

    container.innerHTML = peaks
      .map(
        (p) => `
        <div class="peak-hour-item">
          <span class="peak-hour-time">${p.hour.toString().padStart(2, '0')}:00</span>
          <div class="peak-hour-bar">
            <div class="peak-hour-fill" style="width: ${(p.count / maxCount) * 100}%"></div>
          </div>
          <span style="font-family:var(--font-mono);color:var(--text-accent);min-width:40px;text-align:right;">${p.count}</span>
        </div>
      `
      )
      .join('');
  }

  // ── Intel: Gather Level Distribution ─────────────────────────

  async function renderGatherLevels() {
    const container = document.getElementById('intel-gather-levels');
    if (!container) return;

    const gathers = await StorageManager.getAll('gatherNodes');
    const levelCounts = {};
    for (let i = 15; i <= 21; i++) levelCounts[i] = 0;

    gathers.forEach((r) => {
      const lv = parseInt(r.nodeLevel, 10);
      if (lv >= 15 && lv <= 21) levelCounts[lv]++;
    });

    const maxCount = Math.max(...Object.values(levelCounts), 1);

    if (gathers.length === 0) {
      container.innerHTML = '<p class="empty-state">No data yet</p>';
      return;
    }

    const LEVEL_COLORS = {
      15: 'var(--level-15)', 16: 'var(--level-16)', 17: 'var(--level-17)',
      18: 'var(--level-18)', 19: 'var(--level-19)', 20: 'var(--level-20)',
      21: 'var(--level-21)',
    };

    container.innerHTML = Object.entries(levelCounts)
      .map(
        ([lv, count]) => `
        <div class="level-bar-row">
          <span class="level-bar-label">Lv.${lv}</span>
          <div class="level-bar-track">
            <div class="level-bar-fill" style="width: ${(count / maxCount) * 100}%; background: ${LEVEL_COLORS[lv]}"></div>
          </div>
          <span class="level-bar-count">${count}</span>
        </div>
      `
      )
      .join('');
  }

  // ── Intel: Mob Level Distribution ────────────────────────────

  async function renderMobLevels() {
    const container = document.getElementById('intel-mob-levels');
    if (!container) return;

    const mobs = await StorageManager.getAll('mobHits');
    const levelCounts = {};

    mobs.forEach((r) => {
      const lv = r.mobLevel?.toString();
      if (lv) levelCounts[lv] = (levelCounts[lv] || 0) + 1;
    });

    if (mobs.length === 0) {
      container.innerHTML = '<p class="empty-state">No data yet</p>';
      return;
    }

    const maxCount = Math.max(...Object.values(levelCounts), 1);
    const sorted = Object.entries(levelCounts).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));

    container.innerHTML = sorted
      .map(
        ([lv, count]) => `
        <div class="level-bar-row">
          <span class="level-bar-label">Lv.${UI.escapeHtml(lv)}</span>
          <div class="level-bar-track">
            <div class="level-bar-fill" style="width: ${(count / maxCount) * 100}%; background: var(--accent-orange)"></div>
          </div>
          <span class="level-bar-count">${count}</span>
        </div>
      `
      )
      .join('');
  }

  // ── Intel: Enemy Profiles ───────────────────────────────────

  async function populateEnemySelect() {
    const select = document.getElementById('profile-enemy-select');
    if (!select) return;

    const [activities, gathers, mobs] = await Promise.all([
      StorageManager.getAll('activities'),
      StorageManager.getAll('gatherNodes'),
      StorageManager.getAll('mobHits'),
    ]);

    const tags = new Set();
    [...activities, ...gathers, ...mobs].forEach((r) => {
      if (r.enemyTag) tags.add(r.enemyTag);
    });

    const sorted = [...tags].sort();
    select.innerHTML = '<option value="">\u2014 Select Enemy \u2014</option>';
    sorted.forEach((tag) => {
      const opt = document.createElement('option');
      opt.value = tag;
      opt.textContent = tag;
      select.appendChild(opt);
    });
  }

  async function renderEnemyProfile(tag) {
    const detail = document.getElementById('enemy-profile-detail');
    if (!detail || !tag) {
      if (detail) detail.innerHTML = '<p class="empty-state">Select an enemy tag above to view profile.</p>';
      return;
    }

    const [activities, gathers, mobs] = await Promise.all([
      StorageManager.getAll('activities'),
      StorageManager.getAll('gatherNodes'),
      StorageManager.getAll('mobHits'),
    ]);

    const tagLower = tag.toLowerCase();
    const myActivities = activities.filter((r) => r.enemyTag?.toLowerCase() === tagLower);
    const myGathers = gathers.filter((r) => r.enemyTag?.toLowerCase() === tagLower);
    const myMobs = mobs.filter((r) => r.enemyTag?.toLowerCase() === tagLower);
    const totalSightings = myActivities.length + myGathers.length + myMobs.length;

    // Find most common activity hour
    const hourCounts = new Array(24).fill(0);
    [...myActivities, ...myGathers, ...myMobs].forEach((r) => {
      if (r.utcTime) {
        const hour = TimezoneManager.getViewerHour(r.utcTime);
        if (hour >= 0 && hour < 24) hourCounts[hour]++;
      }
    });
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

    // Most common gather level
    const gatherLevels = {};
    myGathers.forEach((r) => {
      const lv = r.nodeLevel;
      if (lv) gatherLevels[lv] = (gatherLevels[lv] || 0) + 1;
    });
    const topGatherLv = Object.entries(gatherLevels).sort((a, b) => b[1] - a[1])[0];

    // Most common mob level
    const mobLevels = {};
    myMobs.forEach((r) => {
      const lv = r.mobLevel;
      if (lv) mobLevels[lv] = (mobLevels[lv] || 0) + 1;
    });
    const topMobLv = Object.entries(mobLevels).sort((a, b) => b[1] - a[1])[0];

    detail.innerHTML = `
      <h4 style="font-family:var(--font-display);color:var(--text-warning);margin-bottom:var(--sp-md);">
        ${UI.escapeHtml(tag)}
      </h4>
      <div class="profile-stat-grid">
        <div class="profile-stat">
          <div class="val">${totalSightings}</div>
          <div class="lbl">Total Sightings</div>
        </div>
        <div class="profile-stat">
          <div class="val">${myActivities.length}</div>
          <div class="lbl">Activity Logs</div>
        </div>
        <div class="profile-stat">
          <div class="val">${myGathers.length}</div>
          <div class="lbl">Gather Sightings</div>
        </div>
        <div class="profile-stat">
          <div class="val">${myMobs.length}</div>
          <div class="lbl">Mob Hits</div>
        </div>
        <div class="profile-stat">
          <div class="val">${peakHour.toString().padStart(2, '0')}:00</div>
          <div class="lbl">Peak Hour (Your TZ)</div>
        </div>
        <div class="profile-stat">
          <div class="val">${topGatherLv ? 'Lv.' + topGatherLv[0] : 'N/A'}</div>
          <div class="lbl">Fav Gather Level</div>
        </div>
        <div class="profile-stat">
          <div class="val">${topMobLv ? 'Lv.' + topMobLv[0] : 'N/A'}</div>
          <div class="lbl">Fav Mob Level</div>
        </div>
      </div>
    `;
  }

  // ── Refresh All Dashboard Components ─────────────────────────

  async function refreshAll() {
    await Promise.all([
      updateStats(),
      renderHeatmap(),
      renderRecentFeed(),
      renderMostActive(),
      renderPeakHours(),
      renderGatherLevels(),
      renderMobLevels(),
      populateEnemySelect(),
    ]);
  }

  // ── Helper ────────────────────────────────────────────────

  function _setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  return {
    updateStats,
    renderHeatmap,
    renderRecentFeed,
    renderMostActive,
    renderPeakHours,
    renderGatherLevels,
    renderMobLevels,
    populateEnemySelect,
    renderEnemyProfile,
    refreshAll,
  };
})();
