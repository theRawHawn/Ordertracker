import React, { useState, useEffect, useRef } from 'react';
import { PurchaseOrder, OrderStatus, DeletedOrder } from './types';
import { INITIAL_ORDERS } from './data/sampleData';
import {
  loadStoredOrders,
  saveOrdersToStorage,
  loadStoredDeletedOrders,
  saveDeletedOrdersToStorage,
  getStoredAuth,
  setStoredAuth,
  getStoredReadOnly,
  setStoredReadOnly,
} from './utils/helpers';
import {
  getAccessToken,
  initAuth,
} from './services/googleAuth';
import {
  getStoredSpreadsheetId,
  setStoredSpreadsheetId,
  findOrCreateOrderSpreadsheet,
  saveOrdersToGoogleSheet,
  fetchOrdersFromGoogleSheet,
  fetchPublicGoogleSheet,
} from './services/googleSheets';

import { LoginScreen } from './components/LoginScreen';
import { Header } from './components/Header';
import { MetricsCards } from './components/MetricsCards';
import { OrderTable } from './components/OrderTable';
import { OrderFormModal } from './components/OrderFormModal';
import { OrderDetailModal } from './components/OrderDetailModal';
import { QuotePreviewModal } from './components/QuotePreviewModal';
import { TrashBinModal } from './components/TrashBinModal';

import { triggerBirthdayBurst } from './utils/confetti';

// How often (ms) to pull the latest data from Google Sheets in the background.
const SHEET_POLL_INTERVAL_MS = 20000;

// Generates a globally unique internal identifier for an order, completely
// independent of the user-facing Quote Number. This is critical: the Quote
// Number is a free-text field and vendors like Amazon frequently have no
// quote number at all, so users type placeholders like "NA" — if that value
// were ever reused as the internal `id`, every order sharing that quote
// number would collide (same React key, same match target for edit/delete/
// status-change), corrupting/duplicating unrelated orders. `id` must always
// be unique; `quoteNumber` is free to repeat or say "NA".
function generateUniqueOrderId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `ord-${Date.now().toString(36)}-${rand}`;
}

// Self-heals any orders that are missing an id or share an id with another
// order (e.g. legacy data saved before the fix above, or rows imported/
// synced from a Google Sheet where the ID column was blank or duplicated).
// Keeps the first occurrence of each id untouched and reassigns a fresh,
// guaranteed-unique id to every subsequent duplicate.
function healDuplicateOrderIds(list: PurchaseOrder[]): { orders: PurchaseOrder[]; changed: boolean } {
  const seen = new Set<string>();
  let changed = false;

  const healed = list.map((o) => {
    const currentId = o.id && o.id.trim() ? o.id : '';
    if (!currentId || seen.has(currentId)) {
      changed = true;
      const newId = generateUniqueOrderId();
      seen.add(newId);
      return { ...o, id: newId };
    }
    seen.add(currentId);
    return o;
  });

  return { orders: healed, changed };
}

