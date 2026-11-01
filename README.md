# CEO OS — "5-Year Plan → Today's Action"

> Personal 5-year execution operating system designed to help one founder turn a 5-year vision into one clear action at a time, without creating another complicated system to maintain.

---

## ⚡ Core Philosophy
- **LESS PLANNING. LESS DATA ENTRY. MORE EXECUTION.**
- **ONE IMPORTANT ACTION AT A TIME.**
- Designed around the user's real schedule: ~45 minutes of laser-focused business building at 11:15 PM every night.
- Includes **10-Minute Rescue Mode** for low-energy days.
- **No-Guilt Resume** if absent for days or weeks.

---

## 🛠️ Tech Stack & ₹0/Month Architecture
- **Frontend**: Next.js 14+ (App Router), React 18/19, TypeScript, Tailwind CSS, Lucide React icons.
- **Backend / Database**: Supabase PostgreSQL with Row Level Security (RLS).
- **Offline / Local First**: Complete client-side storage persistence engine fallback. Works out of the box without requiring external credentials.
- **PWA**: Installable on Windows Desktop (Chrome/Edge), Android, and iOS.

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔄 Sync across your phone and laptop (free, ~10 minutes)

CEO OS works fully offline on each device. To share the same tasks, goals, projects, calendars and schedule between devices, turn on sync once:

1. **Create a free project** at [supabase.com](https://supabase.com).
2. **Create the sync table.** In Supabase open **SQL Editor**, paste the contents of [`supabase/migrations/20261101_user_sync.sql`](supabase/migrations/20261101_user_sync.sql) and press **Run**. (Every user can only ever see their own rows.)
3. **Let yourself sign up without email confirmation** (easiest for one person): **Authentication → Providers → Email → turn OFF “Confirm email”**.
4. **Copy your keys:** **Project Settings → API** → copy the *Project URL* and the *anon public* key.
5. **Add them to Vercel:** your project → **Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` = the Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = the anon public key

   Then **redeploy** (Deployments → ⋯ → Redeploy). For local use, put the same two lines in `.env.local`.
6. **Sign in on each device:** open **Settings → Sync across devices**, create an account (first device) and sign in with the same email and password on the others.

How it behaves:
- Each task/goal/project/calendar/block syncs on its own; if the same item is edited on two devices, the **latest edit wins**.
- Anything already on a device when you first sign in is kept and merged with the cloud copy.
- Changes appear on the other device within a few seconds (or when you switch back to the app). Offline edits sync when you reconnect.
- **Safety net:** if a device suddenly looks almost empty (for example you cleared browser data), sync pauses and asks whether to *Restore from cloud* instead of deleting everything everywhere. “Clean Start” in Settings is treated as intentional and deletes on all devices.
- Not synced (stay per-device): app settings, activity history, Google integration state.

---

## 🚀 Deploy to Vercel

1. Push your repository to GitHub.
2. Import it at [vercel.com](https://vercel.com).
3. Add the two `NEXT_PUBLIC_SUPABASE_*` variables above if you want sync, then **Deploy**.

---

## 📱 PWA Installation Instructions

### Windows Desktop (Chrome / Edge)
1. Open the deployed web app or `http://localhost:3000`.
2. Look at the right side of the address bar and click the **Install App** icon (or go to browser menu `...` → **Install CEO OS**).
3. The app now opens in its own clean window without browser tabs and pins to your Taskbar.

### Android (Chrome)
1. Open the web app in Chrome.
2. Tap the menu icon `⋮` in the top right.
3. Tap **Add to Home screen** (or **Install App**).

### iPhone & iPad (Safari)
1. Open the web app in Safari.
2. Tap the **Share** button (box with upward arrow).
3. Tap **Add to Home Screen**.

---

## 📊 Data Ownership & Freedom
- Export your full workspace anytime as **JSON** or **CSV** via **Settings → Data Ownership & Backup**.
- Import previous backups seamlessly with zero vendor lock-in.
