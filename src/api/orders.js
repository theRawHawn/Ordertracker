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