/* ============================================
   KoH War Room - Firebase Configuration
   
   FREE SETUP INSTRUCTIONS:
   1. Go to https://console.firebase.google.com
   2. Click "Create a project" (name it anything, e.g. "koh-war-room")
   3. Skip Google Analytics (not needed)
   4. Go to Build > Realtime Database > Create Database
   5. Choose your region, then select "Start in TEST mode"
   6. Go to Project Settings (gear icon) > General
   7. Scroll down to "Your apps" > click the </> (Web) icon
   8. Register your app (any nickname), skip hosting
   9. Copy the firebaseConfig object and paste it below
   10. Done! Share the URL with your clan.

   SECURITY (do this after testing):
   Go to Realtime Database > Rules and set:
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   This lets anyone with the link read/write.
   Since no real names are stored, this is fine for your use case.
   ============================================ */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBgX-BeqScqLcrlSeUJIIYAp58mWgwK1PM",
  authDomain: "koh-war-room.firebaseapp.com",
  databaseURL: "https://koh-war-room-default-rtdb.firebaseio.com",
  projectId: "koh-war-room",
  storageBucket: "koh-war-room.firebasestorage.app",
  messagingSenderId: "823820874515",
  appId: "1:823820874515:web:a69c27f29a93185e6660e6"
};

// Auto-detect: if config is filled in, use Firebase; otherwise localStorage
const FIREBASE_ENABLED = Boolean(FIREBASE_CONFIG.apiKey);

if (FIREBASE_ENABLED) {
  firebase.initializeApp(FIREBASE_CONFIG);
  console.log('[KoH War Room] 🔥 Firebase connected — data syncs across all clan members!');
} else {
  console.log('[KoH War Room] 💾 Running in local mode — data saved to this browser only.');
  console.log('[KoH War Room] ℹ️  To enable sharing, set up Firebase (free!) — see js/firebase-config.js');
}
