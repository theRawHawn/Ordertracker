import React from 'react';
import { Truck, X, Sparkles } from 'lucide-react';

interface ToastMessage {
  id: string;
  poNumber: string;
  title: string;
  description: string;
  timestamp: string;
}

interface LiveNotificationToastProps {
  toast: ToastMessage | null;
  onDismiss: () => void;
  onViewOrder: (poNumber: string) => void;
}

export const LiveNotificationToast: React.FC<LiveNotificationToastProps> = ({
  toast,
  onDismiss,
  onViewOrder,
}) => {
  if (!toast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-600 text-white animate-pulse">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                Live Delivery Update
              </span>
              <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                <Sparkles className="w-2.5 h-2.5" /> Live
              </span>
            </div>
            <div className="text-sm font-bold mt-0.5">{toast.poNumber}</div>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-2 text-xs text-slate-300 font-medium">
        {toast.title}
      </div>
      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
        {toast.description}
      </p>

      <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
        <span className="text-slate-500 font-mono">{toast.timestamp}</span>
        <button
          onClick={() => onViewOrder(toast.poNumber)}
          className="font-bold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
        >
          View Tracking Details →
        </button>
      </div>
    </div>
  );
};
