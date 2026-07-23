import React, { useState } from 'react';
import { DeletedOrder } from '../types';
import { formatINR, formatDate } from '../utils/helpers';
import {
  Trash2,
  X,
  RotateCcw,
  AlertTriangle,
  Building2,
  Calendar,
  Clock,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';

interface TrashBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  deletedOrders: DeletedOrder[];
  onRestoreOrder: (id: string) => void;
  onPermanentDeleteOrder: (id: string) => void;
  onEmptyTrash: () => void;
  isReadOnly?: boolean;
}

export const TrashBinModal: React.FC<TrashBinModalProps> = ({
  isOpen,
  onClose,
  deletedOrders,
  onRestoreOrder,
  onPermanentDeleteOrder,
  onEmptyTrash,
  isReadOnly = false,
}) => {
  const [selectedOrder, setSelectedOrder] = useState<DeletedOrder | null>(null);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleRestore = (id: string, quoteNum: string) => {
    onRestoreOrder(id);
    showToast(`Quote #${quoteNum} restored successfully!`);
  };

  const handlePermanentDelete = (id: string, quoteNum: string) => {
    if (window.confirm(`Permanently delete Quote #${quoteNum}? This cannot be undone.`)) {
      onPermanentDeleteOrder(id);
      showToast(`Quote #${quoteNum} permanently removed.`);
    }
  };

  const handleEmptyTrash = () => {
    onEmptyTrash();
    setConfirmEmpty(false);
    showToast('Trash bin emptied.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Trash Bin & Recoverable Backups</span>
                <span className="px-2 py-0.5 text-xs font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full">
                  {deletedOrders.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Deleted orders are backed up here. You can restore them anytime.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toast Alert */}
        {toastMsg && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 px-4 py-2 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {deletedOrders.length === 0 ? (
            <div className="text-center py-12 bg-slate-950/50 border border-slate-800/80 rounded-xl p-8">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-300 mb-1">Trash Bin is Empty</p>
              <p className="text-xs text-slate-500">
                Any deleted quote or order will appear here automatically as a recoverable backup.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs text-slate-400 font-medium">
                  {deletedOrders.length} deleted quote(s) in backup
                </span>
                {!isReadOnly && (
                  <button
                    onClick={() => setConfirmEmpty(true)}
                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Empty Trash Bin</span>
                  </button>
                )}
              </div>

              {confirmEmpty && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between text-xs text-rose-300 animate-fadeIn">
                  <span className="font-medium">
                    Permanently delete all {deletedOrders.length} backup quotes?
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmEmpty(false)}
                      className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-md hover:bg-slate-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEmptyTrash}
                      className="px-2.5 py-1 bg-rose-600 text-white font-bold rounded-md hover:bg-rose-700 cursor-pointer"
                    >
                      Yes, Empty All
                    </button>
                  </div>
                </div>
              )}

              <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                {deletedOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400 text-xs">
                          {order.quoteNumber || order.id}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium border border-slate-700">
                          {order.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-semibold text-white">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{order.vendorName}</span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <span>{isReadOnly ? '••••••' : formatINR(order.amount)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-[10px] text-rose-400">
                          <Clock className="w-3 h-3" />
                          Deleted on {formatDate(order.deletedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 shrink-0">
                      <button
                        onClick={() => handleRestore(order.id, order.quoteNumber || order.id)}
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Restore this quote back to active database"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Restore Quote</span>
                      </button>

                      {!isReadOnly && (
                        <button
                          onClick={() => handlePermanentDelete(order.id, order.quoteNumber || order.id)}
                          className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                          title="Permanently remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Trash Bin auto-saves locally and preserves all quote information.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
