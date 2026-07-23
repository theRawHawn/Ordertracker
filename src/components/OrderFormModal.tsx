import React, { useState, useEffect } from 'react';
import { PurchaseOrder, OrderStatus, BankDetails } from '../types';
import { X, Building2, IndianRupee, Landmark, FileText, Check, Calendar, Hash } from 'lucide-react';

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: Partial<PurchaseOrder>) => void;
  initialOrder?: PurchaseOrder | null;
}

export const OrderFormModal: React.FC<OrderFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialOrder,
}) => {
  const [quoteNumber, setQuoteNumber] = useState('');
  const [quoteDate, setQuoteDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [status, setStatus] = useState<OrderStatus>('Pending');
  const [driveQuoteLink, setDriveQuoteLink] = useState('');

  // Bank Details State
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (initialOrder) {
      setQuoteNumber(initialOrder.quoteNumber || initialOrder.id || '');
      setQuoteDate(initialOrder.quoteDate || new Date().toISOString().slice(0, 10));
      setExpiryDate(initialOrder.expiryDate || '');
      setVendorName(initialOrder.vendorName);
      setAmount(initialOrder.amount);
      setStatus(initialOrder.status);
      setDriveQuoteLink(initialOrder.driveQuoteLink || '');

      const bd = initialOrder.bankDetails || {};
      setBankName(bd.bankName || '');
      setAccountName(bd.accountName || '');
      setAccountNumber(bd.accountNumber || '');
      setIfscCode(bd.ifscCode || '');
      setUpiId(bd.upiId || '');
    } else {
      // Reset form with generated default quote number and today's date
      const todayStr = new Date().toISOString().slice(0, 10);
      setQuoteNumber(`QT-2026-${Math.floor(100 + Math.random() * 900)}`);
      setQuoteDate(todayStr);
      setExpiryDate('');
      setVendorName('');
      setAmount('');
      setStatus('Pending');
      setDriveQuoteLink('');
      setBankName('HDFC Bank');
      setAccountName('');
      setAccountNumber('');
      setIfscCode('');
      setUpiId('');
    }
    setErrors({});
  }, [initialOrder, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!quoteNumber.trim()) errs.quoteNumber = 'Quote number is required';
    if (!quoteDate.trim()) errs.quoteDate = 'Quote date is required';
    if (!vendorName.trim()) errs.vendorName = 'Vendor name is required';
    if (!amount || Number(amount) <= 0) errs.amount = 'Valid amount in ₹ is required';
    if (!bankName.trim()) errs.bankName = 'Bank name is required';
    if (!accountNumber.trim()) errs.accountNumber = 'Account number is required';
    if (!ifscCode.trim()) errs.ifscCode = 'IFSC code is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const bankDetailsObj: BankDetails = {
      bankName: bankName.trim(),
      accountName: accountName.trim() || vendorName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      upiId: upiId.trim() || undefined,
    };

    onSave({
      quoteNumber: quoteNumber.trim(),
      quoteDate: quoteDate.trim(),
      expiryDate: expiryDate.trim() || undefined,
      vendorName: vendorName.trim(),
      amount: Number(amount),
      status,
      driveQuoteLink: driveQuoteLink.trim(),
      bankDetails: bankDetailsObj,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {initialOrder ? 'Edit Quote' : 'Add New Vendor Quote'}
              </h2>
              <p className="text-xs text-slate-400">
                Specify quote number, date, validity expiry, vendor & bank details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-sm text-slate-200">
          {/* Section 1: Quote Identifiers & Dates */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-1">
              <Hash className="w-4 h-4" />
              <span>Quote Reference & Dates</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Quote Number <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={quoteNumber}
                    onChange={(e) => setQuoteNumber(e.target.value)}
                    placeholder="e.g. QT-2026-001"
                    className={`w-full px-3 py-1.5 bg-slate-900 border rounded-lg text-white font-mono text-xs ${
                      errors.quoteNumber ? 'border-red-500' : 'border-slate-800'
                    }`}
                  />
                </div>
                {errors.quoteNumber && (
                  <p className="text-[10px] text-red-400 mt-1">{errors.quoteNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Quote Date <span className="text-amber-400">*</span>
                </label>
                <input
                  type="date"
                  value={quoteDate}
                  onChange={(e) => setQuoteDate(e.target.value)}
                  className={`w-full px-3 py-1.5 bg-slate-900 border rounded-lg text-white text-xs ${
                    errors.quoteDate ? 'border-red-500' : 'border-slate-800'
                  }`}
                />
                {errors.quoteDate && (
                  <p className="text-[10px] text-red-400 mt-1">{errors.quoteDate}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Expiry Date <span className="text-slate-500">(Optional)</span>
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  placeholder="Validity date"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Vendor & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Vendor Name <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="e.g. Tata Consultancy Services Ltd"
                className={`w-full px-3 py-2 bg-slate-950 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs ${
                  errors.vendorName ? 'border-red-500' : 'border-slate-800'
                }`}
              />
              {errors.vendorName && (
                <p className="text-[11px] text-red-400 mt-1">{errors.vendorName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Amount in INR (₹) <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                  placeholder="e.g. 150000"
                  className={`w-full pl-8 pr-3 py-2 bg-slate-950 border rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs ${
                    errors.amount ? 'border-red-500' : 'border-slate-800'
                  }`}
                />
              </div>
              {errors.amount && (
                <p className="text-[11px] text-red-400 mt-1">{errors.amount}</p>
              )}
            </div>
          </div>

          {/* Section 3: Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Pending', 'Order Placed', 'Delivered', 'Hold/Cancelled'] as OrderStatus[]).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`py-2 px-2 rounded-lg border text-xs font-medium text-center transition-all cursor-pointer ${
                      status === st
                        ? 'bg-amber-500/10 border-amber-500 text-amber-300 ring-1 ring-amber-500/40'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {st}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Section 4: Bank Details */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-1">
              <Landmark className="w-4 h-4" />
              <span>Vendor Bank Details (Indian NEFT/RTGS/UPI)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Bank Name <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. State Bank of India, HDFC"
                  className={`w-full px-3 py-1.5 bg-slate-900 border rounded-lg text-white text-xs ${
                    errors.bankName ? 'border-red-500' : 'border-slate-800'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Account Name / Beneficiary
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. Tata Consultancy Pvt Ltd"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Account Number <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 50200048123901"
                  className={`w-full px-3 py-1.5 bg-slate-900 border rounded-lg text-white text-xs ${
                    errors.accountNumber ? 'border-red-500' : 'border-slate-800'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  IFSC Code <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0000240"
                  className={`w-full px-3 py-1.5 bg-slate-900 border rounded-lg text-white uppercase text-xs ${
                    errors.ifscCode ? 'border-red-500' : 'border-slate-800'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                UPI ID (Optional)
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. vendor@hdfcbank"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs"
              />
            </div>
          </div>

          {/* Section 5: PDF Quote Link */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Google Drive PDF Quote Link
            </label>
            <div className="relative">
              <FileText className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={driveQuoteLink}
                onChange={(e) => setDriveQuoteLink(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Paste public or shareable Google Drive link for the quotation document.
            </p>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{initialOrder ? 'Update Quote' : 'Save Quote'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
