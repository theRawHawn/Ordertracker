import React, { useRef, useState } from 'react';
import {
  Plus,
  Download,
  Upload,
  LogOut,
  Search,
  Filter,
  Building2,
  FileSpreadsheet,
  FileText,
  FileJson,
  ChevronDown,
  Table,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { BRAND_CONFIG } from '../config/brandConfig';
import { PurchaseOrder } from '../types';
import { GoogleSheetSyncModal } from './GoogleSheetSyncModal';
import {
  exportOrdersJSON,
  exportOrdersExcel,
  exportOrdersCSV,
  exportOrdersPDF,
} from '../utils/helpers';

interface HeaderProps {
  orders: PurchaseOrder[];
  isReadOnly?: boolean;
  syncStatus?: 'idle' | 'syncing' | 'saved' | 'error';
  onNewOrder: () => void;
  onImportData: (importedOrders: PurchaseOrder[]) => void;
  onLogout: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedStatus: string;
  onStatusFilterChange: (status: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  orders,
  isReadOnly = false,
  syncStatus = 'idle',
  onNewOrder,
  onImportData,
  onLogout,
  searchTerm,
  onSearchChange,
  selectedStatus,
  onStatusFilterChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isGoogleSheetModalOpen, setIsGoogleSheetModalOpen] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          onImportData(parsed as PurchaseOrder[]);
          alert(`Successfully restored ${parsed.length} quotes from JSON file!`);
        } else {
          alert('Invalid JSON structure. Expected an array of quotes.');
        }
      } catch (err) {
        alert('Failed to parse JSON file. Please check file format.');
      }
    };
    reader.readAsText(file);

    if (e.target) e.target.value = '';
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <BrandLogo size="md" />
            <h1 className="text-lg font-bold tracking-tight text-white">
              {BRAND_CONFIG.appTitle}
            </h1>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search vendor, Quote #, bank..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-800/90 border border-slate-700/80 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => onStatusFilterChange(e.target.value)}
                className="pl-3 pr-8 py-1.5 bg-slate-800/90 border border-slate-700/80 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer appearance-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Order Placed">Order Placed</option>
                <option value="Delivered">Delivered</option>
                <option value="Hold/Cancelled">Hold / Cancelled</option>
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 relative">
            {isReadOnly ? (
              <div className="px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>View-Only Mode</span>
              </div>
            ) : (
              /* New Quote Button */
              <button
                onClick={onNewOrder}
                className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            )}

            {/* Google Sheet DB Status Button */}
            <button
              onClick={() => setIsGoogleSheetModalOpen(true)}
              title="Manage Google Sheet Database connection and live settings"
              className="py-1.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">
                {syncStatus === 'syncing'
                  ? 'Saving to Sheet DB...'
                  : syncStatus === 'saved'
                  ? 'Saved to Sheet DB ✓'
                  : 'Google Sheet DB'}
              </span>
              <span className="sm:hidden">
                {syncStatus === 'syncing' ? 'Saving...' : 'Sheet DB'}
              </span>
            </button>

            {/* Multi-Format Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu((prev) => !prev)}
                title="Export Data in Sheet, PDF, or JSON format"
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5 px-2.5"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-medium">Export</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-40 py-1.5 overflow-hidden text-xs">
                    <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-700/60">
                      Export Options ({orders.length} orders)
                    </div>

                    <button
                      onClick={() => {
                        exportOrdersExcel(orders, isReadOnly);
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700/80 hover:text-white flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <div>
                        <p className="font-semibold text-slate-100">Excel Sheet (.xlsx)</p>
                        <p className="text-[10px] text-slate-400">Formatted spreadsheet for MS Excel</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        exportOrdersPDF(orders, isReadOnly);
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700/80 hover:text-white flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <FileText className="w-4 h-4 text-rose-400" />
                      <div>
                        <p className="font-semibold text-slate-100">PDF Report (.pdf)</p>
                        <p className="text-[10px] text-slate-400">Printable PDF document with summary</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        exportOrdersCSV(orders, isReadOnly);
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700/80 hover:text-white flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <Table className="w-4 h-4 text-blue-400" />
                      <div>
                        <p className="font-semibold text-slate-100">CSV Sheet (.csv)</p>
                        <p className="text-[10px] text-slate-400">Comma-separated values data</p>
                      </div>
                    </button>

                    <div className="my-1 border-t border-slate-700/60" />

                    <button
                      onClick={() => {
                        exportOrdersJSON(orders);
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-700/80 hover:text-white flex items-center gap-2.5 cursor-pointer transition-colors"
                    >
                      <FileJson className="w-4 h-4 text-amber-400" />
                      <div>
                        <p className="font-semibold text-slate-100">JSON Backup (.json)</p>
                        <p className="text-[10px] text-slate-400">Full database raw backup</p>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Restore / Import JSON */}
            {!isReadOnly && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Import JSON Backup"
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1 px-2.5"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden lg:inline text-xs">Restore</span>
                </button>
              </>
            )}

            {/* Logout */}
            <button
              onClick={onLogout}
              title="Log Out"
              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1 px-2.5 ml-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Google Sheet Sync Modal */}
      <GoogleSheetSyncModal
        isOpen={isGoogleSheetModalOpen}
        onClose={() => setIsGoogleSheetModalOpen(false)}
        orders={orders}
        onSyncOrdersFromSheet={onImportData}
      />
    </header>
  );
};

