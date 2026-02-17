/* ============================================
   KoH War Room - Timezone Utilities
   Handles timezone conversion, clock display,
   and timezone-aware data storage.
   ============================================ */

const TimezoneManager = (() => {
  'use strict';

  // Common timezones grouped by region (covers worldwide players)
  const TIMEZONE_GROUPS = {
    'Americas': [
      { value: 'America/New_York', label: 'Eastern (ET) — New York' },
      { value: 'America/Chicago', label: 'Central (CT) — Chicago' },
      { value: 'America/Denver', label: 'Mountain (MT) — Denver' },
      { value: 'America/Los_Angeles', label: 'Pacific (PT) — Los Angeles' },
      { value: 'America/Anchorage', label: 'Alaska (AKT)' },
      { value: 'Pacific/Honolulu', label: 'Hawaii (HST)' },
      { value: 'America/Sao_Paulo', label: 'Brazil — São Paulo' },
      { value: 'America/Argentina/Buenos_Aires', label: 'Argentina — Buenos Aires' },
      { value: 'America/Mexico_City', label: 'Mexico City' },
      { value: 'America/Bogota', label: 'Colombia — Bogotá' },
      { value: 'America/Toronto', label: 'Canada — Toronto' },
      { value: 'America/Vancouver', label: 'Canada — Vancouver' },
    ],
    'Europe': [
      { value: 'Europe/London', label: 'UK — London (GMT/BST)' },
      { value: 'Europe/Paris', label: 'Central Europe — Paris' },
      { value: 'Europe/Berlin', label: 'Central Europe — Berlin' },
      { value: 'Europe/Moscow', label: 'Russia — Moscow' },
      { value: 'Europe/Istanbul', label: 'Turkey — Istanbul' },
      { value: 'Europe/Athens', label: 'Greece — Athens' },
      { value: 'Europe/Helsinki', label: 'Finland — Helsinki' },
      { value: 'Europe/Madrid', label: 'Spain — Madrid' },
      { value: 'Europe/Rome', label: 'Italy — Rome' },
      { value: 'Europe/Warsaw', label: 'Poland — Warsaw' },
    ],
    'Asia & Oceania': [
      { value: 'Asia/Dubai', label: 'UAE — Dubai (GST)' },
      { value: 'Asia/Kolkata', label: 'India — Kolkata (IST)' },
      { value: 'Asia/Bangkok', label: 'Thailand — Bangkok' },
      { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
      { value: 'Asia/Shanghai', label: 'China — Shanghai' },
      { value: 'Asia/Tokyo', label: 'Japan — Tokyo (JST)' },
      { value: 'Asia/Seoul', label: 'South Korea — Seoul' },
      { value: 'Asia/Jakarta', label: 'Indonesia — Jakarta' },
      { value: 'Asia/Manila', label: 'Philippines — Manila' },
      { value: 'Australia/Sydney', label: 'Australia — Sydney' },
      { value: 'Australia/Perth', label: 'Australia — Perth' },
      { value: 'Pacific/Auckland', label: 'New Zealand — Auckland' },
    ],
    'Africa & Middle East': [
      { value: 'Africa/Cairo', label: 'Egypt — Cairo' },
      { value: 'Africa/Lagos', label: 'Nigeria — Lagos' },
      { value: 'Africa/Johannesburg', label: 'South Africa — Johannesburg' },
      { value: 'Africa/Nairobi', label: 'Kenya — Nairobi' },
      { value: 'Asia/Riyadh', label: 'Saudi Arabia — Riyadh' },
      { value: 'Asia/Tehran', label: 'Iran — Tehran' },
    ],
  };

  let _viewerTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  let _clockInterval = null;

  /** Populate the timezone <select> with optgroups */
  function populateSelect(selectEl) {
    selectEl.innerHTML = '';

    for (const [group, zones] of Object.entries(TIMEZONE_GROUPS)) {
      const optgroup = document.createElement('optgroup');
      optgroup.label = group;

      for (const tz of zones) {
        const option = document.createElement('option');
        option.value = tz.value;
        option.textContent = tz.label;
        if (tz.value === _viewerTimezone) option.selected = true;
        optgroup.appendChild(option);
      }

      selectEl.appendChild(optgroup);
    }
  }

  /** Get the viewer's selected timezone */
  function getViewerTimezone() {
    return _viewerTimezone;
  }

  /** Set the viewer's timezone */
  function setViewerTimezone(tz) {
    _viewerTimezone = tz;
    localStorage.setItem('koh_viewer_tz', tz);
  }

  /** Load saved timezone from localStorage */
  function loadSavedTimezone() {
    const saved = localStorage.getItem('koh_viewer_tz');
    if (saved) _viewerTimezone = saved;
  }

  /**
   * Convert a datetime-local input value (string) + reporter's timezone
   * into a UTC ISO string for storage.
   *
   * @param {string} localTimeStr - e.g. "2025-01-15T14:30"
   * @param {string} fromTimezone - IANA timezone of the reporter
   * @returns {string} UTC ISO string
   */
  function localToUTC(localTimeStr, fromTimezone) {
    // Create a date object interpreted in the reporter's timezone
    const date = new Date(
      new Date(localTimeStr).toLocaleString('en-US', { timeZone: fromTimezone })
    );
    // This approach can be imprecise; use a more robust method:
    // Parse the local time parts and construct UTC offset
    const parts = localTimeStr.split(/[-T:]/);
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const hour = parseInt(parts[3], 10);
    const minute = parseInt(parts[4], 10);

    // Use Intl to figure out offset for that timezone at that time
    const tempDate = new Date(Date.UTC(year, month, day, hour, minute));
    const utcStr = tempDate.toLocaleString('en-US', { timeZone: 'UTC' });
    const tzStr = tempDate.toLocaleString('en-US', { timeZone: fromTimezone });

    const utcDate = new Date(utcStr);
    const tzDate = new Date(tzStr);
    const offsetMs = tzDate - utcDate;

    // The actual UTC time is: local time - offset
    const actualUTC = new Date(tempDate.getTime() - offsetMs);
    return actualUTC.toISOString();
  }

  /**
   * Convert a UTC ISO string to a formatted local time string
   * in the viewer's timezone.
   *
   * @param {string} utcISOStr - UTC ISO timestamp
   * @param {object} [options] - Intl.DateTimeFormat options override
   * @returns {string} Formatted local time
   */
  function utcToViewerLocal(utcISOStr, options) {
    const date = new Date(utcISOStr);
    const defaults = {
      timeZone: _viewerTimezone,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    };
    return date.toLocaleString('en-US', options || defaults);
  }

  /**
   * Get just the time portion for feed display
   */
  function utcToViewerTime(utcISOStr) {
    const date = new Date(utcISOStr);
    return date.toLocaleString('en-US', {
      timeZone: _viewerTimezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }

  /**
   * Get the hour (0-23) in the viewer's timezone for a UTC timestamp.
   * Used for heatmap.
   */
  function getViewerHour(utcISOStr) {
    const date = new Date(utcISOStr);
    const hourStr = date.toLocaleString('en-US', {
      timeZone: _viewerTimezone,
      hour: 'numeric',
      hour12: false,
    });
    return parseInt(hourStr, 10);
  }

  /** Start the live clock display */
  function startClock(clockEl) {
    const update = () => {
      const now = new Date();
      clockEl.textContent = now.toLocaleString('en-US', {
        timeZone: _viewerTimezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    };
    update();
    _clockInterval = setInterval(update, 1000);
  }

  /** Set default datetime-local value to "now" in viewer's TZ */
  function setDefaultDatetime(inputEl) {
    const now = new Date();
    const local = new Date(
      now.toLocaleString('en-US', { timeZone: _viewerTimezone })
    );
    const pad = (n) => String(n).padStart(2, '0');
    const val =
      `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}` +
      `T${pad(local.getHours())}:${pad(local.getMinutes())}`;
    inputEl.value = val;
  }

  return {
    TIMEZONE_GROUPS,
    populateSelect,
    getViewerTimezone,
    setViewerTimezone,
    loadSavedTimezone,
    localToUTC,
    utcToViewerLocal,
    utcToViewerTime,
    getViewerHour,
    startClock,
    setDefaultDatetime,
  };
})();
