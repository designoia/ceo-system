/**
 * CEO OS — Background Sync Trigger
 *
 * Calls the CEO OS /api/cron/google-sync endpoint on a schedule, using
 * Google Apps Script's time-driven triggers. This exists because Vercel's
 * free (Hobby) plan only allows cron jobs to run once per day — Apps
 * Script triggers have no such limit and can run every 5-10 minutes.
 *
 * SETUP:
 * 1. Go to https://script.google.com -> New project.
 * 2. Delete the placeholder code and paste this whole file in.
 * 3. Fill in CEO_OS_URL and CRON_SECRET below (same CRON_SECRET you set
 *    in Vercel's environment variables).
 * 4. Run the `syncCeoOs` function once manually (Run button) to grant
 *    permissions — it only needs "Connect to external service", nothing
 *    about your Google account's data (the actual Google Tasks/Calendar
 *    access happens entirely inside the CEO OS server using your saved
 *    OAuth token, not through this script).
 * 5. Click the clock icon (Triggers) in the left sidebar -> Add Trigger:
 *    - Function: syncCeoOs
 *    - Event source: Time-driven
 *    - Type: Minutes timer -> Every 5 minutes (or 10/15, your choice)
 * 6. Save. It now runs in the background on Google's infrastructure,
 *    independent of whether your browser or the Vercel app is open.
 */

const CEO_OS_URL = 'https://ceo-system-zeta.vercel.app/api/cron/google-sync';
const CRON_SECRET = 'PASTE_YOUR_CRON_SECRET_HERE';

function syncCeoOs() {
  const response = UrlFetchApp.fetch(CEO_OS_URL, {
    method: 'get',
    headers: {
      Authorization: 'Bearer ' + CRON_SECRET,
    },
    muteHttpExceptions: true,
  });

  const status = response.getResponseCode();
  const body = response.getContentText();

  if (status !== 200) {
    console.error('CEO OS sync failed [' + status + ']: ' + body);
  } else {
    console.log('CEO OS sync OK: ' + body);
  }
}
