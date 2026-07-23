import React from 'react';
import { OrderStatus } from '../types';
import { Clock, CheckCircle2, AlertCircle, Ban } from 'lucide-react';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  switch (status) {
    case 'Pending':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 ${sizeClasses}`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          Pending
        </span>
      );
    case 'Order Placed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60 ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
          Order Placed
        </span>
      );
    case 'Delivered':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60 ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Delivered
        </span>
      );
    case 'Hold/Cancelled':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60 ${sizeClasses}`}
        >
          <Ban className="w-3.5 h-3.5 text-rose-500" />
          Hold / Cancelled
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-100 text-slate-700 ${sizeClasses}`}>
          <AlertCircle className="w-3.5 h-3.5" />
          {status}
        </span>
      );
  }
};
