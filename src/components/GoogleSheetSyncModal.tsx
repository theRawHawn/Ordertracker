import React, { useState, useEffect } from 'react';
import { PurchaseOrder } from '../types';
import { googleSignIn, getAccessToken, logoutGoogle } from '../services/googleAuth';
import {
  findOrCreateOrderSpreadsheet,
  fetchOrdersFromGoogleSheet,
  saveOrdersToGoogleSheet,
  getStoredSpreadsheetId,
  setStoredSpreadsheetId,
  fetchPublicGoogleSheet,
} from '../services/googleSheets';
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
  UserCheck,
  Link,
  Users,
} from 'lucide-react';

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
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [accessToken, setTokenState] = useState<string | null>(getAccessToken());
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(getStoredSpreadsheetId());
  const [customSheetInput, setCustomSheetInput] = useState<string>(getStoredSpreadsheetId() || '');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Auto initialize spreadsheet if token exists
  useEffect(() => {
    if (accessToken && !spreadsheetId) {
      initSpreadsheet(accessToken);
    }
  }, [accessToken]);

  if (!isOpen) return null;

  const initSpreadsheet = async (token: string) => {
    try {
      setIsLoading(true);
      setStatusMessage('Connecting to Google Drive & locating Google Sheet...');
      setError(null);
      const sheetId = await findOrCreateOrderSpreadsheet(token);
      setSpreadsheetId(sheetId);
      setStoredSpreadsheetId(sheetId);
      setCustomSheetInput(sheetId);
      setStatusMessage('Connected to Google Sheet: "Order Tracker Database"');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to connect to Google Sheets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setStatusMessage('Signing in with Google Account...');
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setTokenState(res.accessToken);
        await initSpreadsheet(res.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePullFromSheet = async () => {
    if (!accessToken || !spreadsheetId) return;

    const confirmed = window.confirm(
      'Are you sure you want to load orders from your Google Sheet? This will update your current on-screen list with data from Google Sheets.'
    );
    if (!confirmed) return;

    try {
      setIsLoading(true);
      setError(null);
      setStatusMessage('Fetching latest rows from Google Sheet...');
      const fetchedOrders = await fetchOrdersFromGoogleSheet(accessToken, spreadsheetId);
      onSyncOrdersFromSheet(fetchedOrders);
      setStatusMessage(`Successfully loaded ${fetchedOrders.length} orders from Google Sheet!`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to pull data from Google Sheet');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushToSheet = async () => {
    if (!accessToken || !spreadsheetId) return;

    const confirmed = window.confirm(
      `Are you sure you want to save ${orders.length} order(s) to your Google Sheet? This will update rows in 'Order Tracker Database' in your Google Drive.`
    );
    if (!confirmed) return;

    try {
      setIsLoading(true);
      setError(null);
      setStatusMessage(`Saving ${orders.length} order(s) to Google Sheet...`);
      await saveOrdersToGoogleSheet(accessToken, spreadsheetId, orders);
      setStatusMessage(`Successfully updated Google Sheet with ${orders.length} order(s)!`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save data to Google Sheet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectPublicSheet = async () => {
    if (!customSheetInput.trim()) return;

    // Extract sheet ID from URL if full link pasted
    let extractedId = customSheetInput.trim();
    const match = extractedId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      extractedId = match[1];
    }

    try {
      setIsLoading(true);
      setError(null);
      setStatusMessage('Loading live data from shared Google Sheet ID...');
      const fetchedOrders = await fetchPublicGoogleSheet(extractedId);
      setSpreadsheetId(extractedId);
      setStoredSpreadsheetId(extractedId);
      onSyncOrdersFromSheet(fetchedOrders);
      setStatusMessage(`Successfully connected! Loaded ${fetchedOrders.length} orders from Shared Google Sheet.`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Could not load Google Sheet. Make sure Link Sharing is ON ("Anyone with link can view")');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setTokenState(null);
    setStatusMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Google Sheets Database Sync</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                Secure Cloud
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Store order records inside a file in your own Google Drive account
            </p>
          </div>
        </div>

        {/* Information Banner */}
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 mb-6 text-xs text-slate-300 space-y-2">
          <div className="flex items-start gap-2 text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Private & Encrypted in your Google Ecosystem</span>
          </div>
          <p className="leading-relaxed text-slate-400">
            Data is written directly into an Excel/Spreadsheet file named{' '}
            <strong className="text-slate-200">"Order Tracker Database"</strong> inside your personal
            Google Drive account. Only you can view or modify it.
          </p>
        </div>

        {/* Auth Section */}
        {!accessToken ? (
          <div className="space-y-4 my-4 pt-2 border-t border-slate-800">
            <div className="py-4 flex flex-col items-center justify-center text-center space-y-3">
              <p className="text-xs text-slate-300 max-w-md">
                Sign in with Google to create or save changes directly to your Google Drive spreadsheet:
              </p>

              {/* Official Material Google Sign In Button */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="group relative inline-flex items-center justify-center px-6 py-2.5 bg-white text-slate-800 font-semibold text-xs rounded-xl shadow-lg hover:bg-slate-100 transition-all cursor-pointer border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>{isLoading ? 'Connecting Google Account...' : 'Sign in with Google'}</span>
                </div>
              </button>
            </div>

            {/* Manager / Team Access without Google Login */}
            <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <Users className="w-4 h-4" />
                <span>Manager & Team Member Direct Sync (No Login Required)</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                If your manager or colleague opens this web app, they can connect directly by pasting the shared Google Sheet link or ID below:
              </p>
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
                  onClick={handleConnectPublicSheet}
                  disabled={isLoading || !customSheetInput.trim()}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                >
                  <DownloadCloud className="w-3.5 h-3.5" />
                  <span>Connect Sheet</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Account connected bar */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-200">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  Connected as:{' '}
                  <strong className="text-white font-mono">
                    {googleUser?.email || 'Google Account'}
                  </strong>
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-[11px] text-slate-400 hover:text-rose-400 underline cursor-pointer"
              >
                Disconnect
              </button>
            </div>

            {/* Status / Loading indicator */}
            {isLoading && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 rounded-xl text-xs flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Status Message */}
            {!isLoading && statusMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={handlePushToSheet}
                disabled={isLoading || !spreadsheetId}
                className="p-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Save Orders to Google Sheet</span>
              </button>

              <button
                onClick={handlePullFromSheet}
                disabled={isLoading || !spreadsheetId}
                className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-700 cursor-pointer"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>Load Orders from Google Sheet</span>
              </button>
            </div>

            {/* View Spreadsheet Link */}
            {spreadsheetId && (
              <div className="pt-2 text-center">
                <a
                  href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 underline font-medium"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open "Order Tracker Database" in Google Sheets</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Modal Footer */}
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
