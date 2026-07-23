import React, { useState } from 'react';
import { PurchaseOrder } from '../types';
import { formatINR } from '../utils/helpers';
import { IndianRupee, Clock, CheckCircle, Ban, PackageCheck, PieChart } from 'lucide-react';
import { SummaryDashboardModal } from './SummaryDashboardModal';

interface MetricsCardsProps {
  orders: PurchaseOrder[];
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
  isReadOnly?: boolean;
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({
  orders,
  selectedStatus,
  onSelectStatus,
  isReadOnly = false,
}) => {
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  const totalAmount = orders.reduce((sum, order) => sum + order.amount, 0);
  const pendingCount = orders.filter((o) => o.status === 'Pending').length;
  const placedCount = orders.filter((o) => o.status === 'Order Placed').length;
  const deliveredCount = orders.filter((o) => o.status === 'Delivered').length;
  const holdCount = orders.filter((o) => o.status === 'Hold/Cancelled').length;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Quote Value Card - Opens Summary Dashboard */}
        <div
          onClick={() => {
            onSelectStatus('ALL');
            setIsDashboardOpen(true);
          }}
          className={`p-4 rounded-xl border transition-all cursor-pointer group ${
            selectedStatus === 'ALL'
              ? 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-900 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
              : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800'
          }`}
          title="Click to view full Order Summary & Analytics Dashboard"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-amber-300 transition-colors">
              Total Quote Value
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white tracking-tight">
            {isReadOnly ? '••••••' : formatINR(totalAmount)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>{orders.length} total quotes</span>
            <span className="text-amber-400/90 font-medium flex items-center gap-1 group-hover:underline">
              <PieChart className="w-3 h-3" />
              <span>Dashboard</span>
            </span>
          </div>
        </div>

      {/* Pending Card */}
      <div
        onClick={() => onSelectStatus('Pending')}
        className={`p-4 rounded-xl border transition-all cursor-pointer ${
          selectedStatus === 'Pending'
            ? 'bg-amber-950/40 border-amber-500/60 shadow-md ring-1 ring-amber-500/30'
            : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            Pending
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-amber-300 tracking-tight">
          {pendingCount}
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Awaiting approval / review
        </div>
      </div>

      {/* Order Placed Card */}
      <div
        onClick={() => onSelectStatus('Order Placed')}
        className={`p-4 rounded-xl border transition-all cursor-pointer ${
          selectedStatus === 'Order Placed'
            ? 'bg-blue-950/40 border-blue-500/60 shadow-md ring-1 ring-blue-500/30'
            : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
            Order Placed
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-blue-300 tracking-tight">
          {placedCount}
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Approved & ordered
        </div>
      </div>

      {/* Delivered Card */}
      <div
        onClick={() => onSelectStatus('Delivered')}
        className={`p-4 rounded-xl border transition-all cursor-pointer ${
          selectedStatus === 'Delivered'
            ? 'bg-emerald-950/40 border-emerald-500/60 shadow-md ring-1 ring-emerald-500/30'
            : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Delivered
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <PackageCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-emerald-300 tracking-tight">
          {deliveredCount}
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Fulfilled successfully
        </div>
      </div>

      {/* Hold / Cancelled Card */}
      <div
        onClick={() => onSelectStatus('Hold/Cancelled')}
        className={`p-4 rounded-xl border transition-all cursor-pointer ${
          selectedStatus === 'Hold/Cancelled'
            ? 'bg-rose-950/40 border-rose-500/60 shadow-md ring-1 ring-rose-500/30'
            : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
            Hold / Cancelled
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
            <Ban className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-rose-300 tracking-tight">
          {holdCount}
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Paused or revoked
        </div>
      </div>
    </div>

      {/* Order Summary & Dashboard Modal */}
      <SummaryDashboardModal
        isOpen={isDashboardOpen}
        onClose={() => setIsDashboardOpen(false)}
        orders={orders}
        onSelectStatus={onSelectStatus}
        isReadOnly={isReadOnly}
      />
    </>
  );
};
