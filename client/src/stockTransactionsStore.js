// Stock Transactions Store
// Manages persistent stock transaction records

let transactions = [];
let initialized = false;
const listeners = new Set();

function notify() {
  listeners.forEach(cb => cb(transactions));
}

export function loadTransactions() {
  if (initialized) return transactions;
  const saved = JSON.parse(localStorage.getItem("stockTransactions") || "[]");
  transactions = saved;
  initialized = true;
  return transactions;
}

export function getTransactions() {
  return transactions;
}

export function addTransaction(itemName, quantity, unit, note = "") {
  const transaction = {
    id: Date.now().toString(),
    itemName,
    quantityAdded: quantity,
    unit,
    timestamp: new Date().toISOString(),
    note
  };
  
  transactions = [transaction, ...transactions];
  localStorage.setItem("stockTransactions", JSON.stringify(transactions));
  notify();
  return transaction;
}

export function getRecentTransactions(limit = 20) {
  return transactions.slice(0, limit);
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
    transactions = updated;
    notify();
  }
});

// Dispatch custom events for in-tab sync
window.addEventListener("stockTransactionAdded", (e) => {
  const updated = JSON.parse(localStorage.getItem("stockTransactions") || "[]");
  transactions = updated;
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
