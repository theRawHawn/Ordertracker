import { PurchaseOrder } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AUTH_CONFIG } from '../config/authConfig';

export const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch (e) {
    return dateString;
  }
};

export const getDriveEmbedUrl = (url: string): string => {
  if (!url) return '';
  if (url.includes('drive.google.com') && url.includes('/view')) {
    return url.replace('/view', '/preview');
  }
  return url;
};

const STORAGE_KEY = 'order_tracker_india_orders_v1';
const AUTH_KEY = 'order_tracker_authenticated_v1';
const READONLY_KEY = 'order_tracker_readonly_v1';
const CREDS_KEY = 'order_tracker_credentials_v1';

export const getStoredCredentials = (): { username: string; password: string } => {
  // Directly retrieve credentials defined securely in /src/config/authConfig.ts
  return {
    username: AUTH_CONFIG.username,
    password: AUTH_CONFIG.password,
  };
};

export const setStoredCredentials = (
  usernameOrObject: string | { username: string; password: string },
  maybePassword?: string
): void => {
  try {
    let username = AUTH_CONFIG.username;
    let password = AUTH_CONFIG.password;

    if (typeof usernameOrObject === 'object' && usernameOrObject !== null) {
      username = usernameOrObject.username;
      password = usernameOrObject.password;
    } else if (typeof usernameOrObject === 'string') {
      username = usernameOrObject;
      password = maybePassword || '';
    }

    localStorage.setItem(CREDS_KEY, JSON.stringify({ username, password }));
  } catch (err) {
    console.error('Failed to set credentials:', err);
  }
};

export const getStoredAuth = (): boolean => {
  try {
    return localStorage.getItem(AUTH_KEY) === 'true';
  } catch (err) {
    return false;
  }
};

export const setStoredAuth = (isAuth: boolean): void => {
  try {
    localStorage.setItem(AUTH_KEY, isAuth ? 'true' : 'false');
  } catch (err) {
    console.error('Failed to set auth state:', err);
  }
};

export const getStoredReadOnly = (): boolean => {
  try {
    return localStorage.getItem(READONLY_KEY) === 'true';
  } catch (err) {
    return false;
  }
};

export const setStoredReadOnly = (isReadOnly: boolean): void => {
  try {
    localStorage.setItem(READONLY_KEY, isReadOnly ? 'true' : 'false');
  } catch (err) {
    console.error('Failed to set read-only state:', err);
  }
};

export const loadStoredOrders = (initialOrders: PurchaseOrder[]): PurchaseOrder[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load orders from localStorage:', err);
  }
  return initialOrders;
};

