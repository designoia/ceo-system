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

## 🌐 Supabase & Cloud Deployment (₹0/Month)

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a free project.
2. Open the **SQL Editor** in your Supabase dashboard.
3. Copy the entire contents of [`supabase/schema.sql`](file:///c:/Users/Mohit/Downloads/CEO-SYSTEM/supabase/schema.sql) and click **Run**.

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 3: Deploy to Vercel
1. Push your repository to GitHub.
2. Go to [vercel.com](https://vercel.com) and import your GitHub repository.
3. Under **Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Click **Deploy**.

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
