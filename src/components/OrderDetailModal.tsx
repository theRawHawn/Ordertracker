import React, { useState } from 'react';
import { PurchaseOrder, OrderStatus } from '../types';
import { formatINR, formatDate } from '../utils/helpers';
import { StatusBadge } from './StatusBadge';
import {
  X,
  Building2,
  Landmark,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Clock,
  Send,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

interface OrderDetailModalProps {
  order: PurchaseOrder | null;
  isOpen: boolean;
  isReadOnly?: boolean;
  onClose: () => void;
  onStatusChange: (id: string, newStatus: OrderStatus) => void;
  onAddDeliveryLog: (id: string, note: string) => void;
  onOpenQuote: (url: string, vendorName: string) => void;
  onEdit: (order: PurchaseOrder) => void;
  onDelete: (id: string) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  isReadOnly = false,
  onClose,
  onStatusChange,
  onAddDeliveryLog,
  onOpenQuote,
  onEdit,
  onDelete,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [newLogNote, setNewLogNote] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !order) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogNote.trim()) return;
    onAddDeliveryLog(order.id, newLogNote.trim());
    setNewLogNote('');
  };

  const handleConfirmDelete = () => {
    onDelete(order.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const bd = order.bankDetails || {
    bankName: 'N/A',
    accountName: order.vendorName,
    accountNumber: 'N/A',
    ifscCode: 'N/A',
  };

  const isExpired = (expiryStr?: string): boolean => {
    if (!expiryStr) return false;
    const expDate = new Date(expiryStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expDate < today;
  };

  const expired = isExpired(order.expiryDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 text-slate-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-mono font-bold text-xs">
              QT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{order.quoteNumber || order.id}</h2>
                <StatusBadge status={order.status} size="sm" />
              </div>
              <p className="text-xs text-slate-400">
                Quote Date: {formatDate(order.quoteDate || order.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isReadOnly && (
              <>
                <button
                  onClick={() => {
                    onClose();
                    onEdit(order);
                  }}
                  title="Edit Quote"
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  title="Delete Quote"
                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Banner inside modal */}
        {showDeleteConfirm && (
          <div className="p-4 bg-rose-950/60 border-b border-rose-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-rose-200">
              <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                Are you sure you want to delete quote <strong>{order.quoteNumber || order.id}</strong>?
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        )}

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-sm">
          {/* Top Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-slate-950/80 border border-slate-800/80 rounded-xl">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Vendor Name
              </span>
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="line-clamp-2">{order.vendorName}</span>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Quote Amount
              </span>
              <div className="text-lg font-extrabold text-amber-400">
                {isReadOnly ? '••••••' : formatINR(order.amount)}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Expiry Date
              </span>
              {order.expiryDate ? (
                <div>
                  <div
                    className={`font-mono text-xs font-semibold flex items-center gap-1 ${
                      expired ? 'text-rose-400' : 'text-slate-200'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(order.expiryDate)}</span>
                  </div>
                  {expired && (
                    <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded">
                      Expired
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-slate-500 italic">No expiry specified</span>
              )}
            </div>
          </div>

          {/* Status Quick Switcher */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">
                Current Status
              </span>
              {isReadOnly && (
                <span className="text-[10px] text-emerald-400 font-medium">
                  Guest: Can mark Delivered & add notes
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Pending', 'Order Placed', 'Delivered', 'Hold/Cancelled'] as OrderStatus[]).map(
                (st) => {
                  const isDeliveredOption = st === 'Delivered';
                  const isDisabled = isReadOnly && !isDeliveredOption;

                  return (
                    <button
                      key={st}
                      disabled={isDisabled}
                      onClick={() => {
                        if (isDisabled) return;
                        onStatusChange(order.id, st);
                      }}
                      title={isDisabled ? 'Admin privilege required for this status' : 'Click to set status'}
                      className={`py-2 px-2 rounded-lg border text-xs font-medium transition-all ${
                        isDisabled
                          ? 'cursor-not-allowed opacity-40 bg-slate-950 border-slate-900 text-slate-600'
                          : 'cursor-pointer'
                      } ${
                        order.status === st
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {st}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Vendor Bank Details Card */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <Landmark className="w-4 h-4" />
                <span>Vendor Bank & Payment Details</span>
              </div>
              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-medium">
                NEFT / RTGS / IMPS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-500 block">Bank Name</span>
                  <span className="font-semibold text-white">{bd.bankName}</span>
                </div>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                <div className="overflow-hidden">
                  <span className="text-[10px] text-slate-500 block">Account Number</span>
                  <span className="font-mono font-semibold text-white truncate block">
                    {bd.accountNumber}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(bd.accountNumber, 'acc')}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-400 transition-colors shrink-0 ml-2 cursor-pointer"
                  title="Copy Account Number"
                >
                  {copiedField === 'acc' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-500 block">IFSC Code</span>
                  <span className="font-mono font-semibold text-amber-300">
                    {bd.ifscCode}
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(bd.ifscCode, 'ifsc')}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-400 transition-colors shrink-0 ml-2 cursor-pointer"
                  title="Copy IFSC Code"
                >
                  {copiedField === 'ifsc' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-500 block">UPI ID</span>
                  <span className="font-mono font-medium text-emerald-300">
                    {bd.upiId || 'Not specified'}
                  </span>
                </div>
                {bd.upiId && (
                  <button
                    onClick={() => handleCopy(bd.upiId!, 'upi')}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-amber-400 transition-colors shrink-0 ml-2 cursor-pointer"
                    title="Copy UPI ID"
                  >
                    {copiedField === 'upi' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* PDF Quote Attachment */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Google Drive PDF Quotation</h4>
                <p className="text-[11px] text-slate-400 truncate max-w-xs">
                  {order.driveQuoteLink || 'No URL attached'}
                </p>
              </div>
            </div>

            {order.driveQuoteLink ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenQuote(order.driveQuoteLink, order.vendorName)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Preview PDF</span>
                </button>
                <a
                  href={order.driveQuoteLink}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                  title="Open directly in Drive"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <span className="text-xs text-slate-500">No quote attached</span>
            )}
          </div>

          {/* Activity Logs */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Activity & Status History</span>
            </h4>

            <form onSubmit={handleAddLog} className="flex gap-2 mb-3">
              <input
                type="text"
                value={newLogNote}
                onChange={(e) => setNewLogNote(e.target.value)}
                placeholder={
                  isReadOnly
                    ? 'Log delivery update or report issues...'
                    : 'Add status update or quote remark...'
                }
                className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Send className="w-3 h-3 text-emerald-400" />
                <span>Add Note</span>
              </button>
            </form>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {order.deliveryLogs && order.deliveryLogs.length > 0 ? (
                order.deliveryLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-lg text-xs"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span className="font-semibold text-slate-400">{log.updatedBy}</span>
                      <span>{formatDate(log.timestamp)}</span>
                    </div>
                    <p className="text-slate-300">{log.note}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic">No notes recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
