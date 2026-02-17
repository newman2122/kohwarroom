# ⚔️ KoH War Room — Enemy Activity Tracker

A tactical intelligence dashboard for **Kingdoms of Heckfire** clans at war.
Track enemy activity, gather node usage, mob hunting patterns, and more — all
with full timezone support and complete anonymity.

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| **📊 Dashboard** | Real-time stats, 24-hour activity heatmap, and live feed |
| **🔍 Activity Log** | Track when enemies come online, rally, scout, attack |
| **⛏️ Gather Tracker** | Log enemy gather nodes (Levels 15–21) with resource type & coords |
| **🐉 Mob Hit Tracker** | Track mob hits with level, type, and coordinates |
| **📡 Intel Summary** | Auto-generated intelligence: most active enemies, peak hours, preferred levels |
| **⚙️ Settings** | Set up your in-game username, change it anytime, track name history |
| **🌍 Timezone Smart** | Each user selects their timezone; all times auto-convert for every viewer |
| **🔒 Anonymous** | No real names — only in-game usernames and enemy codenames |
| **📱 Responsive** | Works on desktop, tablet, and mobile |
| **♿ WCAG 2.2 AA** | Accessible — keyboard nav, screen readers, color contrast |

---

## 💰 100% FREE — No Money, No Downloads

This app is designed so **all 50 clan members** can use it without spending
a dime or installing anything:

- **🌐 GitHub Pages** = Free website hosting (just a URL)
- **🔥 Firebase Realtime Database** = Free shared backend (real-time sync)
- **📱 Works in any browser** = Phone, tablet, desktop — no app to install
- **🔓 No accounts required** = Clan members just visit the link and start tracking

---

## 📁 Project Structure

```
KOH tracker/
├── index.html              # Main HTML shell
├── css/
│   ├── theme.css           # Colors, variables, base reset
│   ├── layout.css          # Header, nav, grid, responsive
│   ├── components.css      # Cards, forms, tables, buttons
│   └── components-ext.css  # Badges, intel, toasts, welcome, settings
├── js/
│   ├── firebase-config.js  # Firebase setup (fill in your config)
│   ├── timezone.js         # Timezone conversion & clock
│   ├── storage.js          # Data persistence (Firebase + localStorage)
│   ├── ui.js               # Tabs, toasts, dialogs, table rendering
│   ├── dashboard.js        # Dashboard stats, heatmap, intel analytics
│   └── app.js              # Main entry — forms, welcome, settings
└── README.md
```

---

## 🚀 Setup Guide (Step by Step)

### Step 1: Test Locally

Double-click `index.html` in your browser. The app works immediately in
**local mode** (data saved to your browser only). Use this to explore
the features before sharing with your clan.

### Step 2: Create a Free Firebase Database

This is what lets all 50 clan members share the same data in real-time.

1. Go to **https://console.firebase.google.com** (sign in with any Google account)
2. Click **"Create a project"**
   - Name it anything (e.g., `koh-war-room`)
   - Skip Google Analytics — not needed
3. In the left sidebar, go to **Build > Realtime Database**
4. Click **"Create Database"**
   - Select your closest region
   - Choose **"Start in test mode"** (allows read/write)
5. Go to **Project Settings** (gear icon, top-left) > **General**
6. Scroll down to **"Your apps"** > click the **</>** (Web) icon
7. Register your app (any nickname), **skip Firebase Hosting**
8. You'll see a `firebaseConfig` object — **copy it**
9. Open `js/firebase-config.js` and **paste your config** into the
   `FIREBASE_CONFIG` object (uncomment the lines and fill in your values)
10. Save the file — done!

### Step 3: Host for Free on GitHub Pages

This gives your clan a URL they can bookmark on their phone.

1. Go to **https://github.com** and create a free account (if you don't have one)
2. Click **"New repository"**
   - Name it `koh-war-room` (or anything)
   - Set it to **Public**
   - Click **"Create repository"**
3. Click **"uploading an existing file"**
4. Drag & drop ALL the files from your `KOH tracker` folder
   (make sure to include the `css/` and `js/` subfolders!)
5. Click **"Commit changes"**
6. Go to **Settings > Pages** (in the repo)
7. Under **"Source"**, select **"main"** branch, then click **Save**
8. After a minute, your site will be live at:
   ```
   https://YOUR-USERNAME.github.io/koh-war-room/
   ```
9. **Share that URL with your clan!** 🎉

### Alternative: Use Netlify (even easier)

1. Go to **https://app.netlify.com**
2. Drag & drop your entire `KOH tracker` folder onto the page
3. It’s live instantly! You get a free URL like `random-name.netlify.app`
4. Share the URL with your clan — done!

---

## 🎮 First-Time User Experience

When a clan member visits the URL for the first time:

1. A **welcome screen** pops up asking for:
   - Their **in-game username** (not their real name)
   - Their **timezone**
2. They click **"Enter the War Room"** and they're in!
3. Their username is saved to their device (localStorage)
4. They can change it anytime in the **⚙️ Settings** tab
5. Name changes are tracked in a history log

---

## 🔒 Privacy & Anonymity

- **No real names** are stored anywhere
- Each clan member uses their **in-game username** (saved on their device only)
- Enemy players are tracked by **codenames/tags** you assign
- No accounts, no emails, no sign-ups for clan members
- Firebase data contains only game-related intel

---

## 🌍 Timezone Support

The tracker supports **40+ timezones** across all regions:
- Americas (ET, CT, MT, PT, AKT, HST, Brazil, Argentina, etc.)
- Europe (GMT, CET, EET, Moscow, etc.)
- Asia & Oceania (IST, SGT, JST, AEST, NZST, etc.)
- Africa & Middle East (CAT, EAT, AST, etc.)

All timestamps are:
1. **Stored in UTC** (universal)
2. **Displayed in each viewer's local timezone** automatically

---

## ♿ Accessibility (WCAG 2.2 Level AA)

- All color contrasts pass AA requirements (minimum 4.5:1 for text)
- Full keyboard navigation with visible focus indicators
- ARIA labels, roles, and live regions
- Skip-to-content link
- Screen reader friendly tables and forms
- Semantic HTML throughout

---

## 🛠️ Customization

### Adding mob types
Edit the `<select>` in `index.html` (id: `mob-type`) and the `MOB_LABELS`
object in `js/ui.js`.

### Changing gather node levels
Edit the `<select>` in `index.html` (id: `gath-node-level`) and update
the level range in `js/dashboard.js` (`renderGatherLevels`).

### Theming
All colors are CSS custom properties in `css/theme.css`. Change them to
match your clan's colors!

---

## 💸 Cost Summary

| Service | Cost | Limits |
|---------|------|--------|
| Firebase Realtime DB | **$0** | 1 GB storage, 10 GB/month transfer |
| GitHub Pages | **$0** | Unlimited for public repos |
| Netlify (alternative) | **$0** | 100 GB/month bandwidth |
| Clan members | **$0** | Just need a web browser |
| **Total** | **$0** | More than enough for 50 users |

---

Built with ❤️ for the war effort. May your rallies hit hard and your shields
never drop. ⚔️🐉🔥