export const saveOrdersToStorage = (orders: PurchaseOrder[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (err) {
    console.error('Failed to save orders to localStorage:', err);
  }
};

export const exportOrdersJSON = (orders: PurchaseOrder[]): void => {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(orders, null, 2)
  )}`;
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', jsonString);
  downloadAnchor.setAttribute(
    'download',
    `quotes_backup_${new Date().toISOString().slice(0, 10)}.json`
  );
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

export const exportOrdersExcel = (orders: PurchaseOrder[], isReadOnly: boolean = false): void => {
  const data = orders.map((o) => ({
    'Quote Number': o.quoteNumber || o.id,
    'Quote Date': formatDate(o.quoteDate || o.createdAt),
    'Expiry Date': o.expiryDate ? formatDate(o.expiryDate) : 'N/A',
    'Vendor Name': o.vendorName,
    'Total Amount (INR)': isReadOnly ? '[Restricted]' : o.amount,
    'Status': o.status,
    'Bank Name': o.bankDetails?.bankName || 'N/A',
    'Account Name': o.bankDetails?.accountName || 'N/A',
    'Account Number': o.bankDetails?.accountNumber || 'N/A',
    'IFSC Code': o.bankDetails?.ifscCode || 'N/A',
    'UPI ID': o.bankDetails?.upiId || 'N/A',
    'Delivery Logs Count': o.deliveryLogs?.length || 0,
    'Latest Log Note': o.deliveryLogs?.[0]?.note || '',
    'Drive Quote URL': o.driveQuoteLink || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendor Quotes');

  const max_cols = [18, 15, 15, 25, 18, 15, 20, 20, 18, 15, 18, 18, 35, 30];
  worksheet['!cols'] = max_cols.map((w) => ({ wch: w }));

  XLSX.writeFile(workbook, `vendor_quotes_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportOrdersCSV = (orders: PurchaseOrder[], isReadOnly: boolean = false): void => {
  const data = orders.map((o) => ({
    'Quote Number': o.quoteNumber || o.id,
    'Quote Date': formatDate(o.quoteDate || o.createdAt),
    'Expiry Date': o.expiryDate ? formatDate(o.expiryDate) : 'N/A',
    'Vendor Name': o.vendorName,
    'Total Amount (INR)': isReadOnly ? '[Restricted]' : o.amount,
    'Status': o.status,
    'Bank Name': o.bankDetails?.bankName || 'N/A',
    'Account Number': o.bankDetails?.accountNumber || 'N/A',
    'IFSC Code': o.bankDetails?.ifscCode || 'N/A',
    'Drive Quote URL': o.driveQuoteLink || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `vendor_quotes_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportOrdersPDF = (orders: PurchaseOrder[], isReadOnly: boolean = false): void => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header Bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 22, 'F');

  doc.setTextColor(245, 158, 11);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text('Vendor Quotation & Order Report', 14, 14);

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')} | Total Quotes: ${orders.length}`, 190, 14);

  // Summary KPI Cards in PDF
  const totalVal = orders.reduce((sum, o) => sum + o.amount, 0);
  const deliveredVal = orders.filter(o => o.status === 'Delivered').reduce((sum, o) => sum + o.amount, 0);
  const pendingCount = orders.filter(o => o.status === 'Pending' || o.status === 'Order Placed').length;

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 26, 85, 15, 2, 2, 'F');
  doc.roundedRect(106, 26, 85, 15, 2, 2, 'F');
  doc.roundedRect(198, 26, 85, 15, 2, 2, 'F');

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7.5);
  doc.text('TOTAL QUOTE VALUE', 18, 31);
  doc.text('FULFILLED VALUE', 110, 31);
  doc.text('ACTIVE QUOTES / ORDERS', 202, 31);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.text(isReadOnly ? '[Restricted]' : `INR ${totalVal.toLocaleString('en-IN')}`, 18, 37);
  doc.text(isReadOnly ? '[Restricted]' : `INR ${deliveredVal.toLocaleString('en-IN')}`, 110, 37);
  doc.text(`${pendingCount} Active Quotes`, 202, 37);

  // Table Data
  const tableData = orders.map((o) => [
    o.quoteNumber || o.id,
    formatDate(o.quoteDate || o.createdAt),
    o.expiryDate ? formatDate(o.expiryDate) : 'N/A',
    o.vendorName,
    isReadOnly ? '[Restricted]' : `INR ${o.amount.toLocaleString('en-IN')}`,
    o.status,
    o.bankDetails ? `${o.bankDetails.bankName}\nA/C: ${o.bankDetails.accountNumber}\nIFSC: ${o.bankDetails.ifscCode}` : 'N/A',
    o.deliveryLogs?.[0]?.note || 'No logs',
  ]);

  autoTable(doc, {
    startY: 45,
    head: [['Quote #', 'Quote Date', 'Expiry Date', 'Vendor Name', 'Amount', 'Status', 'Bank Details', 'Latest Remark']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [245, 158, 11],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      textColor: [51, 65, 85],
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 26, fontStyle: 'bold' },
      1: { cellWidth: 22 },
      2: { cellWidth: 22 },
      3: { cellWidth: 42 },
      4: { cellWidth: 28, fontStyle: 'bold' },
      5: { cellWidth: 24 },
      6: { cellWidth: 60 },
      7: { cellWidth: 45 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });

  doc.save(`vendor_quotes_report_${new Date().toISOString().slice(0, 10)}.pdf`);
};
