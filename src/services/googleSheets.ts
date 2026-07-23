import { PurchaseOrder } from '../types';

const SHEET_TITLE = 'Order Tracker Database';
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

/**
 * Find or create the Google Spreadsheet titled 'Order Tracker Database' in user's Drive.
 */
export async function findOrCreateOrderSpreadsheet(accessToken: string): Promise<string> {
  // Search for file in Drive
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    `name='${SHEET_TITLE}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`
  )}&fields=files(id,name)`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchRes.ok) {
    const errText = await searchRes.text();
    throw new Error(`Failed to search Google Drive: ${errText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create new spreadsheet if not found
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: SHEET_TITLE,
      },
      sheets: [
        {
          properties: {
            title: 'Orders',
          },
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Sheet: ${errText}`);
  }

  const newSheetData = await createRes.json();
  const spreadsheetId = newSheetData.spreadsheetId;

  // Add Headers to Row 1
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Orders!A1:M1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: 'Orders!A1:M1',
        majorDimension: 'ROWS',
        values: [HEADERS],
      }),
    }
  );

  return spreadsheetId;
}

/**
 * Fetch orders from Google Sheet
 */
export async function fetchOrdersFromGoogleSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<PurchaseOrder[]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Orders!A2:M`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to read from Google Sheet: ${errText}`);
  }

  const data = await res.json();
  const rows: string[][] = data.values || [];

  return rows.map((row) => {
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
      status: (status as any) || 'Pending',
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
          note: 'Loaded from synchronized Google Sheet',
          updatedBy: 'Google Workspace',
        },
      ],
    };
  });
}

/**
 * Save / Write full list of orders to Google Sheet
 */
export async function saveOrdersToGoogleSheet(
  accessToken: string,
  spreadsheetId: string,
  orders: PurchaseOrder[]
): Promise<void> {
  // Prepare values array starting with headers
  const rows: (string | number)[][] = [HEADERS];

  orders.forEach((o) => {
    rows.push([
      o.id,
      o.quoteNumber || o.id,
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

  // Clear existing sheet data first to prevent residual rows
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Orders!A1:M1000:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  // Write new matrix
  const range = `Orders!A1:M${rows.length}`;
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;

  const res = await fetch(updateUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values: rows,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to update Google Sheet: ${errText}`);
  }
}

const SHEET_ID_KEY = 'app_google_spreadsheet_id';

export function getStoredSpreadsheetId(): string | null {
  return localStorage.getItem(SHEET_ID_KEY);
}

export function setStoredSpreadsheetId(id: string | null): void {
  if (id) {
    localStorage.setItem(SHEET_ID_KEY, id);
  } else {
    localStorage.removeItem(SHEET_ID_KEY);
  }
}

/**
 * Fetch rows from a Google Sheet that is shared ("Anyone with link can view").
 * Allows manager or any team member to load records instantly without logging into Google.
 */
export async function fetchPublicGoogleSheet(spreadsheetId: string): Promise<PurchaseOrder[]> {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Could not access Google Sheet. Please ensure link sharing is ON ("Anyone with link can view")');
  }

  const text = await res.text();
  const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
  if (!jsonMatch) {
    throw new Error('Could not parse Google Sheet data response');
  }

  const jsonData = JSON.parse(jsonMatch[1]);
  const rows = jsonData.table.rows || [];

  // Skip header row if first row has "ID" or "Quote Number"
  const parsed: PurchaseOrder[] = [];

  rows.forEach((r: any, idx: number) => {
    const c = r.c || [];
    const val0 = c[0]?.v ? String(c[0].v) : '';
    // Skip if header
    if (idx === 0 && (val0.toUpperCase() === 'ID' || val0.toUpperCase() === 'QUOTE NUMBER')) {
      return;
    }

    const id = val0 || (c[1]?.v ? String(c[1].v) : `QT-${idx}`);
    const quoteNumber = c[1]?.v ? String(c[1].v) : id;
    const vendorName = c[2]?.v ? String(c[2].v) : 'Unknown Vendor';
    const quoteDate = c[3]?.f || (c[3]?.v ? String(c[3].v) : new Date().toISOString().slice(0, 10));
    const expiryDate = c[4]?.f || (c[4]?.v ? String(c[4].v) : undefined);
    const amount = typeof c[5]?.v === 'number' ? c[5].v : parseFloat(c[5]?.v || '0') || 0;
    const status = c[6]?.v ? String(c[6].v) : 'Pending';
    const bankName = c[7]?.v ? String(c[7].v) : '';
    const accountName = c[8]?.v ? String(c[8].v) : '';
    const accountNumber = c[9]?.v ? String(c[9].v) : '';
    const ifscCode = c[10]?.v ? String(c[10].v) : '';
    const driveQuoteLink = c[11]?.v ? String(c[11].v) : '';
    const createdAt = c[12]?.v ? String(c[12].v) : new Date().toISOString();

    if (!quoteNumber && !vendorName) return;

    parsed.push({
      id,
      quoteNumber,
      vendorName,
      quoteDate,
      expiryDate,
      amount,
      status: (status as any) || 'Pending',
      bankDetails: {
        bankName,
        accountName,
        accountNumber,
        ifscCode,
      },
      driveQuoteLink,
      createdAt,
      deliveryLogs: [
        {
          id: `log-${Date.now()}-${idx}`,
          timestamp: new Date().toISOString(),
          note: 'Loaded live from shared Google Sheet',
          updatedBy: 'Google Sheets DB',
        },
      ],
    });
  });

  return parsed;
}

