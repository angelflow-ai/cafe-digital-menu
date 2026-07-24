import outletService from "./services/outletService";

const SELECTED_OUTLET_STORAGE_KEY = "infusion-selected-outlet";

function readStoredOutlet() {
  try {
    return JSON.parse(sessionStorage.getItem(SELECTED_OUTLET_STORAGE_KEY) || "null");
  } catch (error) {
    return null;
  }
}

function writeStoredOutlet(outlet) {
  try {
    if (outlet) sessionStorage.setItem(SELECTED_OUTLET_STORAGE_KEY, JSON.stringify(outlet));
    else sessionStorage.removeItem(SELECTED_OUTLET_STORAGE_KEY);
  } catch (error) {
    // Storage can fail in private/incognito contexts. The in-memory store still works.
  }
}

let currentOutlet = readStoredOutlet();
let availableOutlets = [];
let loading = false;
let loadPromise = null;
const listeners = new Set();

function getState() {
  return {
    currentOutlet,
    availableOutlets,
    loading
  };
}

function notify() {
  const state = getState();
  listeners.forEach((cb) => {
    try {
      cb(state);
    } catch (error) {
      // ignore listener errors
    }
  });
}

function setState(partial) {
  if (Object.prototype.hasOwnProperty.call(partial, "currentOutlet")) {
    console.log("[outletStore setState currentOutlet]", {
      from: currentOutlet?.slug || "none",
      to: partial.currentOutlet?.slug || "none",
      stack: new Error().stack
    });
    currentOutlet = partial.currentOutlet;
  }
  if (Object.prototype.hasOwnProperty.call(partial, "availableOutlets")) availableOutlets = partial.availableOutlets;
  if (Object.prototype.hasOwnProperty.call(partial, "loading")) loading = partial.loading;
  if (Object.prototype.hasOwnProperty.call(partial, "currentOutlet")) writeStoredOutlet(currentOutlet);
  notify();
}

export async function loadOutlets() {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    setState({ loading: true });
    try {
      const outlets = await outletService.getAllOutlets();
      const nextOutlets = Array.isArray(outlets) ? outlets : [];
      const currentId = currentOutlet?._id || currentOutlet?.id;
      const currentSlug = currentOutlet?.slug;
      const nextCurrent = nextOutlets.find((outlet) => {
        return (currentId && String(outlet._id || outlet.id || "") === String(currentId)) || (currentSlug && outlet.slug === currentSlug);
      }) || nextOutlets[0] || currentOutlet;
      setState({ availableOutlets: nextOutlets, currentOutlet: nextCurrent, loading: false });
      return nextOutlets;
    } catch (error) {
      setState({ loading: false });
      throw error;
    }
  })();

  try {
    return await loadPromise;
  } finally {
    loadPromise = null;
  }
}

export function selectOutlet(outlet) {
  console.log("[outletStore selectOutlet called]", {
    inputOutletSlug: outlet?.slug || "none",
    stack: new Error().stack
  });
  if (!outlet) {
    setState({ currentOutlet: null });
    return null;
  }

  const outletId = outlet._id || outlet.id;
  const outletSlug = outlet.slug;
  const selected = availableOutlets.find((item) => {
    return (outletId && String(item._id || item.id || "") === String(outletId)) || (outletSlug && item.slug === outletSlug);
  }) || outlet;

  setState({ currentOutlet: selected });
  return selected;
}

export async function refreshOutlet() {
  if (!currentOutlet) {
    await loadOutlets();
    return currentOutlet;
  }

  const outletId = currentOutlet._id || currentOutlet.id;
  const outletSlug = currentOutlet.slug;
  const refreshed = outletSlug
    ? await outletService.getOutletBySlug(outletSlug)
    : outletId
      ? await outletService.getOutletById(outletId)
      : null;

  if (refreshed) selectOutlet(refreshed);
  return refreshed || currentOutlet;
}

export function subscribe(cb) {
  listeners.add(cb);
  try {
    cb(getState());
  } catch (error) {}
  return () => listeners.delete(cb);
}

export default {
  getState,
  loadOutlets,
  selectOutlet,
  refreshOutlet,
  subscribe
};
