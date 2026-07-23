# Vercel Environment Variables & Backend Integration Guide

This guide explains how to connect **Google Sheets** and **Google Drive** to your Order Tracker application using Vercel Serverless Functions and Vercel Environment Variables.

---

## 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., `OrderTracker-Vercel`).
3. Enable the following APIs in **APIs & Services**:
   - **Google Sheets API**
   - **Google Drive API**
4. Go to **APIs & Services > Credentials** and click **Create Credentials > Service Account**.
5. Name it `ordertracker-service-account`, grant it **Editor** role, and click **Create**.
6. Under the **Keys** tab for this service account, click **Add Key > Create New Key > JSON**.
7. Download the JSON key file.

---

## 2. Google Sheet & Drive Permissions

1. Open your Google Sheet in your browser.
2. Share the Google Sheet with the `client_email` address from your Service Account JSON file (e.g., `ordertracker-service-account@your-project.iam.gserviceaccount.com`), giving it **Editor** permissions.
3. Note your **Spreadsheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/YOUR_SPREADSHEET_ID/edit`
4. (Optional) For Google Drive upload, create a folder in Google Drive and share it with the same service account email.

---

## 3. Set Up Environment Variables in Vercel

1. Go to your project on the [Vercel Dashboard](https://vercel.com/dashboard).
2. Navigate to **Settings > Environment Variables**.
3. Add the following variables:

| Variable Name | Value Description |
| text | text |
| `GOOGLE_SHEET_ID` | Your Google Sheet ID from step 2 |
| `GOOGLE_DRIVE_FOLDER_ID` | (Optional) Google Drive Folder ID for quotes |
| `GOOGLE_CLIENT_EMAIL` | Service account email (`client_email` in JSON) |
| `GOOGLE_PRIVATE_KEY` | Private key (`private_key` in JSON, replace `\n` with actual line breaks or leave formatted string) |

---

## 4. Vercel Serverless Function Example (`/api/orders.js`)

Create an `/api/orders.js` route in your project to securely proxy Google Sheets requests server-side without exposing secrets to the frontend:

```javascript
import { google } from 'googleapis';

export default async function handler(req, res) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (req.method === 'GET') {
      // Fetch orders from Google Sheet
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Orders!A2:Z',
      });
      return res.status(200).json({ data: response.data.values || [] });
    }

    if (req.method === 'POST') {
      // Append order to Google Sheet
      const newOrderRow = req.body;
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Orders!A2',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [newOrderRow] },
      });
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Google API Error:', error);
    res.status(500).json({ error: error.message });
  }
}
```

---

## Summary
- All frontend Google Sheet popup modals and pre-filled frontend tokens have been removed from the application UI.
- All operations are now clean and local by default, ready to sync with your custom Vercel backend `/api/orders` endpoints.
