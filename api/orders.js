import { google } from 'googleapis';

const HEADERS = [
  'ID',
  'Quote Number',
  'Vendor Name',
  'Quote Date',
  'Expiry Date',
  'Amount (INR)',
  'Status',
  'Bank Name',
  'Account Name',
  'Account Number',
  'IFSC Code',
  'Drive Link',
  'Created At',
];

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!clientEmail || !privateKey || !spreadsheetId) {
    if (req.method === 'GET') {
      return res.status(200).json({
        configured: false,
        message: 'Vercel environment variables GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, or GOOGLE_SHEET_ID missing.',
      });
    }
    return res.status(400).json({
      configured: false,
      error: 'Vercel environment variables GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, or GOOGLE_SHEET_ID missing.',
    });
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive',
      ],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    if (req.method === 'GET') {
      // Fetch orders from Google Sheet
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Orders!A2:M',
      });

      const rows = response.data.values || [];
      const orders = rows.map((row) => {
        const [
          id,
          quoteNumber,
          vendorName,
          quoteDate,
          expiryDate,
          amountStr,
          status,
          bankName,
          accountName,
          accountNumber,
          ifscCode,
          driveQuoteLink,
          createdAt,
        ] = row;

        return {
          id: id || quoteNumber || `QT-${Date.now()}`,
          quoteNumber: quoteNumber || id || '',
          vendorName: vendorName || 'Unknown Vendor',
          quoteDate: quoteDate || new Date().toISOString().slice(0, 10),
          expiryDate: expiryDate || undefined,
          amount: parseFloat(amountStr) || 0,
          status: status || 'Pending',
          bankDetails: {
            bankName: bankName || '',
            accountName: accountName || vendorName || '',
            accountNumber: accountNumber || '',
            ifscCode: ifscCode || '',
          },
          driveQuoteLink: driveQuoteLink || '',
          createdAt: createdAt || new Date().toISOString(),
          deliveryLogs: [
            {
              id: `log-${Date.now()}`,
              timestamp: new Date().toISOString(),
              note: 'Loaded via Vercel Google API Backend',
              updatedBy: 'Google Sheets API',
            },
          ],
        };
      });

      return res.status(200).json({ configured: true, orders, rawRowsCount: rows.length });
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      const { action, orders } = req.body || {};

      let listToSave = [];
      if (action === 'saveAll' || Array.isArray(orders)) {
        listToSave = Array.isArray(orders) ? orders : req.body.orders || [];
      } else if (req.body && typeof req.body === 'object') {
        listToSave = [req.body];
      }

      const rows = [HEADERS];
      listToSave.forEach((o) => {
        rows.push([
          o.id || o.quoteNumber || '',
          o.quoteNumber || o.id || '',
          o.vendorName || '',
          o.quoteDate || '',
          o.expiryDate || '',
          o.amount || 0,
          o.status || 'Pending',
          o.bankDetails?.bankName || '',
          o.bankDetails?.accountName || '',
          o.bankDetails?.accountNumber || '',
          o.bankDetails?.ifscCode || '',
          o.driveQuoteLink || '',
          o.createdAt || new Date().toISOString(),
        ]);
      });

      // Clear range first
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: 'Orders!A1:M1000',
      });

      // Write new data
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Orders!A1:M${rows.length}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          range: `Orders!A1:M${rows.length}`,
          majorDimension: 'ROWS',
          values: rows,
        },
      });

      return res.status(200).json({ success: true, count: listToSave.length });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Google API Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
