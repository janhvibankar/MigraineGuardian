# Deploying MigraineGuardian Frontend to Firebase Hosting

This deployment hosts the React + Vite frontend directly on **Firebase Hosting** (`https://migraineguardian.web.app` and `https://migraineguardian.firebaseapp.com`).
Because the application and the Firebase Auth handler (`/__/auth/*`) share the same origin, mobile browsers (iOS Safari, Android Chrome) can perform Google sign-in without cross-site storage / third-party cookie restrictions.

---

## 1. Prerequisites

1. Ensure the Firebase CLI is installed:
   ```bash
   npm install -g firebase-tools
   ```
2. Log in to Firebase:
   ```bash
   firebase login
   ```

---

## 2. Prepare Environment & Build

1. Copy production env template and populate your Firebase client keys:
   ```bash
   cd frontend
   cp .env.production.example .env.production
   ```
2. Fill in your `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, and `VITE_FIREBASE_APP_ID` in `frontend/.env.production`.
3. Build the production bundle:
   ```bash
   npm run build
   ```
   *(This outputs the compiled SPA assets into `frontend/dist`)*

---

## 3. Deploy to Firebase Hosting

From the root project folder:
```bash
firebase deploy --only hosting
```

Your app will be live at:
- `https://migraineguardian.web.app`
- `https://migraineguardian.firebaseapp.com`

---

## 4. Verify External Settings

1. **Google Cloud Console &rarr; APIs & Services &rarr; Credentials &rarr; OAuth 2.0 Client IDs (Web Client)**:
   - Ensure `https://migraineguardian.web.app` is in **Authorized JavaScript origins**.
   - Ensure `https://migraineguardian.firebaseapp.com` is in **Authorized JavaScript origins**.
2. **Firebase Console &rarr; Authentication &rarr; Settings &rarr; Authorized domains**:
   - `migraineguardian.web.app` (added automatically by Firebase).
   - `migraineguardian.firebaseapp.com` (added automatically by Firebase).
   - `migraineguardian-frontend.onrender.com` (kept for Render deployment).
3. **Render Backend**:
   - Redeploy the backend so the updated CORS origins take effect.
