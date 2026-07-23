import { PurchaseOrder } from '../types';

export const INITIAL_ORDERS: PurchaseOrder[] = [
  {
    id: 'QT-2026-101',
    quoteNumber: 'QT-2026-101',
    quoteDate: '2026-07-15',
    expiryDate: '2026-08-15',
    createdAt: '2026-07-15T09:30:00.000Z',
    vendorName: 'Tata Steel Industrial Supplies',
    amount: 245000,
    bankDetails: {
      bankName: 'HDFC Bank',
      accountName: 'Tata Steel Industrial Supplies Ltd',
      accountNumber: '50200084920192',
      ifscCode: 'HDFC0000240',
      upiId: 'tatasteel@hdfcbank',
    },
    driveQuoteLink: 'https://drive.google.com/file/d/1sample_quote_tata_steel/view',
    status: 'Order Placed',
    deliveryLogs: [
      {
        id: 'log-101-1',
        timestamp: '2026-07-16T11:00:00.000Z',
        note: 'Order placed & payment processed via NEFT.',
        updatedBy: 'Admin',
      },
      {
        id: 'log-101-2',
        timestamp: '2026-07-15T09:30:00.000Z',
        note: 'Quotation received and approved by procurement team.',
        updatedBy: 'Procurement',
      },
    ],
  },
  {
    id: 'QT-2026-102',
    quoteNumber: 'QT-2026-102',
    quoteDate: '2026-07-18',
    expiryDate: '2026-08-18',
    createdAt: '2026-07-18T14:15:00.000Z',
    vendorName: 'Infosys Hardware Solution Services',
    amount: 185000,
    bankDetails: {
      bankName: 'ICICI Bank',
      accountName: 'Infosys Hardware Services',
      accountNumber: '000405019823',
      ifscCode: 'ICIC0000004',
      upiId: 'infosys.pay@icici',
    },
    driveQuoteLink: 'https://drive.google.com/file/d/1sample_quote_infosys/view',
    status: 'Pending',
    deliveryLogs: [
      {
        id: 'log-102-1',
        timestamp: '2026-07-18T14:15:00.000Z',
        note: 'Vendor quote received. Under finance department review.',
        updatedBy: 'Finance Dept',
      },
    ],
  },
  {
    id: 'QT-2026-103',
    quoteNumber: 'QT-2026-103',
    quoteDate: '2026-07-10',
    expiryDate: '2026-07-30',
    createdAt: '2026-07-10T08:00:00.000Z',
    vendorName: 'Godrej Office Furniture & Interiors',
    amount: 98000,
    bankDetails: {
      bankName: 'State Bank of India',
      accountName: 'Godrej Interiors Pvt Ltd',
      accountNumber: '30928104921',
      ifscCode: 'SBIN0001234',
    },
    driveQuoteLink: 'https://drive.google.com/file/d/1sample_quote_godrej/view',
    status: 'Delivered',
    deliveryLogs: [
      {
        id: 'log-103-2',
        timestamp: '2026-07-21T16:30:00.000Z',
        note: 'All furniture items delivered and assembled at main office.',
        updatedBy: 'Logistics Manager',
      },
      {
        id: 'log-103-1',
        timestamp: '2026-07-11T10:00:00.000Z',
        note: 'Advance payment 50% made.',
        updatedBy: 'Accounts',
      },
    ],
  },
  {
    id: 'QT-2026-104',
    quoteNumber: 'QT-2026-104',
    quoteDate: '2026-07-02',
    expiryDate: '2026-07-15',
    createdAt: '2026-07-02T10:20:00.000Z',
    vendorName: 'Schneider Electric Power Systems',
    amount: 320000,
    bankDetails: {
      bankName: 'Axis Bank',
      accountName: 'Schneider Electric India Ltd',
      accountNumber: '912020038192019',
      ifscCode: 'UTIB0000015',
      upiId: 'schneider@axisbank',
    },
    driveQuoteLink: 'https://drive.google.com/file/d/1sample_quote_schneider/view',
    status: 'Hold/Cancelled',
    deliveryLogs: [
      {
        id: 'log-104-1',
        timestamp: '2026-07-16T12:00:00.000Z',
        note: 'Quote validity expired without final approval. Put on hold.',
        updatedBy: 'Admin',
      },
    ],
  },
];


