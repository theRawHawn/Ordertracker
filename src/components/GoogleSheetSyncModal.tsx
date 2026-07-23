import React, { useState, useEffect } from 'react';
import { PurchaseOrder } from '../types';
import {
  FileSpreadsheet,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  ExternalLink,
  CheckCircle2,
  X,
  AlertCircle,
  ShieldCheck,
  Link,
  Database,
} from 'lucide-react';
import { getStoredSpreadsheetId, setStoredSpreadsheetId, fetchPublicGoogleSheet } from '../services/googleSheets';

interface GoogleSheetSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: PurchaseOrder[];
  onSyncOrdersFromSheet: (sheetOrders: PurchaseOrder[]) => void;
}

export const GoogleSheetSyncModal: React.FC<GoogleSheetSyncModalProps> = ({
  isOpen,
  onClose,
  orders,
  onSyncOrdersFromSheet,
}) => {
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(getStoredSpreadsheetId());
  const [customSheetInput, setCustomSheetInput] = useState<string>(getStoredSpreadsheetId() || '');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [apiBackendConnected, setApiBackendConnected] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    // Check if Vercel serverless /api/orders is active
    fetch('/api/orders')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.configured) {
          setApiBackendConnected(true);
          setStatusMessage('Connected & synced with Google Sheet via server backend!');
        } else {
          setApiBackendConnected(false);
        }
      })
      .catch(() => setApiBackendConnected(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualFetch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setStatusMessage('Fetching latest orders from Google Sheet...');

      // 1. Try Vercel Serverless API first
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        if (data && data.configured && Array.isArray(data.orders)) {
          onSyncOrdersFromSheet(data.orders);
          setStatusMessage(`Successfully pulled ${data.orders.length} order(s) from Google Sheet!`);
          setIsLoading(false);
          return;
        }
      }

      // 2. Try stored sheet ID or custom input
      const idToUse = customSheetInput.trim() || spreadsheetId;
      if (!idToUse) {
        throw new Error('No Google Sheet ID found. Please paste a Google Sheet link or ID below.');
      }

      let extractedId = idToUse;
      const match = extractedId.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) extractedId = match[1];

      const fetched = await fetchPublicGoogleSheet(extractedId);
      setSpreadsheetId(extractedId);
      setStoredSpreadsheetId(extractedId);
      onSyncOrdersFromSheet(fetched);
      setStatusMessage(`Successfully pulled ${fetched.length} order(s) from connected Google Sheet!`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch from Google Sheet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualPush = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setStatusMessage(`Syncing ${orders.length} order(s) to Google Sheet...`);

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveAll', orders }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          setStatusMessage(`Successfully written ${orders.length} order(s) directly to Google Sheet!`);
          setIsLoading(false);
          return;
        }
      }

      throw new Error('Vercel environment variables for Google Sheet (GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEET_ID) are missing or invalid.');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sync to Google Sheet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectCustomSheet = async () => {
    if (!customSheetInput.trim()) return;

    let extractedId = customSheetInput.trim();
    const match = extractedId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) extractedId = match[1];

    try {
      setIsLoading(true);
      setError(null);
      setStatusMessage('Connecting to Google Sheet...');
      const fetched = await fetchPublicGoogleSheet(extractedId);
      setSpreadsheetId(extractedId);
      setStoredSpreadsheetId(extractedId);
      onSyncOrdersFromSheet(fetched);
      setStatusMessage(`Connected! Loaded ${fetched.length} order(s) from Google Sheet.`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not connect. Ensure Link Sharing is set to "Anyone with link can view"');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-slate-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Google Sheet Database Sync</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Auto Sync
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Automatic background read & write sync with your Google Sheet database
            </p>
          </div>
        </div>

        {apiBackendConnected ? (
          <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl mb-6 text-xs text-emerald-300 flex items-center gap-3">
            <Database className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-emerald-200">Automatic Backend Sync Active</p>
              <p className="text-[11px] text-emerald-400/80 mt-0.5">
                Every new entry, update, or status change is automatically written to your connected Google Sheet in real-time.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 mb-6 text-xs text-slate-300 space-y-2">
            <div className="flex items-start gap-2 text-amber-400 font-semibold">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Direct Google Sheet Sync</span>
            </div>
            <p className="leading-relaxed text-slate-400">
              Orders automatically sync to your Google Sheet database. You can also manually trigger a load or update anytime.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {isLoading && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {!isLoading && statusMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleManualPush}
              disabled={isLoading}
              className="p-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Sync Now to Google Sheet</span>
            </button>

            <button
              onClick={handleManualFetch}
              disabled={isLoading}
              className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Pull Latest from Google Sheet</span>
            </button>
          </div>

          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 mt-4">
            <p className="text-xs font-semibold text-slate-300">Connect Specific Google Sheet Link or ID</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Paste Google Sheet URL or ID..."
                  value={customSheetInput}
                  onChange={(e) => setCustomSheetInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                onClick={handleConnectCustomSheet}
                disabled={isLoading || !customSheetInput.trim()}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 cursor-pointer whitespace-nowrap flex items-center gap-1.5"
              >
                <DownloadCloud className="w-3.5 h-3.5" />
                <span>Connect</span>
              </button>
            </div>
          </div>

          {spreadsheetId && (
            <div className="pt-2 text-center">
              <a
                href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 underline font-medium"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Google Sheet in Browser</span>
              </a>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 mt-6 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

