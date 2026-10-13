# Football 7-a-side Mock Dashboard for Google Apps Script

## What this contains
- `Code.gs` creates six mock-data tabs in a bound Google Sheet and exposes the dashboard as a Web App through `doGet()`.
- `Index.html` is the responsive Web App interface. It reads the current Google Sheet values through `google.script.run`; it keeps local fallback data when opened directly in a browser.

## Deploy as a Google Apps Script Web App
1. Create a blank Google Sheet and open **Extensions > Apps Script**.
2. Create or replace two project files: `Code.gs` and `Index.html`, using the files in this folder.
3. In Apps Script, run `setupFootball7DatasetAndDashboard` once and approve its requested permissions. This creates the six tabs and saves that Sheet ID for the Web App.
4. Select **Deploy > New deployment > Web app**.
5. Choose the appropriate execution identity and viewer access for your organization, then deploy.
6. Open the deployment URL. Editing values in the five source-data tabs is reflected on refresh.

## Data workflow
`ผลงานย้อนหลัง` + `สมรรถภาพ` + `ผลการแข่งขัน` + `เป้าหมายและแผนพัฒนา` -> Web App dashboard.

All team and athlete records are mock data for demonstration only.
