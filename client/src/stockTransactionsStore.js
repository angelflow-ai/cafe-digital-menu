// Stock Transactions Store
// Manages persistent stock transaction records

let transactions = [];
let initialized = false;
const listeners = new Set();

function normalizeOutletValue(value) {
  if (value == null || value === "") return "";
  return String(value).trim().replace(/^outlet-/, "").replace(/^ObjectId\((.*)\)$/, "$1").trim();
}

function matchesCurrentOutlet(transaction, activeOutletId = null, legacyDefaultOutletId = null) {
  if (!activeOutletId) return true;

  const currentOutletId = normalizeOutletValue(activeOutletId);
  if (!currentOutletId) return true;

  const transactionOutletId = normalizeOutletValue(transaction?.outletId ?? transaction?.outletSlug ?? "");
  if (transactionOutletId) return transactionOutletId === currentOutletId;

  const legacyOutletId = normalizeOutletValue(legacyDefaultOutletId || "near-skit");
  return legacyOutletId === currentOutletId;
}

function notify() {
  listeners.forEach(cb => cb(transactions));
}

export function loadTransactions(activeOutletId = null, legacyDefaultOutletId = null) {
  if (initialized && !activeOutletId && !legacyDefaultOutletId) return transactions;

  const saved = JSON.parse(localStorage.getItem("stockTransactions") || "[]");
  transactions = Array.isArray(saved) ? saved : [];
  initialized = true;

  if (activeOutletId || legacyDefaultOutletId) {
    return transactions.filter((transaction) => matchesCurrentOutlet(transaction, activeOutletId, legacyDefaultOutletId));
  }

  return transactions;
}

export function getTransactions(activeOutletId = null, legacyDefaultOutletId = null) {
  if (!activeOutletId && !legacyDefaultOutletId) return transactions;
  return transactions.filter((transaction) => matchesCurrentOutlet(transaction, activeOutletId, legacyDefaultOutletId));
}

export function addTransaction(itemName, quantity, unit, note = "", purchasePrice = null, outletId = null) {
  const transaction = {
    id: Date.now().toString(),
    itemName,
    quantityAdded: quantity,
    unit,
    timestamp: new Date().toISOString(),
    note,
    purchasePrice,
    outletId: outletId ? String(outletId) : null
  };

  transactions = [transaction, ...transactions];
  localStorage.setItem("stockTransactions", JSON.stringify(transactions));
  notify();
  return transaction;
}

export function getRecentTransactions(limit = 20, activeOutletId = null, legacyDefaultOutletId = null) {
  return getTransactions(activeOutletId, legacyDefaultOutletId).slice(0, limit);
}

export function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function clearTransactions() {
  transactions = [];
  localStorage.removeItem("stockTransactions");
  notify();
}

// Listen for storage changes across tabs
window.addEventListener("storage", (e) => {
  if (e.key === "stockTransactions") {
    const updated = JSON.parse(e.newValue || "[]");
    transactions = Array.isArray(updated) ? updated : [];
    notify();
  }
});

// Dispatch custom events for in-tab sync
window.addEventListener("stockTransactionAdded", (e) => {
  const updated = JSON.parse(localStorage.getItem("stockTransactions") || "[]");
  transactions = Array.isArray(updated) ? updated : [];
  notify();
});

export default {
  loadTransactions,
  getTransactions,
  addTransaction,
  getRecentTransactions,
  subscribe,
  clearTransactions
};