// Compares two order lists while ignoring `deliveryLogs`, since
// fetchOrdersFromGoogleSheet/fetchPublicGoogleSheet stamp a fresh
// "Loaded from synchronized Google Sheet" log entry on every call —
// without this, a poll tick would look like a change even when
// nothing in the sheet actually changed.
function areOrdersEquivalent(a: PurchaseOrder[], b: PurchaseOrder[]): boolean {
  const strip = (list: PurchaseOrder[]) =>
    [...list]
      .sort((x, y) => x.id.localeCompare(y.id))
      .map(({ deliveryLogs, ...rest }) => rest);
  return JSON.stringify(strip(a)) === JSON.stringify(strip(b));
}

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => getStoredAuth());
  const [isReadOnly, setIsReadOnly] = useState<boolean>(() => getStoredReadOnly());

  // Orders State loaded from local storage alternative (self-healed in case
  // any locally cached orders share a duplicate/missing id).
  const [orders, setOrders] = useState<PurchaseOrder[]>(
    () => healDuplicateOrderIds(loadStoredOrders(INITIAL_ORDERS)).orders
  );

  // Deleted Orders / Trash Bin State
  const [deletedOrders, setDeletedOrders] = useState<DeletedOrder[]>(() =>
    loadStoredDeletedOrders()
  );
  const [isTrashBinOpen, setIsTrashBinOpen] = useState(false);

  // Sync Status Indicator
  const [sheetSyncStatus, setSheetSyncStatus] = useState<'idle' | 'syncing' | 'saved' | 'error'>('idle');
  const isFirstRender = useRef(true);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);

  const [selectedOrderDetails, setSelectedOrderDetails] = useState<PurchaseOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [quotePreview, setQuotePreview] = useState<{ url: string; vendorName: string } | null>(
    null
  );

  // Refs used so the background poll always reads the latest values
  // without needing to restart its interval on every state change.
  const ordersRef = useRef(orders);
  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  const sheetSyncStatusRef = useRef(sheetSyncStatus);
  useEffect(() => {
    sheetSyncStatusRef.current = sheetSyncStatus;
  }, [sheetSyncStatus]);

  const isFormModalOpenRef = useRef(isFormModalOpen);
  useEffect(() => {
    isFormModalOpenRef.current = isFormModalOpen;
  }, [isFormModalOpen]);

  // --- Robust, race-free save handling -------------------------------------
  // syncLockRef is set to true the INSTANT an order is changed locally (synchronously,
  // no waiting for React state/effects to catch up) so the background poll can never
  // sneak in and overwrite an optimistic UI change with stale sheet data.
  // isSavingRef/pendingSaveRef turn concurrent edits into a strictly sequential queue —
  // only one write to the sheet is ever in flight, and it always ends up saving the
  // latest local state, so out-of-order network responses can no longer clobber a
  // newer status change with an older one.
  const syncLockRef = useRef(false);
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set right before setOrders() whenever the new data came FROM the sheet
  // (initial load, background poll, manual sync) rather than a local edit —
  // prevents an unnecessary/looping write-back of data we just read.
  const remoteUpdateRef = useRef(false);

  async function performSave() {
    if (isSavingRef.current) return;
    isSavingRef.current = true;

    while (pendingSaveRef.current) {
      pendingSaveRef.current = false;
      const snapshot = ordersRef.current;
      let success = false;

      // 1. Try Vercel Serverless API first
      try {
        const vercelRes = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'saveAll', orders: snapshot }),
        });
        if (vercelRes.ok) {
          const resData = await vercelRes.json();
          if (resData.success) success = true;
        }
      } catch (err) {
        // Vercel API not configured or offline
      }

      // 2. Fallback to client-side Google Sheets OAuth if the backend didn't handle it
      if (!success) {
        let token = getAccessToken();
        let sheetId = getStoredSpreadsheetId();

        if (token) {
          try {
            if (!sheetId) {
              sheetId = await findOrCreateOrderSpreadsheet(token);
              setStoredSpreadsheetId(sheetId);
            }
            if (sheetId) {
              await saveOrdersToGoogleSheet(token, sheetId, snapshot);
              success = true;
            }
          } catch (err) {
            console.error('Client Google Sheet save error:', err);
          }
        }
      }

      if (!success) {
        console.error('Failed to save orders — will retry on next change.');
      }
    }

    isSavingRef.current = false;
    syncLockRef.current = false;
    setSheetSyncStatus('saved');
    setTimeout(() => setSheetSyncStatus('idle'), 3000);
  }

  // Applies an order list fetched from the sheet/backend. If any orders are
  // missing an id or collide with another order's id (e.g. legacy data),
  // it heals them locally AND treats the result as a local edit (not a
  // remote update) so the corrected, unique ids get written straight back
  // to the sheet — permanently fixing the source of the corruption instead
  // of just papering over it in the UI.
  function applyFetchedOrders(fetched: PurchaseOrder[]) {
    const { orders: healed, changed } = healDuplicateOrderIds(fetched);
    if (!changed) {
      remoteUpdateRef.current = true;
    }
    setOrders(healed);
  }

  // Initialize Auth & initial Sheet fetch
  useEffect(() => {
    initAuth();

    const loadInitialData = async () => {
      // 1. First try Vercel Serverless Function /api/orders
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          if (data && data.configured && Array.isArray(data.orders)) {
            applyFetchedOrders(data.orders);
            setSheetSyncStatus('saved');
            setTimeout(() => setSheetSyncStatus('idle'), 3000);
            return;
          }
        }
      } catch (err) {
        console.log('Vercel API fetch error:', err);
      }

      // 2. Fallback to Google OAuth or stored Google Sheet ID
      let sheetId = getStoredSpreadsheetId();
      const token = getAccessToken();

      if (token && !sheetId) {
        try {
          sheetId = await findOrCreateOrderSpreadsheet(token);
          setStoredSpreadsheetId(sheetId);
        } catch (err) {
          console.log('Auto find/create sheet error:', err);
        }
      }

      if (sheetId) {
        if (token) {
          fetchOrdersFromGoogleSheet(token, sheetId)
            .then((fetched) => {
              if (fetched) {
                applyFetchedOrders(fetched);
                setSheetSyncStatus('saved');
                setTimeout(() => setSheetSyncStatus('idle'), 3000);
              }
            })
            .catch((err) => console.log('Auto fetch client sheet error:', err));
        } else {
          fetchPublicGoogleSheet(sheetId)
            .then((fetched) => {
              if (fetched) {
                applyFetchedOrders(fetched);
              }
            })
            .catch((err) => console.log('Public sheet auto fetch error:', err));
        }
      }
    };

    loadInitialData();
  }, []);

  // Save to LocalStorage & auto-save to Google Sheet DB whenever orders change.
  // The lock is engaged synchronously (see syncLockRef) so a background poll
  // firing in the same tick can never overwrite this change with stale data.
  useEffect(() => {
    saveOrdersToStorage(orders);

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (remoteUpdateRef.current) {
      // This update came from the sheet itself (initial load / poll / manual
      // sync) — no need to write it straight back.
      remoteUpdateRef.current = false;
      return;
    }

    if (isReadOnly) return;

    syncLockRef.current = true;
    pendingSaveRef.current = true;
    setSheetSyncStatus('syncing');

    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
    }
    // Debounce so rapid successive edits (e.g. changing several statuses back
    // to back) collapse into a single write of the final, latest state instead
    // of firing overlapping/out-of-order requests.
    saveDebounceRef.current = setTimeout(() => {
      performSave();
    }, 600);
  }, [orders, isReadOnly]);

  // Persist Trash Bin items to local storage
  useEffect(() => {
    saveDeletedOrdersToStorage(deletedOrders);
  }, [deletedOrders]);

  // Background polling: periodically pull the latest data from Google Sheets
  // so changes made elsewhere show up automatically without manual clicks.
  useEffect(() => {
    if (!isAuthenticated) return;

    const poll = async () => {
      if (document.visibilityState === 'hidden') return;
      if (syncLockRef.current) return;
      if (sheetSyncStatusRef.current === 'syncing') return;
      if (isFormModalOpenRef.current) return;

      // 1. Try Vercel Serverless API
      try {
        const vercelRes = await fetch('/api/orders');
        if (vercelRes.ok) {
          const data = await vercelRes.json();
          if (data && data.configured && Array.isArray(data.orders)) {
            if (!syncLockRef.current) {
              const { orders: healed, changed } = healDuplicateOrderIds(data.orders);
              if (changed) {
                // Duplicate/missing ids found in the sheet — heal them and
                // save the corrected, unique ids straight back.
                setOrders(healed);
              } else if (!areOrdersEquivalent(healed, ordersRef.current)) {
                remoteUpdateRef.current = true;
                setOrders(healed);
              }
            }
            return;
          }
        }
      } catch (err) {
        // Vercel API poll error
      }

      // 2. Fallback to client OAuth or public sheet ID
      const sheetId = getStoredSpreadsheetId();
      if (!sheetId) return;

      const token = getAccessToken();

      try {
        const fetched = token
          ? await fetchOrdersFromGoogleSheet(token, sheetId)
          : await fetchPublicGoogleSheet(sheetId);

        if (fetched && !syncLockRef.current) {
          const { orders: healed, changed } = healDuplicateOrderIds(fetched);
          if (changed) {
            setOrders(healed);
          } else if (!areOrdersEquivalent(healed, ordersRef.current)) {
            remoteUpdateRef.current = true;
            setOrders(healed);
          }
        }
      } catch (err) {
        console.log('Background sheet poll error:', err);
      }
    };

    const intervalId = setInterval(poll, SHEET_POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  // Auth Handlers
  const handleLoginSuccess = (readOnly: boolean) => {
    setStoredAuth(true);
    setStoredReadOnly(readOnly);
    setIsAuthenticated(true);
    setIsReadOnly(readOnly);
  };

  const handleLogout = () => {
    setStoredAuth(false);
    setStoredReadOnly(false);
    setIsAuthenticated(false);
    setIsReadOnly(false);
  };

  // Background Manual Google Sheet Sync Handler
  const handleManualSync = async () => {
    // Also cancel/absorb any pending debounced auto-save so it doesn't fire
    // a duplicate/overlapping write right after this manual one.
    if (saveDebounceRef.current) {
      clearTimeout(saveDebounceRef.current);
      saveDebounceRef.current = null;
    }
    pendingSaveRef.current = false;
    syncLockRef.current = true;
    setSheetSyncStatus('syncing');
    const startTime = Date.now();

    const finishSync = async (status: 'saved' | 'error') => {
      const elapsed = Date.now() - startTime;
      if (elapsed < 800) {
        await new Promise((r) => setTimeout(r, 800 - elapsed));
      }
      syncLockRef.current = false;
      setSheetSyncStatus(status);
      setTimeout(() => setSheetSyncStatus('idle'), 3000);
    };

    // Heal any duplicate/missing ids in the local list before writing it out,
    // so we never re-push the corruption back into the sheet.
    const { orders: ordersToSync, changed: healedLocally } = healDuplicateOrderIds(orders);
    if (healedLocally) {
      setOrders(ordersToSync);
    }

    try {
      // 1. Save and fetch latest via Vercel Serverless API
      const saveRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveAll', orders: ordersToSync }),
      });

      if (saveRes.ok) {
        const fetchRes = await fetch('/api/orders');
        if (fetchRes.ok) {
          const data = await fetchRes.json();
          if (data && data.configured && Array.isArray(data.orders)) {
            applyFetchedOrders(data.orders);
            await finishSync('saved');
            return;
          }
        }
      }

      // 2. Fallback to client OAuth or public sheet ID
      let token = getAccessToken();
      let sheetId = getStoredSpreadsheetId();

      if (token) {
        if (!sheetId) {
          sheetId = await findOrCreateOrderSpreadsheet(token);
          setStoredSpreadsheetId(sheetId);
        }
        if (sheetId) {
          await saveOrdersToGoogleSheet(token, sheetId, ordersToSync);
          const fetched = await fetchOrdersFromGoogleSheet(token, sheetId);
          if (fetched) {
            applyFetchedOrders(fetched);
          }
          await finishSync('saved');
          return;
        }
      } else if (sheetId) {
        const fetched = await fetchPublicGoogleSheet(sheetId);
        if (fetched) {
          applyFetchedOrders(fetched);
        }
        await finishSync('saved');
        return;
      }

      await finishSync('saved');
    } catch (err) {
      console.error('Manual background sync error:', err);
      await finishSync('error');
    }
  };

  // Order / Quote CRUD Handlers
  const handleCreateOrUpdateOrder = (orderData: Partial<PurchaseOrder>) => {
    if (orderData.status === 'Order Placed' || orderData.status === 'Delivered') {
      triggerBirthdayBurst();
    }

    if (editingOrder) {
      // Edit existing
      setOrders((prev) =>
        prev.map((o) =>
          o.id === editingOrder.id
            ? ({
                ...o,
                ...orderData,
                quoteNumber: orderData.quoteNumber || o.quoteNumber || o.id,
                quoteDate: orderData.quoteDate || o.quoteDate || o.createdAt.slice(0, 10),
                expiryDate: orderData.expiryDate !== undefined ? orderData.expiryDate : o.expiryDate,
                bankDetails: orderData.bankDetails || o.bankDetails,
              } as PurchaseOrder)
            : o
        )
      );
      if (selectedOrderDetails && selectedOrderDetails.id === editingOrder.id) {
        setSelectedOrderDetails((prev) => (prev ? { ...prev, ...orderData } : null));
      }
    } else {
      // Create new quote
      const qNum = orderData.quoteNumber || `QT-2026-${Math.floor(100 + Math.random() * 900)}`;
      const newQuote: PurchaseOrder = {
        id: generateUniqueOrderId(),
        quoteNumber: qNum,
        quoteDate: orderData.quoteDate || new Date().toISOString().slice(0, 10),
        expiryDate: orderData.expiryDate || undefined,
        createdAt: new Date().toISOString(),
        vendorName: orderData.vendorName || 'Unknown Vendor',
        amount: orderData.amount || 0,
        bankDetails: orderData.bankDetails || {
          bankName: 'HDFC Bank',
          accountName: orderData.vendorName || '',
          accountNumber: 'N/A',
          ifscCode: 'HDFC0000000',
        },
        driveQuoteLink: orderData.driveQuoteLink || '',
        status: orderData.status || 'Pending',
        deliveryLogs: [
          {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            note: 'Vendor Quote created.',
            updatedBy: 'Admin',
          },
        ],
      };
      setOrders((prev) => [newQuote, ...prev]);
    }
  };

  const handleDeleteOrder = (id: string) => {
    const targetOrder = orders.find((o) => o.id === id);
    if (targetOrder) {
      const deletedItem: DeletedOrder = {
        ...targetOrder,
        deletedAt: new Date().toISOString(),
        deletedBy: isReadOnly ? 'Guest' : 'Admin',
      };
      setDeletedOrders((prev) => [deletedItem, ...prev]);
    }

    setOrders((prev) => prev.filter((o) => o.id !== id));
    if (selectedOrderDetails?.id === id) {
      setIsDetailModalOpen(false);
      setSelectedOrderDetails(null);
    }
  };

  const handleRestoreOrder = (id: string) => {
    const itemToRestore = deletedOrders.find((d) => d.id === id);
    if (itemToRestore) {
      const { deletedAt, deletedBy, ...restoredOrder } = itemToRestore;
      setOrders((prev) => [restoredOrder, ...prev]);
      setDeletedOrders((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const handlePermanentDeleteOrder = (id: string) => {
    setDeletedOrders((prev) => prev.filter((d) => d.id !== id));
  };

  const handleEmptyTrash = () => {
    setDeletedOrders([]);
  };

  const handleStatusChange = (id: string, newStatus: OrderStatus) => {
    if (newStatus === 'Order Placed' || newStatus === 'Delivered') {
      triggerBirthdayBurst();
    }

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          const newLog = {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            note: `Status changed to '${newStatus}'.`,
            updatedBy: 'Admin',
          };
          return {
            ...o,
            status: newStatus,
            deliveryLogs: [newLog, ...(o.deliveryLogs || [])],
          };
        }
        return o;
      })
    );

    if (selectedOrderDetails?.id === id) {
      setSelectedOrderDetails((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              deliveryLogs: [
                {
                  id: `log-${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  note: `Status changed to '${newStatus}'.`,
                  updatedBy: 'Admin',
                },
                ...(prev.deliveryLogs || []),
              ],
            }
          : null
      );
    }
  };

  const handleAddDeliveryLog = (id: string, note: string) => {
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      note,
      updatedBy: 'Admin',
    };

    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, deliveryLogs: [newLog, ...(o.deliveryLogs || [])] } : o
      )
    );

    if (selectedOrderDetails?.id === id) {
      setSelectedOrderDetails((prev) =>
        prev
          ? {
              ...prev,
              deliveryLogs: [newLog, ...(prev.deliveryLogs || [])],
            }
          : null
      );
    }
  };

  const handleImportData = (importedOrders: PurchaseOrder[]) => {
    const { orders: healed } = healDuplicateOrderIds(importedOrders);
    setOrders(healed);
  };

  // Filtered Orders
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.quoteNumber || order.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.bankDetails?.bankName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.bankDetails?.accountNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.bankDetails?.ifscCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.amount ? order.amount.toString() : '').includes(searchTerm);

    const matchesStatus =
      selectedStatus === 'ALL' ? true : order.status === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  // Render Login Screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* App Header */}
      <Header
        orders={orders}
        isReadOnly={isReadOnly}
        syncStatus={sheetSyncStatus}
        deletedCount={deletedOrders.length}
        onOpenTrashBin={() => setIsTrashBinOpen(true)}
        onManualSync={handleManualSync}
        onNewOrder={() => {
          if (isReadOnly) return;
          setEditingOrder(null);
          setIsFormModalOpen(true);
        }}
        onImportData={handleImportData}
        onLogout={handleLogout}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedStatus={selectedStatus}
        onStatusFilterChange={setSelectedStatus}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Metrics Overview Cards */}
        <MetricsCards
          orders={orders}
          selectedStatus={selectedStatus}
          onSelectStatus={setSelectedStatus}
          isReadOnly={isReadOnly}
        />

        {/* Orders Table */}
        <OrderTable
          orders={filteredOrders}
          isReadOnly={isReadOnly}
          onSelectOrder={(order) => {
            setSelectedOrderDetails(order);
            setIsDetailModalOpen(true);
          }}
          onEditOrder={(order) => {
            if (isReadOnly) return;
            setEditingOrder(order);
            setIsFormModalOpen(true);
          }}
          onDeleteOrder={handleDeleteOrder}
          onStatusChange={handleStatusChange}
          onAddDeliveryLog={handleAddDeliveryLog}
          onOpenQuote={(url, vendorName) => setQuotePreview({ url, vendorName })}
        />
      </main>

      {/* Modals */}
      <OrderFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleCreateOrUpdateOrder}
        initialOrder={editingOrder}
      />

      <OrderDetailModal
        order={selectedOrderDetails}
        isOpen={isDetailModalOpen}
        isReadOnly={isReadOnly}
        onClose={() => setIsDetailModalOpen(false)}
        onStatusChange={handleStatusChange}
        onAddDeliveryLog={handleAddDeliveryLog}
        onOpenQuote={(url, vendorName) => setQuotePreview({ url, vendorName })}
        onEdit={(order) => {
          if (isReadOnly) return;
          setEditingOrder(order);
          setIsFormModalOpen(true);
        }}
        onDelete={handleDeleteOrder}
      />

      <QuotePreviewModal
        isOpen={!!quotePreview}
        onClose={() => setQuotePreview(null)}
        quoteUrl={quotePreview?.url || ''}
        vendorName={quotePreview?.vendorName || ''}
      />

      <TrashBinModal
        isOpen={isTrashBinOpen}
        onClose={() => setIsTrashBinOpen(false)}
        deletedOrders={deletedOrders}
        onRestoreOrder={handleRestoreOrder}
        onPermanentDeleteOrder={handlePermanentDeleteOrder}
        onEmptyTrash={handleEmptyTrash}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}
