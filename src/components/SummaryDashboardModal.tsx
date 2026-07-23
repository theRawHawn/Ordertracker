import React from 'react';
import { PurchaseOrder } from '../types';
import { formatINR } from '../utils/helpers';
import {
  X,
  Clock,
  CheckCircle,
  PackageCheck,
  Ban,
  PauseCircle,
  PieChart,
  BarChart3,
  Building2,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface SummaryDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: PurchaseOrder[];
  onSelectStatus: (status: string) => void;
  isReadOnly?: boolean;
}

export const SummaryDashboardModal: React.FC<SummaryDashboardModalProps> = ({
  isOpen,
  onClose,
  orders,
  onSelectStatus,
  isReadOnly = false,
}) => {
  if (!isOpen) return null;

  const totalCount = orders.length;
  const totalAmount = orders.reduce((sum, o) => sum + o.amount, 0);

  // Group by status
  const pendingOrders = orders.filter((o) => o.status === 'Pending');
  const placedOrders = orders.filter((o) => o.status === 'Order Placed');
  const deliveredOrders = orders.filter((o) => o.status === 'Delivered');
  const holdOrders = orders.filter((o) => o.status === 'On Hold');
  const cancelledOrders = orders.filter((o) => o.status === 'Cancelled');

  const pendingAmount = pendingOrders.reduce((sum, o) => sum + o.amount, 0);
  const placedAmount = placedOrders.reduce((sum, o) => sum + o.amount, 0);
  const deliveredAmount = deliveredOrders.reduce((sum, o) => sum + o.amount, 0);
  const holdAmount = holdOrders.reduce((sum, o) => sum + o.amount, 0);
  const cancelledAmount = cancelledOrders.reduce((sum, o) => sum + o.amount, 0);

  const pendingPct = totalCount ? Math.round((pendingOrders.length / totalCount) * 100) : 0;
  const placedPct = totalCount ? Math.round((placedOrders.length / totalCount) * 100) : 0;
  const deliveredPct = totalCount ? Math.round((deliveredOrders.length / totalCount) * 100) : 0;
  const holdPct = totalCount ? Math.round((holdOrders.length / totalCount) * 100) : 0;
  const cancelledPct = totalCount ? Math.round((cancelledOrders.length / totalCount) * 100) : 0;

  // Top Vendors aggregation
  const vendorMap: Record<string, { count: number; total: number }> = {};
  orders.forEach((o) => {
    if (!vendorMap[o.vendorName]) {
      vendorMap[o.vendorName] = { count: 0, total: 0 };
    }
    vendorMap[o.vendorName].count += 1;
    vendorMap[o.vendorName].total += o.amount;
  });

  const topVendors = Object.entries(vendorMap)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const handleFilterClick = (status: string) => {
    onSelectStatus(status);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-500 p-0.5 shadow-md shrink-0">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-amber-400">
              <PieChart className="w-6 h-6" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              Order Summary & Dashboard
            </h2>
            <p className="text-xs text-slate-400">
              Complete breakdown of quotes by status, volume, and total value
            </p>
          </div>
        </div>

        {/* Overall Total Highlight Bar */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Managed Quotes
            </span>
            <div className="text-2xl font-black text-amber-400 tracking-tight mt-0.5 font-mono">
              {isReadOnly ? '••••••' : formatINR(totalAmount)}
            </div>
          </div>

          <div className="flex items-center gap-6 text-right">
            <div>
              <span className="text-xs text-slate-400 block">Total Quotes</span>
              <span className="text-base font-bold text-white">{totalCount} orders</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Unique Vendors</span>
              <span className="text-base font-bold text-white">
                {Object.keys(vendorMap).length} vendors
              </span>
            </div>
          </div>
        </div>

        {/* Status Distribution Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
            <span className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>Status Distribution</span>
            </span>
            <span className="text-slate-400 text-[11px]">
              {pendingOrders.length} Pending • {placedOrders.length} Placed • {deliveredOrders.length} Delivered • {holdOrders.length} On Hold • {cancelledOrders.length} Cancelled
            </span>
          </div>

          {/* Progress Multi-Bar */}
          <div className="h-3.5 w-full bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
            <div
              style={{ width: `${pendingPct}%` }}
              className="bg-amber-500 h-full transition-all"
              title={`Pending: ${pendingPct}% (${pendingOrders.length})`}
            />
            <div
              style={{ width: `${placedPct}%` }}
              className="bg-blue-500 h-full transition-all"
              title={`Order Placed: ${placedPct}% (${placedOrders.length})`}
            />
            <div
              style={{ width: `${deliveredPct}%` }}
              className="bg-emerald-500 h-full transition-all"
              title={`Delivered: ${deliveredPct}% (${deliveredOrders.length})`}
            />
            <div
              style={{ width: `${holdPct}%` }}
              className="bg-purple-500 h-full transition-all"
              title={`On Hold: ${holdPct}% (${holdOrders.length})`}
            />
            <div
              style={{ width: `${cancelledPct}%` }}
              className="bg-rose-500 h-full transition-all"
              title={`Cancelled: ${cancelledPct}% (${cancelledOrders.length})`}
            />
          </div>

          {/* Bar Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span>Pending ({pendingPct}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
              <span>Placed ({placedPct}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Delivered ({deliveredPct}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
              <span>On Hold ({holdPct}%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <span>Cancelled ({cancelledPct}%)</span>
            </div>
          </div>
        </div>

        {/* Summary Status Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {/* Pending Summary */}
          <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-3 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Pending
                </span>
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                  {pendingOrders.length}
                </span>
              </div>
              <div className="text-base font-extrabold text-white font-mono">
                {isReadOnly ? '••••••' : formatINR(pendingAmount)}
              </div>
            </div>
            <button
              onClick={() => handleFilterClick('Pending')}
              className="mt-3 w-full py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <span>View</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Order Placed Summary */}
          <div className="bg-slate-950/80 border border-blue-500/30 rounded-xl p-3 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Placed
                </span>
                <span className="text-[10px] font-bold text-blue-300 bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                  {placedOrders.length}
                </span>
              </div>
              <div className="text-base font-extrabold text-white font-mono">
                {isReadOnly ? '••••••' : formatINR(placedAmount)}
              </div>
            </div>
            <button
              onClick={() => handleFilterClick('Order Placed')}
              className="mt-3 w-full py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <span>View</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Delivered Summary */}
          <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-3 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                  <PackageCheck className="w-3.5 h-3.5" />
                  Delivered
                </span>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                  {deliveredOrders.length}
                </span>
              </div>
              <div className="text-base font-extrabold text-white font-mono">
                {isReadOnly ? '••••••' : formatINR(deliveredAmount)}
              </div>
            </div>
            <button
              onClick={() => handleFilterClick('Delivered')}
              className="mt-3 w-full py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <span>View</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* On Hold Summary */}
          <div className="bg-slate-950/80 border border-purple-500/30 rounded-xl p-3 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                  <PauseCircle className="w-3.5 h-3.5" />
                  On Hold
                </span>
                <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-500/20">
                  {holdOrders.length}
                </span>
              </div>
              <div className="text-base font-extrabold text-white font-mono">
                {isReadOnly ? '••••••' : formatINR(holdAmount)}
              </div>
            </div>
            <button
              onClick={() => handleFilterClick('On Hold')}
              className="mt-3 w-full py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <span>View</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Cancelled Summary */}
          <div className="bg-slate-950/80 border border-rose-500/30 rounded-xl p-3 relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                  <Ban className="w-3.5 h-3.5" />
                  Cancelled
                </span>
                <span className="text-[10px] font-bold text-rose-300 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                  {cancelledOrders.length}
                </span>
              </div>
              <div className="text-base font-extrabold text-white font-mono">
                {isReadOnly ? '••••••' : formatINR(cancelledAmount)}
              </div>
            </div>
            <button
              onClick={() => handleFilterClick('Cancelled')}
              className="mt-3 w-full py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
            >
              <span>View</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Top Vendors Section */}
        {topVendors.length > 0 && (
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Top Vendors by Volume</span>
            </h3>

            <div className="space-y-2">
              {topVendors.map((vendor, idx) => {
                const vendorPct = totalAmount ? Math.round((vendor.total / totalAmount) * 100) : 0;
                return (
                  <div key={vendor.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 w-4">{idx + 1}.</span>
                      <span className="font-semibold text-slate-200">{vendor.name}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        {vendor.count} {vendor.count === 1 ? 'quote' : 'quotes'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-amber-400">
                        {isReadOnly ? '••••••' : formatINR(vendor.total)}
                      </span>
                      <span className="text-[10px] text-slate-500 w-8 text-right">{vendorPct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={() => handleFilterClick('ALL')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Show All Orders in Table</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors cursor-pointer"
          >
            Close Summary
          </button>
        </div>
      </div>
    </div>
  );
};
