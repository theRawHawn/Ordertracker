export type OrderStatus = 'Pending' | 'Order Placed' | 'Delivered' | 'Hold/Cancelled';

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  upiId?: string;
}

export interface DeliveryLog {
  id: string;
  timestamp: string;
  note: string;
  updatedBy: string;
}

export interface PurchaseOrder {
  id: string;
  quoteNumber: string; // e.g. QT-2026-001
  quoteDate: string; // e.g. 2026-07-20
  expiryDate?: string; // e.g. 2026-08-20 (optional quote validity expiry)
  createdAt: string;
  vendorName: string;
  amount: number; // in INR ₹
  bankDetails: BankDetails;
  driveQuoteLink: string; // Google Drive PDF link
  status: OrderStatus;
  deliveryLogs: DeliveryLog[];
}

export type ViewMode = 'table' | 'cards';
