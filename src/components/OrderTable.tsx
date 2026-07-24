import React, { useState } from 'react';
import { PurchaseOrder, OrderStatus } from '../types';
import { formatINR, formatDate } from '../utils/helpers';
import { StatusBadge } from './StatusBadge';
import {
  Building2,
  FileText,
  Landmark,
  Eye,
  Edit2,
  Trash2,
  ExternalLink,
  AlertTriangle,
  X,
  Calendar,
  Clock,
  PackageCheck,
  CheckCircle2,
  Send,
} from 'lucide-react';

interface OrderTableProps {
  orders: PurchaseOrder[];
  isReadOnly?: boolean;
  onSelectOrder: (order: PurchaseOrder) => void;
  onEditOrder: (order: PurchaseOrder) => void;
  onDeleteOrder: (id: string) => void;
  onStatusChange: (id: string, newStatus: OrderStatus) => void;
  onAddDeliveryLog?: (id: string, note: string) => void;
  onOpenQuote: (url: string, vendorName: string) => void;
}

export const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  isReadOnly = false,
  onSelectOrder,
  onEditOrder,
  onDeleteOrder,
  onStatusChange,
  onAddDeliveryLog,
  onOpenQuote,
}) => {
  const [orderToDelete, setOrderToDelete] = useState<PurchaseOrder | null>(null);
  const [deliveringOrder, setDeliveringOrder] = useState<PurchaseOrder | null>(null);
  const [deliveryNote, setDeliveryNote] = useState<string>('');

  if (orders.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center my-6">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto mb-3">
          <Building2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-white mb-1">No Quotes Found</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          No quotes match your filter criteria. Add a new quote to get started.
        </p>
      </div>
    );
  }

  const handleConfirmDelete = () => {
    if (orderToDelete) {
      onDeleteOrder(orderToDelete.id);
      setOrderToDelete(null);
    }
  };

  const isExpired = (expiryStr?: string): boolean => {
    if (!expiryStr) return false;
    const expDate = new Date(expiryStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expDate < today;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4">Quote # & Date</th>
              <th className="py-3.5 px-4">Expiry Date</th>
              <th className="py-3.5 px-4">Vendor Name</th>
              <th className="py-3.5 px-4 text-right">Amount (₹)</th>
              <th className="py-3.5 px-4">Bank Details</th>
              {!isReadOnly && <th className="py-3.5 px-4">PDF Quote</th>}
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs text-slate-200">
            {orders.map((order) => {
              const bd = order.bankDetails || {
                bankName: 'N/A',
                accountNumber: 'N/A',
                ifscCode: 'N/A',
              };

              const expired = isExpired(order.expiryDate);

              return (
                <tr
                  key={order.id}
                  className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  onClick={() => onSelectOrder(order)}
                >
                  {/* Quote Number & Quote Date */}
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-amber-400">
                      {order.quoteNumber || order.id}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{formatDate(order.quoteDate || order.createdAt)}</span>
                    </div>
                  </td>

                  {/* Expiry Date */}
                  <td className="py-3.5 px-4">
                    {order.expiryDate ? (
                      <div>
                        <div
                          className={`font-mono text-[11px] font-semibold flex items-center gap-1 ${
                            expired ? 'text-rose-400' : 'text-slate-300'
                          }`}
                        >
                          <Clock className={`w-3 h-3 ${expired ? 'text-rose-400' : 'text-slate-400'}`} />
                          <span>{formatDate(order.expiryDate)}</span>
                        </div>
                        {expired && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded">
                            Expired
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">No Expiry</span>
                    )}
                  </td>

                  {/* Vendor Name */}
                  <td className="py-3.5 px-4 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="line-clamp-1">{order.vendorName}</span>
                    </div>
                  </td>

                  {/* Amount INR */}
                  <td className="py-3.5 px-4 text-right font-extrabold text-amber-300 font-mono text-sm">
                    {isReadOnly ? '••••••' : formatINR(order.amount)}
                  </td>

                  {/* Bank Details */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-slate-200 text-[11px]">
                          {bd.bankName}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400">
                          Acc: {bd.accountNumber}
                        </div>
                        <div className="font-mono text-[10px] text-amber-400/90 font-medium">
                          IFSC: {bd.ifscCode}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* PDF Quote */}
                  {!isReadOnly && (
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      {order.driveQuoteLink ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onOpenQuote(order.driveQuoteLink, order.vendorName)}
                            className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg transition-colors flex items-center gap-1 font-medium text-[11px] cursor-pointer"
                          >
                            <FileText className="w-3 h-3 text-amber-400" />
                            <span>View PDF</span>
                          </button>
                          <a
                            href={order.driveQuoteLink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-slate-400 hover:text-white transition-colors"
                            title="Open Drive Link"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">No PDF</span>
                      )}
                    </td>
                  )}

                  {/* Status Dropdown / Badge */}
                  <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                    {isReadOnly ? (
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={order.status} size="sm" />
                        {order.status !== 'Delivered' && (
                          <button
                            type="button"
                            onClick={() => {
                              setDeliveringOrder(order);
                              setDeliveryNote('');
                            }}
                            className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0 shadow-sm"
                            title="Mark as Delivered and log issue/note"
                          >
                            <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Mark Delivered</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <select
                        value={order.status}
                        onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
                        className="bg-slate-950 border border-slate-700/80 text-xs text-white rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Order Placed">Order Placed</option>
                        <option value="Delivered">Delivered</option>
                        <option value="On Hold">On Hold</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onSelectOrder(order)}
                        title="View Details"
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-amber-400 rounded-lg transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {!isReadOnly && (
                        <>
                          <button
                            onClick={() => onEditOrder(order)}
                            title="Edit Quote"
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-blue-400 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setOrderToDelete(order)}
                            title="Delete Quote"
                            className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {orderToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setOrderToDelete(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Move Quote to Trash Bin?</h3>
                <p className="text-xs text-slate-400">Can be restored anytime from Trash Bin</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 mb-5 font-mono">
              Move quote{' '}
              <span className="text-amber-400 font-bold">
                {orderToDelete.quoteNumber || orderToDelete.id}
              </span>{' '}
              for <span className="text-white font-semibold">{orderToDelete.vendorName}</span> to Trash Bin backup?
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setOrderToDelete(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Quote</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Order as Delivered Modal (For Guest Mode / Direct Action) */}
      {deliveringOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setDeliveringOrder(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Mark Order as Delivered</h3>
                <p className="text-xs text-slate-400">
                  Quote #{deliveringOrder.quoteNumber || deliveringOrder.id} • {deliveringOrder.vendorName}
                </p>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Delivery Note / Report Issues (Optional)
              </label>
              <textarea
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="e.g., Goods received at warehouse. All packages intact, or note any issues..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                This remark will be logged into the quote's activity history.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDeliveringOrder(null)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onStatusChange(deliveringOrder.id, 'Delivered');
                  const finalNote = deliveryNote.trim()
                    ? deliveryNote.trim()
                    : 'Order status marked as Delivered';
                  if (onAddDeliveryLog) {
                    onAddDeliveryLog(deliveringOrder.id, finalNote);
                  }
                  setDeliveringOrder(null);
                  setDeliveryNote('');
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Delivered</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
