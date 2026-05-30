import React, { useEffect, useMemo, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  CakeSlice,
  Coffee,
  CupSoda,
  Filter,
  ArrowDown,
  ArrowUp,
  LayoutDashboard,
  LogOut,
  Menu,
  Minus,
  Pencil,
  Plus,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Utensils,
  Sandwich,
  X,
  Instagram
} from "lucide-react";
import "./styles.css";
import QRCode from "qrcode";
import PrintableReceipt, { normalizeReceiptOrder } from "./PrintableReceipt";
import logoUrl from "./assets/infusion-saga-logo.png";
import ordersStore from "./ordersStore";
import sync from "./sync";
import inventoryStore from "./inventoryStore";
import demoMode from "./demoMode";
import { imageUrl } from "./utils/imageHelper";
import { normalizeMenuItem, filterMenuItems } from "./utils/filterMenuItems";
import { subcategoryConfig } from "./data/menuData";
import { CategoryChips, SubcategoryChips } from "./components/CategoryFilters";
import CustomerMenu from "./components/CustomerMenu";
import MenuItemCard from "./components/MenuItemCard";
import { addToCart as addCartItem, calculateTotals, loadCartFromStorage, parseCartStorageValue, saveCartToStorage, updateQuantity as updateCartQuantity } from "./utils/cartHelpers";
import { createOrderStatusUpdatePayload, endOfDay, generateOrderId, getOrderDate, isValidSalesOrder, isCompletedSale, normalizeOrder, preparePrintableOrder, startOfDay } from "./utils/orderHelpers";
import { buildUpiString, createQrDataUrl, getPaymentFlowState, getPaymentOutcomeCopy } from "./utils/paymentHelpers";
import { formatOrderItemLine, getBasePrice, getAddonEachText, getOrderTotal } from "./utils/orderDisplayFormatter";
import { api, API, API_ROOT } from "./services/apiClient";
import orderService from "./services/orderService";
import paymentService from "./services/paymentService";
import authService from "./services/authService";
import menuService from "./services/menuService";

const TEST_UPI_CONFIG = {
  upiId: import.meta.env.VITE_TEST_UPI_ID || "9929637525-2@axl",
  payeeName: import.meta.env.VITE_TEST_UPI_PAYEE_NAME || "Angel Saini",
  staticQrImage: import.meta.env.VITE_PAYMENT_QR || "/testing-scanner.png"
};

function normalizeBillerVerificationStatus(value) {
  return String(value || "").toLowerCase().trim().replace(/[\s-]+/g, "_");
}

function isPendingVerificationOrder(order) {
  const status = normalizeBillerVerificationStatus(order?.status);
  const paymentStatus = normalizeBillerVerificationStatus(order?.paymentStatus);
  return ["pending_verification", "rejected", "payment_rejected", "payment_issue"].includes(status) || ["pending_verification", "rejected", "payment_rejected", "payment_issue"].includes(paymentStatus);
}

// Simple non-blocking toast helper used for payment retry UX (no alert popups)
function showToast(message, duration = 3000) {
  try {
    const id = `infusion-toast-${Date.now()}`;
    const el = document.createElement('div');
    el.id = id;
    el.textContent = message;
    Object.assign(el.style, {
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '8px 14px',
      borderRadius: '999px',
      background: 'rgba(17,24,39,0.95)',
      color: 'white',
      fontWeight: '700',
      zIndex: 9999,
      boxShadow: '0 6px 18px rgba(0,0,0,0.2)'
    });
    document.body.appendChild(el);
    setTimeout(() => { el.style.transition = 'opacity 200ms ease'; el.style.opacity = '0'; }, duration - 300);
    setTimeout(() => { try { document.body.removeChild(el); } catch (e) {} }, duration);
  } catch (e) {
    console.log('Toast:', message);
  }
}

function rupees(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function OrderLineCard({ line }) {
  const safeLine = line || {};
  const quantity = Number(safeLine.quantity ?? safeLine.qty ?? 1);
  const basePrice = getBasePrice(safeLine);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/85 px-4 py-3 shadow-sm">
      <p className="mt-2 text-sm font-bold leading-6 text-stone-900">{formatOrderItemLine(safeLine)}</p>
    </div>
  );
}

function priceText(item, selectedSizeId) {
  if (!item?.sizes?.length) return rupees(0);
  if (selectedSizeId) return rupees(item.sizes.find((size) => size.id === selectedSizeId)?.price ?? item.sizes[0].price);
  const prices = item.sizes.map((size) => Number(size.price));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? rupees(min) : `${rupees(min)} - ${rupees(max)}`;
}

const serveOptionsByItemId = {
  "infusion-heritage-coffee": ["Kulhad", "Glass", "Cup"],
  "personal-blend-chai": ["Kulhad", "Glass"],
  "signature-infusion-chai": ["Kulhad", "Glass"],
  "hot-chocolate": ["Kulhad", "Glass", "Cup"],
  "core-coffee": ["Kulhad", "Glass", "Cup"],
  "black-coffee": ["Kulhad", "Glass", "Cup"]
};

function getServeOptions(item) {
  return serveOptionsByItemId[item.id] || [];
}

// centralized `api` client is provided by src/services/apiClient

function App() {
  const [route, setRoute] = useState(location.pathname);

  useEffect(() => {
    const onPop = () => setRoute(location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function navigate(path) {
    history.pushState(null, "", path);
    setRoute(path);
  }

  const normalizedRoute = route.replace(/\/+$/, "");
  if (normalizedRoute === "/counter") return <CustomerApp navigate={navigate} counterMode />;
  if (normalizedRoute === "/admin/forgot-password") return <ForgotPassword navigate={navigate} role="admin" />;
  if (normalizedRoute === "/biller/forgot-password") return <ForgotPassword navigate={navigate} role="biller" />;
  if (normalizedRoute === "/order/biller") return <BillerApp navigate={navigate} />;
  if (normalizedRoute === "/order/admin") return <OwnerApp navigate={navigate} />;
  if (normalizedRoute === "/order" || normalizedRoute === "/order/") return <CustomerApp navigate={navigate} />;
  if (route.startsWith("/order/")) {
    const orderId = route.replace("/order/", "");
    if (!orderId) return <CustomerApp navigate={navigate} />;
    return <OrderTracking orderId={orderId} />;
  }
  if (route.startsWith("/admin")) return <OwnerApp navigate={navigate} />;
  if (route.startsWith("/biller")) return <BillerApp navigate={navigate} />;
  return <CustomerApp navigate={navigate} />;
}

function CustomerApp({ navigate, counterMode = false }) {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategoryId] = useState("all");
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [query, setQuery] = useState("");
  const [detail, setDetail] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(null);
  const [orderOnCounter, setOrderOnCounter] = useState(false);
  const [cart, setCart] = useState(() => loadCartFromStorage());
  const [loading, setLoading] = useState(true);
  const [appError, setAppError] = useState(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState(null);
  const [counterModalOpen, setCounterModalOpen] = useState(false);

  function handleSetActiveCategory(categoryId) {
    setActiveCategoryId(categoryId);
    setSelectedSubcategory(null);
  }

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const retry = params.get("retryOrder");
      if (retry) {
        (async () => {
          try {
            const order = await api(`/orders/public/${retry}`);
            if (!order) return;
            const items = Array.isArray(order.items) ? order.items : [];
            const subtotal = items.reduce((sum, line) => sum + Number(line.unitPrice || line.price || 0) * Number(line.quantity || 1), 0);
            const total = Number(order.total ?? subtotal);
            setPendingPaymentData({
              customerName: order.customerName,
              phone: order.phone,
              tableNumber: order.tableNumber,
              orderId: order.orderId || order.id || order._id,
              items: items.map((line) => ({ itemId: line.itemId, sizeId: line.sizeId, quantity: line.quantity, serveType: line.serveType })),
              subtotal,
              total
            });
            setPaymentModalOpen(true);
            history.replaceState(null, "", window.location.pathname);
          } catch (error) {
            // ignore
          }
        })();
      }
    } catch (error) {}
  }, []);

  function handleOrderOnCounterClick() {
    if (counterMode) return navigate("/counter");
    setCounterModalOpen(true);
  }

  function openCart(onCounter = false) {
    setOrderOnCounter(onCounter);
    setCartOpen(true);
  }

  function closeCart() {
    setCartOpen(false);
    setOrderOnCounter(false);
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([api("/categories"), api("/menu")])
      .then(([categoryData, menuData]) => {
        setCategories(categoryData);
        setItems(menuData);
        setAppError(null);
      })
      .catch((error) => {
        if (!demoMode.isDemoModeEnabled()) {
          setAppError(error.message || "Unable to load menu data.");
        }
        try {
          setItems([
            {
              id: "demo-coffee",
              name: "Demo Coffee",
              description: "A sample coffee for UI verification.",
              image: "/assets/images/Hot Drinks/Hot Coffee/demo.jpg",
              sizes: [{ id: "regular", name: "Regular", label: "Regular", price: 68 }],
              categoryId: "hot-drinks"
            }
          ]);
        } catch (error) {}
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    saveCartToStorage(cart);
  }, [cart]);

  useEffect(() => {
    function onStorage(event) {
      if (!event.key) return;
      if (event.key === "infusion-cart") {
        setCart(parseCartStorageValue(event.newValue));
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const normalizedItems = useMemo(() => items.map(normalizeMenuItem), [items]);

  const filteredItems = useMemo(() => {
    return normalizedItems.filter((item) => {
      const matchesCategory = activeCategory === "all" || item.categoryId === activeCategory;
      const matchesSubcategory = !selectedSubcategory || item.subcategory === selectedSubcategory;
      const matchesQuery = !query || `${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesSubcategory && matchesQuery;
    });
  }, [normalizedItems, activeCategory, selectedSubcategory, query]);

  const cartTotals = calculateTotals(cart);

  function handleAddToCart(item, sizeId, quantity = 1, serveType = "", options = {}) {
    setCart((current) => addCartItem(current, item, sizeId, quantity, serveType, options));
  }

  function handleUpdateQuantity(key, delta) {
    setCart((current) => updateCartQuantity(current, key, delta));
  }

  async function placeOrder(customer) {
    if (customer.paymentMethod === "cash") {
      try {
        const request = await orderService.createCocRequest({
          ...customer,
          items: cart.map(({ itemId, sizeId, quantity, serveType, unitPrice, basePrice, lineTotal, name, addons }) => ({ itemId, sizeId, quantity, serveType, unitPrice, basePrice, lineTotal, name, addons }))
        });
        setCart([]);
        setCartOpen(false);
        setOrderPlaced(preparePrintableOrder({ ...request, pendingApproval: true, total: cartTotals.total, items: cart }));
        try { await ordersStore.loadOrders(); } catch (error) {}
        return;
      } catch (error) {
        if (demoMode.isDemoModeEnabled()) {
          const order = demoMode.createDemoOrder(
            customer,
            cart.map(({ itemId, sizeId, quantity, serveType, unitPrice, basePrice, lineTotal, name, addons }) => ({ itemId, sizeId, quantity, serveType, unitPrice, basePrice, lineTotal, name, addons }))
          );
          demoMode.addDemoOrder(order);
          setCart([]);
          setCartOpen(false);
          setOrderPlaced(preparePrintableOrder(order));
          try { await ordersStore.loadOrders(); } catch (error) {}
          return;
        }
        throw error;
      }
    }

    if (customer.paymentMethod === "online") {
      setPendingPaymentData({
        customerName: customer.customerName,
        phone: customer.phone,
        tableNumber: customer.tableNumber,
        orderId: generateOrderId(),
        items: cart.map(({ itemId, sizeId, quantity, serveType, unitPrice, basePrice, lineTotal, name, addons }) => ({ itemId, sizeId, quantity, serveType, unitPrice, basePrice, lineTotal, name, addons })),
        subtotal: cartTotals.total,
        total: cartTotals.total
      });
      setPaymentModalOpen(true);
      return;
    }

    const order = preparePrintableOrder(await orderService.createOrder({
      ...customer,
      items: cart.map(({ itemId, sizeId, quantity, serveType, unitPrice, basePrice, lineTotal, name, addons }) => ({ itemId, sizeId, quantity, serveType, unitPrice, basePrice, lineTotal, name, addons }))
    }));
    setCart([]);
    setCartOpen(false);
    setOrderPlaced(order);
    try { await ordersStore.loadOrders(); } catch (error) {}
  }

  async function handleIHavePaid() {
    if (!pendingPaymentData) return;
    try {
      const orderKey = pendingPaymentData.orderId;
      let existing = null;
      try {
        existing = await orderService.getPublicOrder(orderKey);
      } catch (error) {
        existing = null;
      }

      const isRetry = existing && ["rejected", "payment_rejected", "payment_issue"].includes(String(existing.paymentStatus || "").toLowerCase());
      if (existing && (existing._id || existing.id || existing.orderId)) {
        const publicId = existing.orderId || existing.id || existing._id;
        await orderService.retryPublicOrder(publicId);
      } else {
        const payload = {
          customerName: pendingPaymentData.customerName,
          phone: pendingPaymentData.phone,
          orderId: pendingPaymentData.orderId,
          tableNumber: pendingPaymentData.tableNumber,
          items: pendingPaymentData.items,
          paymentMethod: "UPI_INTENT_OR_STATIC_QR",
          paymentStatus: "pending_verification",
          status: "pending"
        };
        await orderService.createOrder(payload);
      }

      setPaymentModalOpen(false);
      setPendingPaymentData(null);
      showToast(isRetry ? "Payment resubmitted. Waiting for verification." : "Payment submitted. Waiting for verification.");
      navigate(`/order/${orderKey}`);
      try { await ordersStore.loadOrders(); } catch (error) {}
    } catch (error) {
      console.error("Failed to create or retry order after payment:", error);
      showToast(error.message || "Failed to submit order. Please try again.");
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,#f6dfc6_0%,#f9b8a9_38%,#f5e5ce_68%,#d8dec8_100%)] text-stone-950">
      <div className="pointer-events-none fixed -left-12 top-24 h-56 w-56 rounded-full bg-white/30 blur-3xl" />
      <div className="pointer-events-none fixed right-0 top-10 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl" />
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-7 px-4 py-5 sm:px-6 lg:px-8">
        <TopBar
          cartCount={cartTotals.itemCount}
          onCart={() => openCart(false)}
          onOrderOnCounter={handleOrderOnCounterClick}
          onBack={counterMode ? () => navigate("/") : undefined}
        />
        <BrandHeader query={query} setQuery={setQuery} />
        <CategoryChips categories={categories} active={activeCategory} setActive={handleSetActiveCategory} />
        {subcategoryConfig[activeCategory] ? (
          <SubcategoryChips options={subcategoryConfig[activeCategory]} active={selectedSubcategory} setActive={setSelectedSubcategory} />
        ) : null}

        <CustomerMenu
          filteredItems={filteredItems}
          loading={loading}
          appError={appError}
          counterMode={counterMode}
          onDetail={setDetail}
          onAdd={handleAddToCart}
        />
      </section>
      {detail && <DetailModal key={detail.id} item={detail} onClose={() => setDetail(null)} onAdd={handleAddToCart} />}
      {cartOpen && <CartDrawer cart={cart} total={cartTotals.total} onClose={closeCart} onQty={handleUpdateQuantity} onCheckout={placeOrder} orderOnCounter={counterMode} />}
      {orderPlaced && <OrderSuccess order={orderPlaced} onClose={() => setOrderPlaced(null)} />}
      {paymentModalOpen && pendingPaymentData && (
        <PaymentModal
          data={pendingPaymentData}
          onClose={() => { setPaymentModalOpen(false); setPendingPaymentData(null); }}
          onIHavePaid={handleIHavePaid}
        />
      )}
      {counterModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/25 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6 text-center">
            <h2 className="text-2xl font-black">Please visit the counter</h2>
            <p className="mt-4 text-sm text-stone-600">Please go to the counter and ask the biller to take your order.</p>
            <div className="mt-6 flex justify-center">
              <button onClick={() => setCounterModalOpen(false)} className="rounded-full bg-black px-6 py-3 font-black text-white">Okay</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ItemForm({ categories, editingItem, onCancelEdit, onSaved }) {
  const blankSize = () => ({ id: "", name: "", label: "", price: "", sortOrder: 1 });
  const [form, setForm] = useState({ name: "", categoryId: categories[0]?.id || "", description: "", image: "", active: true, featured: false, sizes: [blankSize()] });
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!form.categoryId && categories[0]) setForm((current) => ({ ...current, categoryId: categories[0].id }));
  }, [categories]);

  useEffect(() => {
    if (editingItem) {
      setForm({
        id: editingItem.id,
        name: editingItem.name,
        categoryId: editingItem.categoryId,
        description: editingItem.description || "",
        image: editingItem.image || "",
        active: editingItem.active !== false,
        featured: Boolean(editingItem.featured),
        sizes: editingItem.sizes.map((size, index) => ({ ...size, sortOrder: size.sortOrder ?? index + 1 }))
      });
      setMessage("");
    }
  }, [editingItem]);

  function updateSize(index, key, value) {
    setForm((current) => ({ ...current, sizes: current.sizes.map((size, i) => (i === index ? { ...size, [key]: value } : size)) }));
  }

  function moveSize(index, direction) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= form.sizes.length) return;
    const next = [...form.sizes];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    setForm({ ...form, sizes: next.map((size, i) => ({ ...size, sortOrder: i + 1 })) });
  }

  async function uploadPhoto(file) {
    if (!file) return;
    const body = new FormData();
    body.append("photo", file);
    const response = await fetch(`${API}/uploads`, { method: "POST", body, credentials: "include" });
    if (!response.ok) throw new Error("Photo upload failed");
    const data = await response.json();
    setForm((current) => ({ ...current, image: data.url }));
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    try {
      await api("/menu", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", categoryId: categories[0]?.id || "", description: "", image: "", active: true, featured: false, sizes: [blankSize()] });
      setMessage("Saved.");
      onSaved();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-[1.5rem] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-black">{editingItem ? "Edit item" : "Create item"}</h2>
        {editingItem && <button type="button" onClick={onCancelEdit} className="rounded-full bg-stone-100 px-3 py-2 text-xs font-black">Cancel</button>}
      </div>
      <div className="mt-4 space-y-3">
        <input required className="field bg-stone-50" placeholder="Item name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        <select required className="field bg-stone-50" value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
        <input className="field bg-stone-50" placeholder="Photo URL" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} />
        <label className="block rounded-2xl bg-stone-50 p-3 text-sm font-black text-stone-600">
          Upload photo
          <input type="file" accept="image/*" className="mt-2 block w-full text-xs" onChange={(event) => uploadPhoto(event.target.files?.[0]).catch((err) => setMessage(err.message))} />
        </label>
        <textarea className="field min-h-24 resize-none bg-stone-50" placeholder="Description" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        <div className="flex gap-4 text-sm font-bold">
          <label><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Active</label>
          <label><input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} /> Featured</label>
        </div>
        <div className="space-y-2 rounded-2xl bg-stone-50 p-3">
          <div className="flex items-center justify-between"><p className="font-black">Sizes and prices</p><button type="button" onClick={() => setForm({ ...form, sizes: [...form.sizes, { ...blankSize(), sortOrder: form.sizes.length + 1 }] })} className="rounded-full bg-black px-3 py-2 text-xs font-black text-white">Add size</button></div>
          {form.sizes.map((size, index) => (
            <div key={index} className="grid grid-cols-[1fr_0.7fr_0.8fr_auto_auto_auto] gap-2">
              <input required placeholder="Name" className="field bg-white p-3" value={size.name} onChange={(event) => updateSize(index, "name", event.target.value)} />
              <input required placeholder="Label" className="field bg-white p-3" value={size.label} onChange={(event) => updateSize(index, "label", event.target.value)} />
              <input required placeholder="Price" type="number" className="field bg-white p-3" value={size.price} onChange={(event) => updateSize(index, "price", event.target.value)} />
              <button type="button" onClick={() => moveSize(index, -1)} className="rounded-full bg-white p-3" aria-label="Move size up"><ArrowUp size={16} /></button>
              <button type="button" onClick={() => moveSize(index, 1)} className="rounded-full bg-white p-3" aria-label="Move size down"><ArrowDown size={16} /></button>
              <button type="button" onClick={() => setForm({ ...form, sizes: form.sizes.filter((_, i) => i !== index) })} className="rounded-full bg-white p-3"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
        {message && <p className="text-sm font-bold text-stone-600">{message}</p>}
        <button className="w-full rounded-full bg-black px-5 py-4 font-black text-white">Save item</button>
      </div>
    </form>
  );
}

function CategoryAdmin({ categories, onSaved }) {
  const [name, setName] = useState("");
  async function submit(event) {
    event.preventDefault();
    await api("/categories", { method: "POST", body: JSON.stringify({ name, sortOrder: categories.length + 1 }) });
    setName("");
    onSaved();
  }
  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="rounded-[1.5rem] bg-white p-4">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between border-b py-3 last:border-0">
            <span className="font-black">{category.name}</span>
            <button onClick={async () => { await api(`/categories/${category.id}`, { method: "DELETE" }); onSaved(); }} className="rounded-full p-2 hover:bg-red-50"><Trash2 size={17} /></button>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="rounded-[1.5rem] bg-white p-5">
        <h2 className="text-xl font-black">New category</h2>
        <input required className="field mt-4 bg-stone-50" placeholder="Category name" value={name} onChange={(event) => setName(event.target.value)} />
        <button className="mt-3 w-full rounded-full bg-black px-5 py-4 font-black text-white">Save category</button>
      </form>
    </section>
  );
}

  function handleUpdateQuantity(key, delta) {
    setCart((current) => updateCartQuantity(current, key, delta));
  }

  async function placeOrder(customer) {
    // if paymentMethod is cash, create a COC request for owner approval
    if (customer.paymentMethod === "cash") {
      try {
        const request = await orderService.createCocRequest({
          ...customer,
          items: cart.map(({ itemId, sizeId, quantity, serveType, unitPrice, basePrice, lineTotal, name, addons }) => ({ itemId, sizeId, quantity, serveType, unitPrice, basePrice, lineTotal, name, addons }))
        });
        setCart([]);
        setCartOpen(false);
        // show a pending confirmation modal
        setOrderPlaced(preparePrintableOrder({
          ...request,
          pendingApproval: true,
          total: cartTotals.total,
          items: cart
        }));
        try { await ordersStore.loadOrders(); } catch (e) {}
        return;
      } catch (err) {
        // In demo mode, create order directly
        if (demoMode.isDemoModeEnabled()) {
          console.log("Demo mode: creating order directly instead of COC request");
          const order = demoMode.createDemoOrder(
            customer,
            cart.map(({ itemId, sizeId, quantity, serveType, unitPrice, basePrice, lineTotal, name, addons }) => ({ 
              itemId, sizeId, quantity, serveType, unitPrice, basePrice, lineTotal, name, addons
            }))
          );
          demoMode.addDemoOrder(order);
          setCart([]);
          setCartOpen(false);
          setOrderPlaced(preparePrintableOrder(order));
          try { await ordersStore.loadOrders(); } catch (e) {}
          return;
        }
        throw err;
      }
    }

    // For online payments we use a static UPI QR modal for manual verification flow.
    if (customer.paymentMethod === "online") {
      setPendingPaymentData({
        customerName: customer.customerName,
        phone: customer.phone,
        tableNumber: customer.tableNumber,
        orderId: generateOrderId(),
        items: cart.map(({ itemId, sizeId, quantity, serveType, unitPrice, basePrice, lineTotal, name, addons }) => ({ itemId, sizeId, quantity, serveType, unitPrice, basePrice, lineTotal, name, addons })),
        subtotal: cartTotals.total,
        total: cartTotals.total
      });
      setPaymentModalOpen(true);
      return;
    }

    // fallback: create order directly
    const order = preparePrintableOrder(await orderService.createOrder({
      ...customer,
      items: cart.map(({ itemId, sizeId, quantity, serveType, unitPrice, basePrice, lineTotal, name, addons }) => ({ itemId, sizeId, quantity, serveType, unitPrice, basePrice, lineTotal, name, addons }))
    }));
    setCart([]);
    setCartOpen(false);
    setOrderPlaced(order);
      try { await ordersStore.loadOrders(); } catch (e) {}
  }

  async function handleIHavePaid() {
    if (!pendingPaymentData) return;
    // prevent duplicate submissions by disabling via modal state
    try {
      const orderKey = pendingPaymentData.orderId;
      // First check whether an order with same public orderId already exists to avoid duplicates
      let existing = null;
      try {
        existing = await orderService.getPublicOrder(orderKey);
      } catch (err) {
        existing = null;
      }

      const isRetry = existing && ['rejected', 'payment_rejected', 'payment_issue'].includes(String(existing.paymentStatus || '').toLowerCase());
        if (existing && (existing._id || existing.id || existing.orderId)) {
        // request a public retry on the existing order (no staff auth required)
        const publicId = existing.orderId || existing.id || existing._id;
        await orderService.retryPublicOrder(publicId);
      } else {
        const payload = {
          customerName: pendingPaymentData.customerName,
          phone: pendingPaymentData.phone,
          orderId: pendingPaymentData.orderId,
          tableNumber: pendingPaymentData.tableNumber,
          items: pendingPaymentData.items,
          paymentMethod: "UPI_INTENT_OR_STATIC_QR",
          paymentStatus: "pending_verification",
          status: "pending"
        };
        await orderService.createOrder(payload);
      }

      // Do NOT clear the cart here. Keep cart until the order is confirmed/cleared by tracking flow.
      setPaymentModalOpen(false);
      setPendingPaymentData(null);
      // Inform customer non-blocking and navigate to tracking page using the same orderId
      showToast(isRetry ? 'Payment resubmitted. Waiting for verification.' : 'Payment submitted. Waiting for verification.');
      navigate(`/order/${orderKey}`);
    } catch (err) {
      console.error("Failed to create or retry order after payment:", err);
      showToast(err.message || "Failed to submit order. Please try again.");
    }

  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,#f6dfc6_0%,#f9b8a9_38%,#f5e5ce_68%,#d8dec8_100%)] text-stone-950">
      <div className="pointer-events-none fixed -left-12 top-24 h-56 w-56 rounded-full bg-white/30 blur-3xl" />
      <div className="pointer-events-none fixed right-0 top-10 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl" />
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-7 px-4 py-5 sm:px-6 lg:px-8">
        <TopBar
          cartCount={cartTotals.itemCount}
          onCart={() => openCart(false)}
          onOrderOnCounter={handleOrderOnCounterClick}
          onBack={counterMode ? () => navigate("/") : undefined}
        />
        <BrandHeader query={query} setQuery={setQuery} />
        <CategoryChips categories={categories} active={activeCategory} setActive={handleSetActiveCategory} />
        {subcategoryConfig[activeCategory] ? (
          <SubcategoryChips
            options={subcategoryConfig[activeCategory]}
            active={selectedSubcategory}
            setActive={setSelectedSubcategory}
          />
        ) : null}

        <CustomerMenu
          filteredItems={filteredItems}
          loading={loading}
          appError={appError}
          counterMode={counterMode}
          onDetail={setDetail}
          onAdd={handleAddToCart}
        />
      </section>
      {detail && <DetailModal key={detail.id} item={detail} onClose={() => setDetail(null)} onAdd={handleAddToCart} />}
      {cartOpen && <CartDrawer cart={cart} total={cartTotal} onClose={closeCart} onQty={handleUpdateQuantity} onCheckout={placeOrder} orderOnCounter={counterMode} />}
      {orderPlaced && <OrderSuccess order={orderPlaced} onClose={() => setOrderPlaced(null)} />}
      {paymentModalOpen && pendingPaymentData && (
        <PaymentModal
          data={pendingPaymentData}
          onClose={() => { setPaymentModalOpen(false); setPendingPaymentData(null); }}
          onIHavePaid={handleIHavePaid}
        />
      )}
      {counterModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/25 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md p-6 text-center">
            <h2 className="text-2xl font-black">Please visit the counter</h2>
            <p className="mt-4 text-sm text-stone-600">Please go to the counter and ask the biller to take your order.</p>
            <div className="mt-6 flex justify-center">
              <button onClick={() => setCounterModalOpen(false)} className="rounded-full bg-black px-6 py-3 font-black text-white">Okay</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function PaymentModal({ data, onClose, onIHavePaid }) {
  const [submitting, setSubmitting] = useState(false);
  const [dynamicQrSrc, setDynamicQrSrc] = useState(null);
  const safeItems = Array.isArray(data?.items) ? data.items : [];

  if (!data || typeof data !== "object") {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center gap-6 p-4 pt-6 pb-12 sm:pt-10 sm:pb-10">
          <div className="upi-modal-container">
            <div className="upi-modal-header">
              <h2>Payment unavailable</h2>
              <p>Unable to load payment details. Please close and try again.</p>
            </div>
            <div className="upi-actions">
              <button onClick={onClose} className="upi-close-btn">Close</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const upiLink = buildUpiString({
    upiId: TEST_UPI_CONFIG.upiId,
    payeeName: TEST_UPI_CONFIG.payeeName,
    amount: data.total,
    orderId: data.orderId || ""
  });

  // Generate dynamic QR on mount/update
  useEffect(() => {
    async function generateDynamicQr() {
      try {
        if (!upiLink) return;
        const url = await createQrDataUrl(upiLink, { margin: 1, width: 280 });
        setDynamicQrSrc(url);
      } catch (err) {
        console.error("Failed to generate dynamic QR:", err);
        setDynamicQrSrc(null);
      }
    }
    generateDynamicQr();
  }, [upiLink]);

  function openUpiApp() {
    if (!upiLink) {
      alert("UPI link is not ready. Please check UPI ID configuration.");
      return;
    }
    try {
      window.location.href = upiLink;
    } catch (e) {
      try { window.location.href = upiLink; } catch (e2) { window.open(upiLink, "_self"); }
      console.warn("UPI intent failed", e);
    }
  }

  async function clickPaid() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onIHavePaid();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center gap-6 p-4 pt-6 pb-12 sm:pt-10 sm:pb-10">
        <div className="upi-modal-container">
          {/* Header */}
          <div className="upi-modal-header">
            <h2>Pay Using UPI</h2>
            <p>Order total and payment options are shown below.</p>
            <div className="upi-amount">{rupees(data.total)}</div>
          </div>

          {/* Pay with UPI App Button */}
          <button onClick={openUpiApp} className="upi-primary-btn">
            Pay with UPI App
          </button>

          {/* QR Code Card */}
          <div className="upi-qr-card">
            <p>Scan this QR or tap Pay with UPI App.</p>
            <div className="qr-center">
              {dynamicQrSrc ? (
                <img
                  src={dynamicQrSrc}
                  alt="UPI QR (Dynamic)"
                  className="upi-qr-image"
                  onError={() => console.error("Dynamic QR image failed to render")}
                />
              ) : TEST_UPI_CONFIG.staticQrImage ? (
                <img
                  src={TEST_UPI_CONFIG.staticQrImage}
                  alt="UPI QR (Static)"
                  className="upi-qr-image"
                  onError={() => console.error("Static QR image failed to load:", TEST_UPI_CONFIG.staticQrImage)}
                />
              ) : (
                <p style={{ color: "#475569", fontSize: "12px" }}>QR unavailable. Use Pay with UPI App instead.</p>
              )}
            </div>
            <p className="upi-id">{TEST_UPI_CONFIG.upiId}</p>
          </div>

          {/* Action Buttons */}
          <div className="upi-actions">
            <button onClick={clickPaid} disabled={submitting} className="upi-paid-btn">
              {submitting ? "Processing..." : "I Have Paid"}
            </button>
            <button onClick={onClose} className="upi-close-btn">
              Close
            </button>
          </div>

          {/* Order Summary */}
          <div className="upi-order-summary">
            <p className="upi-order-summary-header">{data.customerName}</p>
            <p>{data.phone} • Table {data.tableNumber}</p>
            <div style={{ marginTop: "8px" }}>
              {safeItems.map((line, idx) => (
                <p key={idx}>• {formatOrderItemLine(line)}</p>
              ))}
            </div>
            <p className="upi-order-summary-header" style={{ marginTop: "8px" }}>Total: {rupees(data.total)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderTracking({ orderId }) {
  const [order, setOrder] = useState(null);
  const [modal, setModal] = useState({ show: false, type: null });
  const prevStatusRef = useRef(null);
  const [showTalkText, setShowTalkText] = useState(false);
  const [payModalOpenLocal, setPayModalOpenLocal] = useState(false);
  const [retryPaymentData, setRetryPaymentData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const MAX_RETRIES = 15; // 15 retries * 3000ms = 45 seconds max wait
    const RETRY_INTERVAL = 3000;

    async function load() {
      try {
        const data = await orderService.getPublicOrder(orderId);
        if (!mounted) return;
        setOrder(preparePrintableOrder(data));
        setRetryCount(0);
        setNotFound(false);
      } catch (err) {
        if (!mounted) return;
        console.error("Failed to load order:", err);
        
        // Check if this is a 404 (order not found)
        if (err.status === 404 || (err.message && err.message.includes("404"))) {
          // Try localStorage as fallback before giving up
          try {
            const storedOrders = JSON.parse(localStorage.getItem("infusion-orders") || "[]");
            const match = storedOrders.find(
              (o) => String(o._id || o.id || o.orderId) === String(orderId)
            );
            if (match) {
              setOrder(preparePrintableOrder(match));
              setNotFound(false);
              return;
            }
          } catch (e) {
            // ignore localStorage errors
          }
          
          // If still no order after localStorage check, mark as not found but retry a few more times
          setRetryCount((prev) => {
            const next = prev + 1;
            if (next >= MAX_RETRIES) {
              setNotFound(true);
            }
            return next;
          });
        } else {
          // Network or other error, increment retry
          setRetryCount((prev) => {
            const next = prev + 1;
            if (next >= MAX_RETRIES) {
              setNotFound(true);
            }
            return next;
          });
        }
      }
    }

    load();
    const timer = setInterval(() => {
      setRetryCount((prev) => {
        const next = prev + 1;
        if (next >= MAX_RETRIES) {
          setNotFound(true);
          return next;
        }
        return next;
      });
      if (retryCount < MAX_RETRIES) {
        load();
      }
    }, RETRY_INTERVAL);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [orderId]);

  useEffect(() => {
    if (!order) return;
    const prev = prevStatusRef.current;
    const current = getPaymentFlowState(order.paymentStatus).normalizedStatus;
    if (prev !== current) {
      if (prev === 'payment issue' && current !== 'payment issue') {
        setModal({ show: false, type: null });
        setShowTalkText(false);
      }
      if (current === 'confirmed') {
        setModal({ show: true, type: 'confirmed' });
        setTimeout(() => {
          setModal({ show: false, type: null });
          try { localStorage.removeItem('infusion-cart'); } catch (e) {}
          window.location.href = '/';
        }, 2000);
      }
      if (current === 'payment issue' || current === 'rejected' || current === 'payment rejected') {
        setModal({ show: true, type: 'payment_issue' });
        // do NOT redirect or clear cart — customer stays on page until issue is resolved
      }
    }
    prevStatusRef.current = current;
  }, [order]);

  const paymentState = getPaymentFlowState(order?.paymentStatus);
  const paymentCopy = getPaymentOutcomeCopy(order?.paymentStatus);

  if (!order) {
    if (notFound) {
      return (
        <div className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,#f6dfc6_0%,#f9b8a9_38%,#f5e5ce_68%,#d8dec8_100%)] text-stone-950 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-8 text-center">
            <h2 className="text-2xl font-black">Order Not Found</h2>
            <p className="mt-3 text-sm text-stone-600">
              We couldn't find your order (ID: {orderId}). It may not have been created yet. Please go back to the menu and try placing your order again.
            </p>
            <div className="mt-6">
              <a href="/" className="inline-block rounded-full bg-black px-6 py-3 font-black text-white">Back to Menu</a>
            </div>
          </div>
        </div>
      );
    }
    return <div className="p-8 text-center">Loading order...</div>;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(135deg,#f6dfc6_0%,#f9b8a9_38%,#f5e5ce_68%,#d8dec8_100%)] text-stone-950">
      <div className="pointer-events-none fixed -left-12 top-24 h-56 w-56 rounded-full bg-white/30 blur-3xl" />
      <div className="pointer-events-none fixed right-0 top-10 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl" />
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <div className="glass-card p-6">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">Order Tracking</p>
            <h1 className="mt-4 text-3xl font-black tracking-tight">Order ID: {order.orderId}</h1>
            <p className="mt-2 text-sm text-stone-600">Your order status and details are shown below.</p>
          </div>

          <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-2xl">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Payment Status</p>
            <div className="mt-3 flex items-center gap-4">
              <p className="text-xl font-black text-stone-950">
                  {paymentState.isPendingVerification ? paymentCopy.headline : (paymentState.isConfirmed ? paymentCopy.headline : order.status)}
              </p>
                {paymentState.isPendingVerification && (
                <div className="flex items-center gap-3">
                  <div className="loader" aria-hidden="true" />
                  <div className="pulsing-dots" aria-hidden="true"><span></span><span></span><span></span></div>
                </div>
              )}
            </div>

            <p className="mt-2 text-sm text-stone-600">
              {paymentState.isPendingVerification && paymentCopy.description}
              {paymentState.isConfirmed && paymentCopy.description}
              {paymentState.isPaymentIssue && (order.rejectionMessage || paymentCopy.description)}
            </p>
          </div>

          <div className="mt-6 rounded-[2rem] border border-slate-200 bg-white/90 p-6 shadow-2xl">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Order Items</p>
              <p className="text-sm text-stone-600">Table {order.tableNumber ?? order.table ?? "-"}</p>
            </div>
            <div className="mt-4 space-y-3 text-sm text-stone-700">
              {order.items.map((line, idx) => (
                <div key={idx} className="rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-black text-stone-950">{line.name}</p>
                  <p className="mt-1 text-xs text-stone-600">{line.sizeName || line.size || ""}{line.serveType ? ` • ${line.serveType}` : ""}</p>
                  <p className="mt-2 text-sm text-stone-700">{formatOrderItemLine(line)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {modal.show && modal.type === 'confirmed' && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
          <div className="rounded-2xl bg-white p-8 text-center shadow-2xl max-w-sm mx-4">
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-emerald-100 grid place-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-emerald-700" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8.414 8.414a1 1 0 01-1.414 0L3.293 11.12a1 1 0 011.414-1.414l2.586 2.586 7.707-7.707a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-black">Order Placed Successfully!</h3>
            <p className="mt-2 text-sm text-stone-600">Your payment has been verified and your order is now being prepared.</p>
          </div>
        </div>
      )}

      {modal.show && modal.type === 'payment_issue' && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/20">
          <div className="rounded-2xl bg-white p-6 text-center border border-rose-200 shadow-lg max-w-md mx-4">
            <div className="mx-auto mb-3 h-16 w-16 rounded-full bg-rose-100 grid place-items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-rose-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9V6a1 1 0 112 0v3a1 1 0 11-2 0zm0 4a1 1 0 112 0 1 1 0 01-2 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-rose-600">{paymentCopy.headline || "Payment Rejected"}</h3>
            <p className="mt-2 text-sm text-stone-600">{order.rejectionMessage || paymentCopy.description || "Your payment was not verified. Please check your payment or talk to the biller at the counter."}</p>
            <div className="mt-4 flex justify-center gap-3">
              <button onClick={async () => {
                // Close payment issue modal and open the existing PaymentModal with same order data
                try {
                  setModal({ show: false, type: null });
                  const items = (order.items || []).map((it) => ({
                    itemId: it.itemId,
                    sizeId: it.sizeId,
                    quantity: it.quantity,
                    serveType: it.serveType,
                    unitPrice: it.unitPrice || it.lineTotal / Math.max(1, it.quantity),
                    basePrice: it.basePrice,
                    lineTotal: it.lineTotal,
                    name: it.name,
                    addons: it.addons
                  }));
                  const subtotal = getOrderTotal({ items });
                  setRetryPaymentData({
                    customerName: order.customerName,
                    phone: order.phone,
                    tableNumber: order.tableNumber,
                    orderId: order.orderId || order.id || order._id,
                    items,
                    subtotal,
                    total: Number(order.total || subtotal)
                  });
                  setPayModalOpenLocal(true);
                } catch (e) {
                  showToast('Failed to open payment retry modal');
                }
              }} className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white">Check Payment / Try Again</button>
              <button onClick={() => { setShowTalkText(true); }} className="rounded-full bg-white border border-rose-200 px-4 py-2 text-sm font-black text-rose-600">Talk to Biller</button>
            </div>
            {showTalkText && <p className="mt-3 text-sm text-stone-700">Please visit the counter and talk to the biller for quick verification.</p>}
            <p className="mt-3 text-xs text-stone-500">Order ID: {order.orderId} • Table {order.tableNumber ?? order.table ?? '-'}</p>
          </div>
        </div>
      )}

      {payModalOpenLocal && retryPaymentData && (
        <PaymentModal
          data={retryPaymentData}
          onClose={() => { setPayModalOpenLocal(false); setRetryPaymentData(null); }}
                  onIHavePaid={async () => {
                    // When customer confirms payment here, request a public retry so staff can re-verify
                    try {
                      const key = retryPaymentData.orderId;
                      await orderService.retryPublicOrder(key);
                      setPayModalOpenLocal(false);
                      setRetryPaymentData(null);
                      // Inform customer non-blocking
                      showToast('Payment resubmitted. Waiting for verification.');
                      // OrderTracking will pick up SSE update and refresh order
                    } catch (e) {
                      console.error('Failed to retry payment for order:', e);
                      showToast('Failed to update order status. Please try again.');
                    }
                  }}
        />
      )}
    </main>
  );
}

function TopBar({ cartCount, onCart, onOrderOnCounter, onBack }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {onBack && (
          <button type="button" onClick={onBack} className="rounded-full bg-white/85 px-4 py-3 text-xs font-black text-stone-950 shadow-sm hover:bg-stone-100">
            Back
          </button>
        )}
        <a
          className="icon-button"
          aria-label="Visit our Instagram"
          href="https://www.instagram.com/theinfusionsaga?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
          target="_blank"
          rel="noopener noreferrer"
        >
          <Instagram size={22} />
        </a>
        <button
          type="button"
          onClick={onOrderOnCounter}
          className="rounded-full bg-black px-4 py-3 text-xs font-black text-white transition hover:bg-stone-800"
        >
          Order On Counter
        </button>
      </div>
      <div className="flex gap-3">
        <button className="icon-button relative bg-black text-white" aria-label="Open cart" onClick={onCart}>
          <ShoppingCart size={21} />
          {cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-300 px-1 text-[11px] font-black text-black">{cartCount}</span>}
        </button>
      </div>
    </div>
  );
}

function BrandHeader({ query, setQuery }) {
  return (
    <header className="mx-auto w-full max-w-3xl text-center">
      <img src={logoUrl} alt="The Infusion Saga - Where Every Sip Begins a Story" className="mx-auto h-auto w-full max-w-[360px] drop-shadow-[0_18px_32px_rgba(67,45,28,0.18)]" />
      <label className="relative mx-auto mt-6 flex max-w-xl items-center gap-3 rounded-full border border-white/60 bg-white/45 px-5 py-3 shadow-glass backdrop-blur-xl">
        <Search size={20} className="text-stone-500" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full bg-transparent pr-11 text-sm font-semibold outline-none placeholder:text-stone-500"
          placeholder="Search coffee, snacks, dessert..."
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1 text-sm font-black text-stone-600 transition hover:bg-white"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </label>
    </header>
  );
}



function DetailModal({ item, onClose, onAdd }) {
  const sizes = item?.sizes?.length
    ? item.sizes
    : [{ id: "default", name: "Regular", label: "Regular", price: item.price ?? 0 }];
  const [sizeId, setSizeId] = useState(sizes[0]?.id);
  const serveOptions = getServeOptions(item);
  const [serveType, setServeType] = useState(serveOptions[0] || "");
  const [quantity, setQuantity] = useState(1);
  const [extraCheese, setExtraCheese] = useState(false);

  // safe detection across category, subcategory and name (project uses subcategory for some items)
  const categoryStr = String(item.category || "").toLowerCase();
  const subcategoryStr = String(item.subcategory || "").toLowerCase();
  const nameStr = String(item.name || "").toLowerCase();

  const isBurger = categoryStr.includes("burger") || subcategoryStr.includes("burger") || nameStr.includes("burger");
  const isPizza = categoryStr.includes("pizza") || subcategoryStr.includes("pizza") || nameStr.includes("pizza");
  const extraCheesePrice = isPizza ? 30 : isBurger ? 25 : 0;

  useEffect(() => {
    const currentSizes = item?.sizes?.length
      ? item.sizes
      : [{ id: "default", name: "Regular", label: "Regular", price: item.price ?? 0 }];
    setSizeId(currentSizes[0]?.id);
    setServeType(getServeOptions(item)[0] || "");
    setQuantity(1);
    // reset addon state when modal changes and log item details for debugging
    setExtraCheese(false);
    try {
      // temporary debug logs to verify incoming item data
      // eslint-disable-next-line no-console
      console.log("DetailModal item:", item?.name, item?.category, item?.subcategory);
    } catch (e) {}
  }, [item.id, item.sizes, item.price]);

  const basePrice = Number((sizes.find((s) => s.id === sizeId)?.price) || item.price || 0);
  const totalPrice = (basePrice + (extraCheese ? extraCheesePrice : 0)) * quantity;

  function handleAddToCart() {
    const addons = { extraCheese: !!extraCheese, extraCheesePrice: extraCheese ? extraCheesePrice : 0 };
    onAdd(item, sizeId, quantity, serveType, { addons });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="detail-modal w-full max-w-[380px]">
        <div className="detail-card">
          <div className="detail-header">
            <h2 className="detail-title">{item.name}</h2>
            <button type="button" onClick={onClose} className="detail-close" aria-label="Close">
              <X size={20} />
            </button>
          </div>

          <div className="detail-image-wrap">
            <img src={imageUrl(item.image)} alt={item.name} className="detail-image" />
          </div>

          <div className="detail-body">
            <div className="price-block">
              <span className="price-label">PRICE</span>
              <span className="price-value">{rupees(totalPrice)}</span>
            </div>

            {(isPizza || isBurger) && (
              <div className="section-block">
                <div className="section-label">Add-ons</div>
                <button
                  type="button"
                  onClick={() => setExtraCheese((v) => !v)}
                  className={`pill-button ${extraCheese ? 'selected' : ''}`}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: extraCheese ? '#000' : 'rgba(255,255,255,0.08)', display: 'grid', placeItems: 'center', color: extraCheese ? '#fff' : '#fff' }}>🧀</div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 900, fontSize: 14 }}>Extra Cheese</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>Add extra cheesy goodness</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 900 }}>{`+ Rs. ${extraCheesePrice}`}</div>
                </button>
              </div>
            )}

            {sizes.length > 1 && (
              <div className="section-block">
                <div className="section-label">Choose Size</div>
                <div className="pill-row">
                  {sizes.map((size) => (
                    <button
                      key={size.id}
                      type="button"
                      className={`pill-button ${sizeId === size.id ? 'selected' : ''}`}
                      onClick={() => setSizeId(size.id)}
                    >
                      {size.label || size.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {serveOptions.length > 0 && (
              <div className="section-block">
                <div className="section-label">Serve Options</div>
                <div className="pill-column">
                  {serveOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`pill-button pill-option ${serveType === option ? 'selected' : ''}`}
                      onClick={() => setServeType(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="quantity-block">
              <div className="quantity-card">
                <span className="qty-label">QUANTITY</span>
                <div className="qty-controls">
                  <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="qty-btn">-</button>
                  <span className="qty-num">{quantity}</span>
                  <button type="button" onClick={() => setQuantity((q) => q + 1)} className="qty-btn">+</button>
                </div>
              </div>
            </div>

            {/* TOTAL PRICE is shown within PRICE when needed; avoid duplicate display */}

            <button type="button" onClick={handleAddToCart} className="add-cart-btn">Add to cart</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeaturedPanel({ item, onAdd, onDetail }) {
  const sizes = item?.sizes?.length
    ? item.sizes
    : [{ id: "default", name: "Regular", label: "Regular", price: item.price ?? 0 }];
  const serveOptions = getServeOptions(item);
  const [sizeId, setSizeId] = useState(sizes[0]?.id);
  const [serveType, setServeType] = useState(serveOptions[0] || "");
  useEffect(() => {
    const currentSizes = item?.sizes?.length
      ? item.sizes
      : [{ id: "default", name: "Regular", label: "Regular", price: item.price ?? 0 }];
    setSizeId(currentSizes[0]?.id);
    setServeType(getServeOptions(item)[0] || "");
  }, [item?.id, item?.sizes, item?.price]);
  if (!item) return null;

  return (
    <aside className="glass-card relative hidden min-h-[620px] overflow-visible p-7 md:block">
      <button className="absolute left-5 top-5 rounded-full p-2 hover:bg-white/40" aria-label="Back">
        <X size={18} />
      </button>
      <img src={imageUrl(item.image)} alt="" className="mx-auto mt-8 aspect-square w-[112%] max-w-[440px] -translate-x-2 rounded-full object-cover drop-shadow-2xl" />
      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight">{item.name}</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-stone-700">{item.description}</p>
        </div>
      </div>
      {sizes.length > 1 && <div className="mt-5"><SizeSelector sizes={sizes} value={sizeId} setValue={setSizeId} /></div>}
      {serveOptions.length > 0 && (
        <div className="mt-5 rounded-3xl border border-stone-200 bg-white/85 p-4 text-sm">
          <p className="font-black text-stone-700">Choose Your Serve</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {serveOptions.map((option) => (
              <button key={option} type="button" onClick={() => setServeType(option)} className={`rounded-full px-3 py-2 text-xs font-black transition ${serveType === option ? "bg-black text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"}`}>
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="absolute bottom-7 left-7 right-7 flex items-end justify-between">
        <div>
          <p className="text-sm font-semibold text-stone-600">Total Price</p>
          <p className="mt-1 text-2xl font-black">{priceText(item, sizeId)}</p>
        </div>
        <div className="flex gap-3">
          <button className="rounded-full bg-white/45 px-5 py-4 font-black backdrop-blur" onClick={() => onDetail(item)}>Details</button>
          <button className="flex items-center gap-3 rounded-full bg-black px-5 py-4 font-black text-white shadow-xl" onClick={() => onAdd(item, sizeId, 1, serveType)}>
            Add to Cart <Plus className="rounded-full bg-white p-1 text-black" size={28} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function CartDrawer({ cart, total, onClose, onQty, onCheckout, orderOnCounter }) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const tables = Array.from({ length: 17 }, (_, i) => i + 1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function isValidName(value) {
    return /^[A-Za-z ]+$/.test(value.trim());
  }

  function isValidPhone(value) {
    return /^\d{10}$/.test(value);
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    if (!isValidName(customerName)) {
      setError("Name should contain only letters and spaces.");
      setSubmitting(false);
      return;
    }

    if (!isValidPhone(phone)) {
      setError("Phone number must be exactly 10 digits.");
      setSubmitting(false);
      return;
    }

    try {
      await onCheckout({ customerName, phone, tableNumber, paymentMethod });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/25 backdrop-blur-sm">
      <aside className="h-full w-full max-w-md overflow-y-auto bg-[#fff8ec]/95 p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black">Your cart</h2>
          <button className="icon-button" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="mt-5 space-y-3">
          {cart.length === 0 && <p className="rounded-3xl bg-white/60 p-5 text-sm font-semibold text-stone-600">Your cart is waiting for something delicious.</p>}
          {cart.map((line) => (
            <div key={line.key} className="flex gap-3 rounded-3xl bg-white/65 p-3">
              <img src={imageUrl(line.image)} alt="" className="h-20 w-20 rounded-2xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-black">{line.name}</p>
                <p className="text-xs font-bold text-stone-500">{line.sizeName}{line.serveType ? ` • ${line.serveType}` : ""} - {rupees(getBasePrice(line))} each</p>
                {line.addons?.extraCheese ? (
                  <p className="text-xs mt-1 font-semibold text-stone-600">{getAddonEachText(line)}</p>
                ) : null}
                <p className="mt-1 text-sm font-black">{rupees(line.lineTotal)}</p>
              </div>
              <div className="flex flex-col items-center justify-center gap-2">
                <button className="grid h-8 w-8 place-items-center rounded-full bg-black text-white" onClick={() => onQty(line.key, 1)}><Plus size={15} /></button>
                <span className="font-black">{line.quantity}</span>
                <button className="grid h-8 w-8 place-items-center rounded-full bg-white" onClick={() => onQty(line.key, -1)}><Minus size={15} /></button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-3xl bg-black p-5 text-white">
          <div className="mb-3 flex items-center justify-between text-sm font-bold"><span>Total</span><span className="text-2xl font-black">{rupees(total)}</span></div>
          <div className="space-y-2 text-xs text-white/80">
            {cart.map((line) => (
              <p key={line.key}>{formatOrderItemLine(line)}</p>
            ))}
          </div>
        </div>
        <p className="mt-3 inline-block rounded-full bg-amber-100/90 px-4 py-2 text-sm font-black text-amber-800 shadow-sm animate-pulse">Order Prep 15-20 mins</p>
        {cart.length > 0 && (
          <form onSubmit={submit} className="mt-5 space-y-3">
            <input
              required
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value.replace(/[^A-Za-z ]/g, ""))}
              placeholder="Name"
              className="field"
            />
            <input
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="Phone"
              className="field"
              type="tel"
              inputMode="numeric"
              maxLength={10}
            />
            <div className="space-y-3 rounded-3xl border border-stone-200 bg-white/80 p-4">
              <p className="text-sm font-black">Table no.</p>
              <div className="grid grid-cols-3 gap-3">
                {tables.map((number) => (
                  <label key={number} className={`flex cursor-pointer items-center gap-3 rounded-3xl border px-4 py-3 text-sm font-semibold transition ${tableNumber === String(number) ? "border-black bg-black text-white" : "border-stone-200 bg-white text-stone-800"}`}>
                    <input
                      type="radio"
                      name="tableNumber"
                      value={number}
                      checked={tableNumber === String(number)}
                      onChange={() => setTableNumber(String(number))}
                      required
                      className="h-4 w-4 accent-black"
                    />
                    Table {number}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-3 rounded-3xl border border-stone-200 bg-white/80 p-4">
              <p className="text-sm font-black">Payment Method</p>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex cursor-pointer items-center gap-3 rounded-3xl border px-4 py-3 text-sm font-semibold transition ${paymentMethod === "online" ? "border-black bg-black text-white" : "border-stone-200 bg-white text-stone-800"}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === "online"}
                    onChange={() => setPaymentMethod("online")}
                    required
                    className="h-4 w-4 accent-black"
                  />
                  Pay Online
                </label>
                <label className={`flex cursor-pointer items-center gap-3 rounded-3xl border px-4 py-3 text-sm font-semibold transition ${paymentMethod === "cash" ? "border-black bg-black text-white" : "border-stone-200 bg-white text-stone-800"}`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={() => setPaymentMethod("cash")}
                    required
                    className="h-4 w-4 accent-black"
                  />
                  Pay Cash (COC)
                </label>
              </div>
            </div>
            {error && <p className="text-sm font-bold text-red-700">{error}</p>}
            <button disabled={submitting || !tableNumber || !paymentMethod} className="w-full rounded-full bg-black px-5 py-4 font-black text-white disabled:opacity-60">{submitting ? "Processing..." : orderOnCounter ? "Order On Counter" : "Place Order"}</button>
          </form>
        )}
      </aside>
    </div>
  );
}

function OrderSuccess({ order, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/25 p-4 backdrop-blur-sm">
      <div className="glass-card w-full max-w-xl p-6 text-center no-print">
        <Sparkles className="mx-auto text-emerald-700" size={36} />
        <h2 className="mt-3 text-2xl font-black">{order.pendingApproval ? "Request submitted" : "Order placed"}</h2>
        <p className="mt-2 text-sm font-semibold text-stone-600">
          {order.pendingApproval ? "Your cash-on-counter request is awaiting owner approval." : "Your cafe order is in the kitchen queue."}
        </p>
        <p className="mt-4 text-3xl font-black">{rupees(order.total)}</p>
        <p className="mt-2 text-sm uppercase tracking-[0.24em] text-stone-500">Status: {order.status || (order.pendingApproval ? "pending approval" : "new")}</p>
        <div className="mt-6 flex justify-center">
          <button onClick={onClose} className="rounded-full bg-black px-6 py-3 font-black text-white">Done</button>
        </div>
      </div>
    </div>
  );
}

function OwnerApp({ navigate }) {
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.me().then((data) => setOwner(data.user?.role === "admin" ? data.user.email : null)).finally(() => setLoading(false));
  }, []);

  if (loading) return <OwnerShell><p className="font-bold">Loading...</p></OwnerShell>;
  if (!owner) return <Login role="admin" onLogin={setOwner} navigate={navigate} />;
  return <Dashboard owner={owner} onLogout={() => setOwner(null)} navigate={navigate} />;
}

function BillerApp({ navigate }) {
  const [biller, setBiller] = useState(null);
  const [orders, setOrders] = useState([]);
  const [cocRequests, setCocRequests] = useState([]);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const [billerTab, setBillerTab] = useState("orders");

  async function load() {
    try {
      const [cocData, itemData, categoryData] = await Promise.all([
          orderService.listCocRequests().catch(() => []),
          menuService.getMenu({ includeInactive: true }).catch(() => []),
          menuService.getCategories().catch(() => [])
        ]);
      // refresh centralized orders store first so we have latest data
      try { await ordersStore.loadOrders(); } catch (e) {}
      // orders come from centralized ordersStore
      setOrders(ordersStore.getOrders() || []);
      setCocRequests(cocData || []);
      setItems(itemData || []);
      setCategories(categoryData || []);
      setLastSync(new Date().toISOString());
    } catch (error) {
      console.error("Failed to load biller data:", error);
    }
  }

  useEffect(() => {
    authService.me().then((data) => setBiller(data.user?.role === "biller" ? data.user.email : null)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!biller) return;
    setLoading(true);
    const unsub = ordersStore.subscribe((data) => setOrders(data || []));
    Promise.all([ordersStore.loadOrders(), load()]).finally(() => setLoading(false));
    return () => unsub();
  }, [biller]);

  useEffect(() => {
    if (!biller) return;
    let es = null;
    let reconnectTimeout = null;
    
    function setupStream() {
      es = new EventSource(`${API}/orders/stream`, { withCredentials: true });
      const handleUpdate = () => {
        setLastSync(new Date().toISOString());
        load();
      };
      es.addEventListener("order:created", handleUpdate);
      es.addEventListener("order:updated", handleUpdate);
      es.addEventListener("coc:created", handleUpdate);
      es.onerror = () => {
        try { es.close(); } catch (e) {}
        es = null;
        // Reconnect after 3 seconds
        reconnectTimeout = setTimeout(() => setupStream(), 3000);
      };
    }
    
    setupStream();
    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      try { if (es) es.close(); } catch (e) {}
    };
  }, [biller]);

  if (loading) return <OwnerShell><p className="font-bold">Loading biller data...</p></OwnerShell>;
  if (!biller) return <Login role="biller" onLogin={setBiller} navigate={navigate} />;

  return (
    <OwnerShell>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-stone-500">Biller dashboard</p>
            <h1 className="text-4xl font-black tracking-tight">Biller page</h1>
            <p className="mt-1 text-xs text-stone-500">Live sync: {lastSync ? new Date(lastSync).toLocaleTimeString() : "waiting for updates..."}</p>
          </div>
          <div className="flex flex-col items-end gap-2 relative z-10">
            <div className="flex gap-2">
              <button onClick={() => navigate("/")} className="rounded-full bg-white px-4 py-3 text-sm font-black shadow">Customer app</button>
              <button onClick={() => navigate("/admin")} className="rounded-full bg-white px-4 py-3 text-sm font-black shadow">Owner app</button>
            </div>
            <div>
              <button onClick={() => setBillerTab("pos")} className="rounded-full bg-white px-4 py-3 text-sm font-black shadow">OOC (Order On Counter)</button>
            </div>
          </div>
        </div>
        <BillerPage orders={orders} cocRequests={cocRequests} items={items} categories={categories} onSaved={load} activeTab={billerTab} onChangeTab={setBillerTab} />
      </div>
    </OwnerShell>
  );
}

function OwnerShell({ children }) {
  return <main className="min-h-screen bg-[#f8efe2] p-4 text-stone-950 sm:p-6 lg:p-8">{children}</main>;
}

function Login({ onLogin, navigate, role }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const endpoint = role === "admin" ? "/auth/owner/login" : "/auth/biller/login";
      const data = await authService.request(endpoint, { email, password, role });
      onLogin(data.user.email);
    } catch (err) {
      setError(err.message);
    }
  }

  const roleLabel = role === "biller" ? "Biller" : "Owner";
  const forgotPath = role === "biller" ? "/biller/forgot-password" : "/admin/forgot-password";

  return (
    <OwnerShell>
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl place-items-center">
        <form onSubmit={submit} className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-glass">
          <button type="button" onClick={() => navigate("/")} className="mb-5 text-sm font-black text-stone-500">Back to cafe</button>
          <h1 className="text-3xl font-black">{roleLabel} login</h1>
          <p className="mt-2 text-sm font-semibold text-stone-600">Use your registered {roleLabel.toLowerCase()} email and password to sign in.</p>
          <div className="mt-6 space-y-3">
            <input className="field bg-stone-50" type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <input className="field bg-stone-50" type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => navigate(forgotPath)}
                className="text-sm font-semibold text-blue-700 hover:underline"
              >
                Forgot password?
              </button>
              {error && <p className="text-sm font-bold text-red-700">{error}</p>}
            </div>
            <button className="w-full rounded-full bg-black px-5 py-4 font-black text-white">Sign in</button>
          </div>
        </form>
      </div>
    </OwnerShell>
  );
}

function ForgotPassword({ navigate, role }) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState("request");

  const roleLabel = role === "biller" ? "Biller" : "Owner";
  const returnPath = role === "biller" ? "/biller" : "/admin";

  async function requestOtp(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    try {
      await authService.forgotPassword(email, role);
      setMessage("OTP sent to your email. Use it to reset your password.");
      setStep("reset");
    } catch (err) {
      setError(err.message);
    }
  }

  async function resetPassword(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await authService.resetPassword(email, otp, password);
      setMessage("Password reset successfully. You can now log in.");
      setStep("done");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <OwnerShell>
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl place-items-center">
        <form onSubmit={step === "request" ? requestOtp : resetPassword} className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-glass">
          <button type="button" onClick={() => navigate(returnPath)} className="mb-5 text-sm font-black text-stone-500">Back to login</button>
          <h1 className="text-3xl font-black">{roleLabel} password reset</h1>
          <p className="mt-2 text-sm font-semibold text-stone-600">
            Enter the registered {roleLabel.toLowerCase()} email and follow the OTP steps.
          </p>
          <div className="mt-6 space-y-4">
            <input
              className="field bg-stone-50"
              type="email"
              placeholder="Registered email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            {step !== "request" && (
              <>
                <input
                  className="field bg-stone-50"
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  required
                />
                <input
                  className="field bg-stone-50"
                  type="password"
                  placeholder="New password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <input
                  className="field bg-stone-50"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </>
            )}
            {error && <p className="text-sm font-bold text-red-700">{error}</p>}
            {message && <p className="text-sm text-emerald-700">{message}</p>}
            {step === "done" ? (
              <button type="button" onClick={() => navigate(returnPath)} className="w-full rounded-full bg-black px-5 py-4 font-black text-white">Go to login</button>
            ) : (
              <button className="w-full rounded-full bg-black px-5 py-4 font-black text-white">
                {step === "request" ? "Send OTP" : "Reset password"}
              </button>
            )}
          </div>
        </form>
      </div>
    </OwnerShell>
  );
}

function Dashboard({ owner, onLogout, navigate }) {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cocRequests, setCocRequests] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [reports, setReports] = useState({});
  const [lastSync, setLastSync] = useState(null);
  const [tab, setTab] = useState("items");
  const [initialBillerTab, setInitialBillerTab] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name");
  const [editingItem, setEditingItem] = useState(null);

  async function load() {
    try {
      const [categoryData, itemData, cocData, recipeData, reportData] = await Promise.all([
        menuService.getCategories(),
        menuService.getMenu({ includeInactive: true }),
        orderService.listCocRequests().catch(() => []),
        menuService.getRecipes().catch(() => []),
        menuService.getReports().catch(() => ({}))
      ]);
      await inventoryStore.loadInventory().catch(() => []);
      setCategories(categoryData);
      setItems(itemData);
      // orders & inventory come from centralized stores
      setOrders(ordersStore.getOrders() || []);
      setCocRequests(cocData || []);
      setRawMaterials(inventoryStore.getInventory() || []);
      setRecipes(recipeData || []);
      setReports(reportData || {});
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    }
  }

  useEffect(() => {
    const unsubOrders = ordersStore.subscribe((data) => { setOrders(data || []); setLastSync(new Date().toISOString()); });
    const unsubInventory = inventoryStore.subscribe((data) => setRawMaterials(data || []));
    Promise.all([ordersStore.loadOrders(), inventoryStore.loadInventory(), load()]).catch(() => {});
    
    let es = null;
    let reconnectTimeout = null;
    
    function setupStream() {
      es = new EventSource(`${API}/orders/stream`, { withCredentials: true });
      es.addEventListener("order:created", () => { setLastSync(new Date().toISOString()); load(); });
      es.addEventListener("order:updated", () => { setLastSync(new Date().toISOString()); load(); });
      es.addEventListener("coc:created", () => { setLastSync(new Date().toISOString()); load(); });
      es.onerror = () => {
        try { es.close(); } catch (e) {}
        es = null;
        // Reconnect after 3 seconds
        reconnectTimeout = setTimeout(() => setupStream(), 3000);
      };
    }
    
    setupStream();
    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      try { if (es) es.close(); } catch (e) {}
      unsubOrders();
      unsubInventory();
    };
  }, []);

  async function logout() {
    await authService.logout();
    onLogout();
  }

  const visibleItems = [...items]
    .filter((item) => !search || item.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (sort === "price" ? a.sizes[0].price - b.sizes[0].price : a.name.localeCompare(b.name)));

  return (
    <OwnerShell>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-stone-500">{owner}</p>
            <h1 className="text-4xl font-black tracking-tight">Owner Inventory Dashboard</h1>
            {lastSync && <p className="mt-1 text-xs text-stone-500">Last sync: {new Date(lastSync).toLocaleString()}</p>}
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <button onClick={() => navigate("/")} className="rounded-full bg-white px-4 py-3 text-sm font-black shadow">Customer app</button>
              <button onClick={() => navigate("/biller")} className="rounded-full bg-white px-4 py-3 text-sm font-black shadow">Biller app</button>
              <button onClick={logout} className="flex items-center gap-2 rounded-full bg-black px-4 py-3 text-sm font-black text-white"><LogOut size={17} /> Logout</button>
            </div>
            {tab === "biller" && (
              <div>
                <button
                  onClick={() => { setTab("biller"); setInitialBillerTab("pos"); }}
                  className="rounded-full bg-white px-4 py-3 text-sm font-black shadow"
                >
                  OOC (Order On Counter)
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="mb-5 flex flex-wrap gap-2">
          {[
            { key: "items", label: "Items" },
            { key: "categories", label: "Categories" },
            { key: "inventory", label: "Inventory" },
            { key: "stock", label: "Add Stock" },
            { key: "recipes", label: "Recipe Mapping" },
            { key: "lowstock", label: "Low Stock" },
            { key: "reports", label: "Reports" },
            { key: "history", label: "Order History" }
          ].map((tabItem) => (
            <button key={tabItem.key} onClick={() => setTab(tabItem.key)} className={`rounded-full px-5 py-3 text-sm font-black ${tab === tabItem.key ? "bg-black text-white" : "bg-white"}`}>
              {tabItem.label}
            </button>
          ))}
        </div>
        {tab === "items" && (
          <section className="grid gap-5 lg:grid-cols-[1fr_430px]">
            <div className="rounded-[1.5rem] bg-white p-4 shadow-sm">
              <div className="mb-4 flex flex-wrap gap-3">
                <label className="flex flex-1 items-center gap-2 rounded-full bg-stone-100 px-4 py-2"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search items" className="w-full bg-transparent text-sm font-bold outline-none" /></label>
                <label className="flex items-center gap-2 rounded-full bg-stone-100 px-4 py-2"><SlidersHorizontal size={18} /><select value={sort} onChange={(event) => setSort(event.target.value)} className="bg-transparent text-sm font-bold outline-none"><option value="name">Name</option><option value="price">Base price</option></select></label>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead><tr className="border-b text-xs uppercase text-stone-500"><th className="py-3">Item</th><th>Category</th><th>Sizes</th><th>Status</th><th></th></tr></thead>
                  <tbody>
                    {visibleItems.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-3 font-black">{item.name}</td>
                        <td>{categories.find((cat) => cat.id === item.categoryId)?.name || item.categoryId}</td>
                        <td>{item.sizes.map((size) => `${size.label} ${rupees(size.price)}`).join(" / ")}</td>
                        <td>{item.active ? "Active" : "Hidden"}</td>
                        <td>
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setEditingItem(item)} className="rounded-full p-2 hover:bg-stone-100" aria-label={`Edit ${item.name}`}><Pencil size={17} /></button>
                            <button onClick={async () => { await menuService.deleteMenuItem(item.id); setEditingItem(null); load(); }} className="rounded-full p-2 hover:bg-red-50" aria-label={`Delete ${item.name}`}><Trash2 size={17} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <ItemForm categories={categories} editingItem={editingItem} onCancelEdit={() => setEditingItem(null)} onSaved={() => { setEditingItem(null); load(); }} />
          </section>
        )}
        {tab === "categories" && <CategoryAdmin categories={categories} onSaved={load} />}
        {tab === "biller" && <BillerPage orders={orders} cocRequests={cocRequests} items={items} categories={categories} onSaved={load} initialTab={initialBillerTab} />}
        {tab === "inventory" && <InventoryAdmin rawMaterials={rawMaterials} onSaved={load} />}
        {tab === "stock" && <AddStockPage rawMaterials={rawMaterials} onSaved={load} />}
        {tab === "recipes" && <RecipeMapping items={items} rawMaterials={rawMaterials} recipes={recipes} onSaved={load} />}
        {tab === "lowstock" && <LowStockAlerts rawMaterials={rawMaterials} />}
        {tab === "reports" && <ReportsPage reports={reports} items={items} orders={orders} />}
        {tab === "history" && <OrderHistory orders={orders} />}
      </div>
    </OwnerShell>
  );
}

function BillerPage({ orders, cocRequests, items, categories, onSaved, activeTab = null, onChangeTab, initialTab = null }) {
  const [internalTab, setInternalTab] = useState((activeTab ?? initialTab) || "orders");
  const [seenPendingVerificationCount, setSeenPendingVerificationCount] = useState(0);
  const [hasPendingVerificationAlert, setHasPendingVerificationAlert] = useState(false);
  const [seenCocRequestCount, setSeenCocRequestCount] = useState(0);
  const [hasCocAlert, setHasCocAlert] = useState(false);
  const billerTab = activeTab ?? internalTab;
  const firstBillerRender = useRef(true);

  const pendingVerificationOrders = useMemo(() => {
    return (orders || []).filter(isPendingVerificationOrder);
  }, [orders]);

  const pendingVerificationCount = pendingVerificationOrders.length;
  const cocRequestCount = (cocRequests || []).length;

  useEffect(() => {
    if (firstBillerRender.current) {
      firstBillerRender.current = false;
      setSeenPendingVerificationCount(pendingVerificationCount);
      setSeenCocRequestCount(cocRequestCount);
      return;
    }

    if (billerTab === "verify") {
      setHasPendingVerificationAlert(false);
      setSeenPendingVerificationCount(pendingVerificationCount);
    } else if (pendingVerificationCount > seenPendingVerificationCount) {
      setHasPendingVerificationAlert(true);
      setSeenPendingVerificationCount(pendingVerificationCount);
    } else {
      setSeenPendingVerificationCount(pendingVerificationCount);
    }

    if (billerTab === "coc") {
      setHasCocAlert(false);
      setSeenCocRequestCount(cocRequestCount);
    } else if (cocRequestCount > seenCocRequestCount) {
      setHasCocAlert(true);
      setSeenCocRequestCount(cocRequestCount);
    } else {
      setSeenCocRequestCount(cocRequestCount);
    }
  }, [pendingVerificationCount, cocRequestCount, billerTab, seenPendingVerificationCount, seenCocRequestCount]);

  useEffect(() => {
    if (activeTab !== null && activeTab !== undefined) {
      setInternalTab(activeTab);
    } else if (initialTab) {
      setInternalTab(initialTab);
    }
  }, [activeTab, initialTab]);

  const handleTabChange = (key) => {
    if (onChangeTab) return onChangeTab(key);
    setInternalTab(key);
  };

  return (
    <section className="grid gap-5">
      <div className="mb-5 flex flex-wrap gap-2">
        {[
          { key: "orders", label: "Live Orders" },
          { key: "coc", label: "COC Requests" },
          { key: "qr", label: "QR Orders" },
          { key: "verify", label: "Pending Verification" }
        ].map((t) => (
          <button key={t.key} onClick={() => handleTabChange(t.key)} className={`rounded-full px-5 py-3 text-sm font-black ${billerTab === t.key ? "bg-black text-white" : "bg-white"}`}>
            <span className="inline-flex items-center gap-2">
              {t.label}
              {t.key === "verify" && pendingVerificationCount > 0 && (
                <span className={`inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-2 text-[11px] font-black text-white ${hasPendingVerificationAlert ? "animate-pulse bg-rose-600 ring-2 ring-rose-300" : "bg-rose-600"}`}>
                  {pendingVerificationCount}
                </span>
              )}
              {t.key === "coc" && cocRequestCount > 0 && (
                <span className={`inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-2 text-[11px] font-black text-white ${hasCocAlert ? "animate-pulse bg-rose-600 ring-2 ring-rose-300" : "bg-rose-600"}`}>
                  {cocRequestCount}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      <div>
        {billerTab === "orders" && <OrderAdmin orders={orders} onSaved={onSaved} hideWarnings={true} />}
        {billerTab === "coc" && <CocAdmin cocRequests={cocRequests} onSaved={onSaved} />}
        {billerTab === "pos" && <PosBilling items={items} categories={categories} onSaved={onSaved} />}
        {billerTab === "qr" && <QrOrders orders={orders} onSaved={onSaved} hideWarnings={true} />}
        {billerTab === "verify" && <PendingVerification orders={orders} onSaved={onSaved} />}
      </div>
    </section>
  );
}

function PendingVerification({ orders, onSaved }) {
  const [processing, setProcessing] = useState({});
  const [confirmedMap, setConfirmedMap] = useState({});

  const pending = (orders || []).filter((o) => {
    return isPendingVerificationOrder(o);
  });

  async function confirmPayment(order) {
    const key = order._id || order.id;
    if (processing[key]) return;
    setProcessing((p) => ({ ...p, [key]: true }));
    try {
      const payload = createOrderStatusUpdatePayload({ paymentStatus: "confirmed", status: "confirmed", timestampField: "confirmedAt" });
      const updated = await orderService.patchOrder(key, payload);
      setConfirmedMap((m) => ({ ...m, [key]: true }));
      onSaved();
    } catch (err) {
      alert(err.message || "Failed to confirm order.");
    } finally {
      setProcessing((p) => ({ ...p, [key]: false }));
    }
  }

  async function rejectPayment(order) {
    const key = order._id || order.id;
    if (processing[key]) return;
    if (!window.confirm("Are you sure you want to reject this payment?")) return;
    setProcessing((p) => ({ ...p, [key]: true }));
    try {
      const payload = createOrderStatusUpdatePayload({ paymentStatus: "rejected", status: "pending", rejectionMessage: "Your payment was rejected by the biller. Please check your payment and tap Check Payment / Try Again.", timestampField: "rejectedAt" });
      const updated = await orderService.patchOrder(key, payload);
      onSaved();
    } catch (err) {
      alert(err.message || "Failed to reject payment.");
    } finally {
      setProcessing((p) => ({ ...p, [key]: false }));
    }
  }

  if (!pending.length) return <p className="rounded-[1.5rem] bg-white p-6 font-bold text-stone-500">No pending payments.</p>;

  return (
    <section className="space-y-3">
      {pending.map((order) => (
        <article key={order._id || order.id} className="rounded-[1.5rem] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">{order.customerName}</h2>
              <p className="text-sm font-bold text-stone-500">Order {order.orderId || order.id || order._id} • Table {order.tableNumber} • {order.phone} • {rupees(order.total)}</p>
            </div>
            <div className="flex items-center gap-2">
              {['payment_issue', 'rejected', 'payment_rejected'].includes(String(order.paymentStatus || '').toLowerCase()) && (
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-600">Payment Rejected</span>
              )}
              {(!confirmedMap[order._id || order.id] && order.status !== 'confirmed') ? (
                <button onClick={() => confirmPayment(order)} disabled={processing[order._id || order.id]} className="rounded-full bg-rose-600 px-4 py-2 text-sm font-black text-white">Confirm Payment & Order</button>
              ) : (
                <button disabled className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white">Confirmed</button>
              )}
              {(!confirmedMap[order._id || order.id] && order.status !== 'confirmed') && (
                <button onClick={() => rejectPayment(order)} disabled={processing[order._id || order.id]} className="rounded-full bg-rose-200 px-4 py-2 text-sm font-black">Reject Payment</button>
              )}
            </div>
          </div>
          <div className="mt-3 grid gap-2 text-sm font-semibold text-stone-700">
            {order.items.map((line, index) => <p key={index}>{formatOrderItemLine(line)}</p>)}
          </div>
        </article>
      ))}
    </section>
  );
}


function OrderAdmin({ orders, onSaved, hideWarnings = false }) {
  const [updateError, setUpdateError] = useState("");
  const [updateMessage, setUpdateMessage] = useState("");
  const [printConfig, setPrintConfig] = useState({});

  async function updateOrderStatus(orderId, newStatus) {
    try {
      setUpdateError("");
      setUpdateMessage("");
      await orderService.patchOrder(orderId, { status: newStatus });
      setUpdateMessage("Order status updated successfully.");
      onSaved();
    } catch (error) {
      setUpdateError(error.message || "Failed to update order status");
      console.error(error);
    }
  }

  function setPrintOption(orderId, key, value) {
    setPrintConfig((current) => ({ ...current, [orderId]: { ...current[orderId], [key]: value } }));
  }

  function printOrder(order, copyType = "customer") {
    const normalizedOrder = normalizeReceiptOrder(order);
    const config = printConfig[normalizedOrder._id || normalizedOrder.id || normalizedOrder.orderId] || {};
    const receiptLabel = copyType === "customer" ? "Customer Bill" : copyType === "kitchen" ? "Kitchen Copy" : "Customer / Kitchen Copy";
    const receiptHtml = `
      <html>
        <head>
          <title>${receiptLabel} - ${normalizedOrder.orderId}</title>
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <style>
            body{margin:0;padding:0}
            .receipt{width:300px;background:#fff;color:#000;font-family:'Courier New',monospace;font-size:11px;padding:12px;margin:8px auto}
            .receipt *{color:#000}
            .receipt-header{text-align:center}
            .receipt-title{font-size:18px;font-weight:900;letter-spacing:3px}
            .receipt-line{border-top:1px dashed #000;margin:8px 0}
            .receipt-row{display:flex;justify-content:space-between;gap:8px}
            .receipt-table-header,.receipt-item{display:grid;grid-template-columns:30px 1fr 70px;gap:6px}
            .receipt-amount{text-align:right}
            .receipt-total{display:flex;justify-content:space-between;font-size:20px;font-weight:900;margin-top:8px}
            .receipt-qr{display:flex;justify-content:center;margin-top:10px}
            @media print{body *{visibility:hidden}.receipt,.receipt *{visibility:visible}.receipt{position:absolute;left:0;top:0;margin:0;width:300px}}
          </style>
        </head>
        <body>
          <article class="receipt">
            <div class="receipt-header">
              <div>CUSTOMER COPY</div>
              <div class="receipt-title">THE INFUSION SAGA</div>
              <div style="font-size:11px">A155, Ramnagariya Rd, Mahadev Nagar, Jagatpura, Jaipur, Rajasthan 302017</div>
            </div>
            <div class="receipt-line"></div>
            <div>
              <div class="receipt-row"><div>Date</div><div>${new Date(normalizedOrder.createdAt||Date.now()).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</div></div>
              <div class="receipt-row"><div>Order ID</div><div>${normalizedOrder.orderId}</div></div>
              <div class="receipt-row"><div>Table</div><div>${normalizedOrder.tableNumber ?? (normalizedOrder.table ?? '-')}</div></div>
              <div class="receipt-row"><div>Customer</div><div>${normalizedOrder.customerName || 'Guest'}</div></div>
              <div class="receipt-row"><div>Phone</div><div>${normalizedOrder.phone || '-'}</div></div>
              <div class="receipt-row"><div>Payment</div><div>${normalizedOrder.paymentMethod || 'Cash'}</div></div>
              <div class="receipt-row"><div>Status</div><div>${normalizedOrder.paymentStatus || 'Unknown'}</div></div>
              <div class="receipt-row"><div>Invoice</div><div>${normalizedOrder.invoiceNo || `INV-${String(normalizedOrder.orderId).slice(-8)}`}</div></div>
              <div class="receipt-row"><div>GSTIN</div><div>${normalizedOrder.gstin || normalizedOrder.GSTIN || '08AAAPL1234C1Z1'}</div></div>
            </div>
            <div class="receipt-line"></div>
            <div>
              <div class="receipt-table-header"><div>QTY</div><div>DESC</div><div class="receipt-amount">AMT</div></div>
              ${Array.isArray(normalizedOrder.items) && normalizedOrder.items.length? normalizedOrder.items.map(line=>{
                const qty = line.quantity||line.qty||1;
                const amt = Number((line.lineTotal ?? ((line.unitPrice || 0) * qty)) || 0);
                return `<div class="receipt-item"><div>${qty}</div><div><div style="font-weight:700">${formatOrderItemLine(line)}</div></div><div class="receipt-amount">Rs. ${amt.toFixed(2)}</div></div>`;
              }).join('') : '<div style="padding:8px 0">No items.</div>'}
            </div>
            <div class="receipt-line"></div>
            <div>
              <div class="receipt-row"><div>Subtotal</div><div>Rs. ${Number(normalizedOrder.subtotal || getOrderTotal(normalizedOrder) || 0).toFixed(2)}</div></div>
              <div class="receipt-row"><div>Tax (${Math.round((normalizedOrder.gstRate||0.05)*100)}%)</div><div>Rs. ${Number(normalizedOrder.gst||0).toFixed(2)}</div></div>
              <div class="receipt-total"><div>AMOUNT</div><div>Rs. ${Number(normalizedOrder.total||normalizedOrder.grandTotal||0).toFixed(2)}</div></div>
            </div>
            <div class="receipt-qr"><div><img src="" id="qrimg" style="width:64px;height:64px;object-fit:contain"/></div></div>
          </article>
        </body>
      </html>
    `;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    printWindow.focus();
    // try to generate QR in the opened window if QRCode available
    try {
      if (window.QRCode && typeof window.QRCode.toDataURL === 'function') {
        window.QRCode.toDataURL(String(normalizedOrder.orderId), {width:150}).then(url=>{
          const img = printWindow.document.getElementById('qrimg');
          if (img) img.src = url;
        }).catch(()=>{});
      }
    } catch(e) {}
    if (config.autoPrint) {
      printWindow.print();
    }
  }

  // In-page preview state and helper
  const [previewOrder, setPreviewOrder] = useState(null);
  const [previewCopy, setPreviewCopy] = useState("customer");
  const [showPreview, setShowPreview] = useState(false);
  const [previewWidth, setPreviewWidth] = useState(300);
  const [previewFontSize, setPreviewFontSize] = useState(11);

  function openPreview(order, copyType = "customer") {
    setPreviewOrder(preparePrintableOrder(order));
    setPreviewCopy(copyType);
    setShowPreview(true);
    setPreviewWidth(300);
    setPreviewFontSize(11);
    // allow printing directly after opening using browser print
  }

  return (
    <section className="space-y-3">
      {updateError && <div className="rounded-[1.5rem] bg-red-50 p-4 text-sm font-bold text-red-700">Error: {updateError}</div>}
      {updateMessage && <div className="rounded-[1.5rem] bg-emerald-50 p-4 text-sm font-bold text-emerald-700">{updateMessage}</div>}
      {(orders || []).map((order) => {
        const safeOrder = order || {};
        const orderItems = Array.isArray(safeOrder.items) ? safeOrder.items : [];
        const orderWarnings = Array.isArray(safeOrder.warnings) ? safeOrder.warnings : [];

        return (
        <article key={safeOrder._id || safeOrder.id} className="rounded-[1.5rem] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">{safeOrder.customerName || "Customer"}</h2>
              <p className="text-sm font-bold text-stone-500">Order {safeOrder.orderId || safeOrder.id || safeOrder._id || "-"} • Table {safeOrder.tableNumber ?? safeOrder.table ?? "-"} • {safeOrder.phone || "-"} • {rupees(safeOrder.total || 0)}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={safeOrder.status || "new"} onChange={(event) => updateOrderStatus(safeOrder._id || safeOrder.id, event.target.value)} className="rounded-full bg-stone-100 px-4 py-2 text-sm font-black">
                {['new', 'preparing', 'ready', 'completed', 'cancelled'].map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <button onClick={() => openPreview(safeOrder, 'customer')} className="rounded-full bg-black px-4 py-2 text-sm font-black text-white">Print Customer Bill</button>
              <button onClick={() => openPreview(safeOrder, 'kitchen')} className="rounded-full bg-stone-800 px-4 py-2 text-sm font-black text-white">Print Kitchen Copy</button>
              <button onClick={() => openPreview(safeOrder, 'both')} className="rounded-full bg-stone-600 px-4 py-2 text-sm font-black text-white">Print Both</button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] bg-stone-50 p-4 text-sm text-stone-700">
            <label className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2">
              <input type="checkbox" checked={(printConfig[safeOrder._id || safeOrder.id] || {}).autoPrint || false} onChange={() => setPrintOption(safeOrder._id || safeOrder.id, 'autoPrint', !((printConfig[safeOrder._id || safeOrder.id] || {}).autoPrint))} className="h-4 w-4 accent-black" />
              Auto Print
            </label>
            <span className="text-xs uppercase tracking-[0.2em] text-stone-500">Print from biller panel only</span>
          </div>
          {!hideWarnings && orderWarnings.length > 0 && (
            <div className="mt-3 rounded-[1.5rem] bg-amber-50 p-4 text-sm font-semibold text-amber-900">
              <p className="font-black">Inventory warnings</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-amber-900">
                {orderWarnings.map((warning, index) => <li key={index}>{warning}</li>)}
              </ul>
            </div>
          )}
          <div className="mt-3 grid gap-2 text-sm font-semibold text-stone-700">
            {orderItems.map((line, index) => <OrderLineCard key={index} line={line} />)}
          </div>
        </article>
        );
      })}
      {(orders || []).length === 0 && <p className="rounded-[1.5rem] bg-white p-6 font-bold text-stone-500">No orders yet.</p>}
      {/* In-page receipt preview modal for admin */}
      {showPreview && previewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:'rgba(0,0,0,0.5)'}}>
          <div className="bg-white p-4 rounded shadow max-h-[90vh] overflow-auto" style={{minWidth:320}}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <label className="text-sm">Width</label>
                {[280,300,320].map((w)=> (
                  <button key={w} onClick={()=>setPreviewWidth(w)} className={`px-2 py-1 rounded border ${previewWidth===w? 'bg-black text-white':'bg-white'}`}>
                    {w}
                  </button>
                ))}
                <label className="text-sm ml-3">Font</label>
                {[10,11,12].map((f)=> (
                  <button key={f} onClick={()=>setPreviewFontSize(f)} className={`px-2 py-1 rounded border ${previewFontSize===f? 'bg-black text-white':'bg-white'}`}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { window.print(); }} className="rounded-full bg-black px-4 py-2 text-sm font-black text-white">Print</button>
                <button onClick={() => setShowPreview(false)} className="rounded-full border px-4 py-2 text-sm font-black">Close</button>
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'center'}}>
              <PrintableReceipt order={previewOrder} copyType={previewCopy} receiptWidth={previewWidth} fontSize={previewFontSize} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function CocAdmin({ cocRequests, onSaved }) {
  const [error, setError] = useState("");
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    let mounted = true;
    authService.me()
      .then((data) => {
        if (!mounted) return;
        setIsStaff(data.user?.role === "admin" || data.user?.role === "biller");
      })
      .catch(() => {
        if (!mounted) return;
        setIsStaff(false);
      });
    return () => (mounted = false);
  }, []);

  async function approve(id) {
    try {
      setError("");
      await orderService.patchCocRequest(id);
      onSaved();
    } catch (err) {
      setError(err.message || "Failed to approve request");
    }
  }

  return (
    <section className="space-y-3">
      {error && <div className="rounded-[1.5rem] bg-red-50 p-4 text-sm font-bold text-red-700">Error: {error}</div>}
      {(cocRequests || []).map((req) => {
        const safeRequest = req || {};
        const requestItems = Array.isArray(safeRequest.items) ? safeRequest.items : [];

        return (
        <article key={safeRequest.id || safeRequest._id} className="rounded-[1.5rem] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">{safeRequest.customerName || "Customer"} • Table {safeRequest.tableNumber ?? safeRequest.table ?? "-"}</h2>
              <p className="text-sm font-bold text-stone-500">{safeRequest.phone || "-"} • {rupees(safeRequest.total || 0)} • {safeRequest.paymentMethod === 'cash' ? 'Cash on Counter' : 'Online'}</p>
            </div>
          </div>
          <div className="mt-4 border-t border-slate-200/80 pt-4">
            <div className="grid gap-3 text-sm text-stone-700">
              {requestItems.map((line, index) => (
                <OrderLineCard key={index} line={line} />
              ))}
            </div>
          </div>
          <div className="mt-4 border-t border-slate-200/80 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Only staff can approve COC requests.</p>
              <div className="flex items-center gap-2">
                {isStaff ? (
                  <button onClick={() => approve(safeRequest.id)} className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white">Approve & Create Order</button>
                ) : (
                  <button onClick={() => { history.pushState(null, '', '/admin'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="rounded-full bg-white border px-4 py-2 text-sm font-black">Owner login to approve</button>
                )}
              </div>
            </div>
          </div>
        </article>
        );
      })}
      {(cocRequests || []).length === 0 && <p className="rounded-[1.5rem] bg-white p-6 font-bold text-stone-500">No COC requests.</p>}
    </section>
  );
}

function InventoryAdmin({ rawMaterials, onSaved }) {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({ id: "", name: "", quantity: "", unit: "pcs", minStock: "", purchasePrice: "", supplier: "" });
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Load inventory items from localStorage on mount
  useEffect(() => {
    loadInventoryItems();
    
    function handleInventoryUpdated(event) {
      const latestItems = event.detail || JSON.parse(localStorage.getItem("inventoryItems") || "[]");
      setInventoryItems(latestItems);
    }
    
    window.addEventListener("inventoryUpdated", handleInventoryUpdated);
    window.addEventListener("storage", () => {
      const saved = JSON.parse(localStorage.getItem("inventoryItems") || "[]");
      setInventoryItems(saved);
    });
    
    return () => {
      window.removeEventListener("inventoryUpdated", handleInventoryUpdated);
      window.removeEventListener("storage", () => {});
    };
  }, []);

  function loadInventoryItems() {
    const saved = JSON.parse(localStorage.getItem("inventoryItems") || "[]");
    setInventoryItems(saved);
  }

  function saveInventoryItems(updatedItems) {
    localStorage.setItem("inventoryItems", JSON.stringify(updatedItems));
    window.dispatchEvent(new CustomEvent("inventoryUpdated", { detail: updatedItems }));
    setInventoryItems(updatedItems);
  }

  function getStockStatus(quantity, minStock) {
    if (quantity <= 0) return "Out of Stock";
    if (quantity <= minStock) return "Low Stock";
    return "In Stock";
  }

  function validateForm() {
    if (!form.name.trim()) return "Item name is required.";
    if (!form.quantity || isNaN(Number(form.quantity))) return "Quantity must be a valid number.";
    if (!form.unit) return "Unit is required.";
    if (!form.minStock || isNaN(Number(form.minStock))) return "Minimum stock must be a valid number.";
    if (!form.purchasePrice || isNaN(Number(form.purchasePrice))) return "Purchase price is required and must be a valid number.";
    if (Number(form.purchasePrice) <= 0) return "Purchase price must be greater than 0.";
    return "";
  }

  function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    
    const error = validateForm();
    if (error) {
      setMessage(error);
      setMessageType("error");
      return;
    }

    let updatedItems;
    if (editingItem) {
      updatedItems = inventoryItems.map(item => 
        item.id === editingItem.id
          ? {
              ...item,
              name: form.name.trim(),
              quantity: Number(form.quantity),
              unit: form.unit,
              minStock: Number(form.minStock),
              purchasePrice: Number(form.purchasePrice),
              supplier: form.supplier.trim(),
              lastUpdated: new Date().toISOString()
            }
          : item
      );
      setMessage("Inventory item updated successfully.");
    } else {
      const newItem = {
        id: Date.now().toString(),
        name: form.name.trim(),
        quantity: Number(form.quantity),
        unit: form.unit,
        minStock: Number(form.minStock),
        purchasePrice: Number(form.purchasePrice),
        supplier: form.supplier.trim(),
        lastUpdated: new Date().toISOString()
      };
      updatedItems = [...inventoryItems, newItem];
      setMessage("Inventory item added successfully.");
    }

    setMessageType("success");
    saveInventoryItems(updatedItems);
    setForm({ id: "", name: "", quantity: "", unit: "pcs", minStock: "", purchasePrice: "", supplier: "" });
    setEditingItem(null);
    
    if (onSaved) onSaved();
  }

  function handleEdit(item) {
    setEditingItem(item);
    setForm({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      minStock: item.minStock,
      purchasePrice: item.purchasePrice || "",
      supplier: item.supplier || ""
    });
    setMessage("");
  }

  function handleDelete(itemId) {
    if (!window.confirm("Are you sure you want to delete this inventory item?")) return;
    const updatedItems = inventoryItems.filter(item => item.id !== itemId);
    saveInventoryItems(updatedItems);
    setMessage("Inventory item deleted successfully.");
    setMessageType("success");
  }

  function handleIncreaseStock(itemId, amount = 1) {
    const updatedItems = inventoryItems.map(item =>
      item.id === itemId
        ? { ...item, quantity: item.quantity + amount, lastUpdated: new Date().toISOString() }
        : item
    );
    saveInventoryItems(updatedItems);
  }

  function handleDecreaseStock(itemId, amount = 1) {
    const item = inventoryItems.find(i => i.id === itemId);
    if (item && item.quantity - amount >= 0) {
      const updatedItems = inventoryItems.map(i =>
        i.id === itemId
          ? { ...i, quantity: i.quantity - amount, lastUpdated: new Date().toISOString() }
          : i
      );
      saveInventoryItems(updatedItems);
    }
  }

  function handleCancel() {
    setEditingItem(null);
    setForm({ id: "", name: "", quantity: "", unit: "pcs", minStock: "", purchasePrice: "", supplier: "" });
    setMessage("");
  }

  // Filter inventory items
  const filteredItems = inventoryItems.filter(item => {
    const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const status = getStockStatus(item.quantity, item.minStock);
    let matchesFilter = true;
    if (filterStatus === "low") matchesFilter = status === "Low Stock";
    if (filterStatus === "out") matchesFilter = status === "Out of Stock";
    if (filterStatus === "in") matchesFilter = status === "In Stock";
    return matchesQuery && matchesFilter;
  });

  // Calculate summary
  const lowStockCount = inventoryItems.filter(item => getStockStatus(item.quantity, item.minStock) === "Low Stock").length;
  const outOfStockCount = inventoryItems.filter(item => getStockStatus(item.quantity, item.minStock) === "Out of Stock").length;
  const totalValue = inventoryItems.reduce((sum, item) => sum + (item.quantity * (item.purchasePrice || 0)), 0);

  return (
    <section className="space-y-5">
      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-[1.5rem] bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-stone-500">Total Items</p>
          <p className="mt-2 text-2xl font-black">{inventoryItems.length}</p>
        </div>
        <div className="rounded-[1.5rem] bg-orange-50 p-4 shadow-sm">
          <p className="text-xs font-bold text-orange-600">Low Stock</p>
          <p className="mt-2 text-2xl font-black text-orange-700">{lowStockCount}</p>
        </div>
        <div className="rounded-[1.5rem] bg-red-50 p-4 shadow-sm">
          <p className="text-xs font-bold text-red-600">Out of Stock</p>
          <p className="mt-2 text-2xl font-black text-red-700">{outOfStockCount}</p>
        </div>
        <div className="rounded-[1.5rem] bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs font-bold text-emerald-600">Total Value</p>
          <p className="mt-2 text-2xl font-black text-emerald-700">{rupees(totalValue)}</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        {/* Inventory Table */}
        <div className="rounded-[1.5rem] bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black">Inventory items</h2>
            <button onClick={handleCancel} className="rounded-full bg-black px-4 py-2 text-xs font-black text-white">+ New item</button>
          </div>
          
          {/* Search and Filter */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <input
              placeholder="Search by item name..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="field flex-1 bg-stone-50"
            />
            <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} className="field bg-stone-50">
              <option value="all">All items</option>
              <option value="in">In Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>

          {/* Inventory Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-stone-500">
                  <th className="py-3">Item Name</th>
                  <th>Stock</th>
                  <th>Min Stock</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Supplier</th>
                  <th>Last Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    const status = getStockStatus(item.quantity, item.minStock);
                    const statusClass = status === "Out of Stock" ? "text-red-600" : status === "Low Stock" ? "text-orange-600" : "text-emerald-600";
                    return (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-3 font-black">{item.name}</td>
                        <td>{item.quantity} {item.unit}</td>
                        <td>{item.minStock} {item.unit}</td>
                        <td><span className={`text-xs font-bold ${statusClass}`}>{status}</span></td>
                        <td>{rupees(item.purchasePrice || 0)}</td>
                        <td className="text-xs text-stone-500">{item.supplier || "-"}</td>
                        <td className="text-xs text-stone-500">{new Date(item.lastUpdated).toLocaleDateString()}</td>
                        <td className="text-right">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => handleDecreaseStock(item.id)} className="rounded-full p-2 hover:bg-stone-100" title="Decrease stock"><Minus size={14} /></button>
                            <button onClick={() => handleIncreaseStock(item.id)} className="rounded-full p-2 hover:bg-stone-100" title="Increase stock"><Plus size={14} /></button>
                            <button onClick={() => handleEdit(item)} className="rounded-full p-2 hover:bg-stone-100" title="Edit"><Pencil size={14} /></button>
                            <button onClick={() => handleDelete(item.id)} className="rounded-full p-2 hover:bg-red-50" title="Delete"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="py-6 text-center text-sm text-stone-500">No inventory items found. Click "New item" to add one.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="rounded-[1.5rem] bg-white p-5 shadow-sm h-fit">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-black">{editingItem ? "Edit item" : "Add item"}</h2>
            {editingItem && <button type="button" onClick={handleCancel} className="rounded-full bg-stone-100 px-3 py-2 text-xs font-black">Cancel</button>}
          </div>
          
          <div className="space-y-3">
            <input required className="field bg-stone-50" placeholder="Item name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
                <div className="mt-4 border-t border-slate-200/80 pt-4">
                  <div className="grid gap-3 text-sm text-stone-700">
                    {order.items.map((line, index) => <OrderLineCard key={index} line={line} />)}
                  </div>
                </div>
                <div className="mt-4 border-t border-slate-200/80 pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {['payment_issue', 'rejected', 'payment_rejected'].includes(String(order.paymentStatus || '').toLowerCase()) && (
                        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-black text-rose-600">Payment Rejected</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {(!confirmedMap[order._id || order.id] && order.status !== 'confirmed') ? (
                        <button onClick={() => confirmPayment(order)} disabled={processing[order._id || order.id]} className="rounded-full bg-rose-600 px-4 py-2 text-sm font-black text-white">Confirm Payment & Order</button>
                      ) : (
                        <button disabled className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white">Confirmed</button>
                      )}
                      {(!confirmedMap[order._id || order.id] && order.status !== 'confirmed') && (
                        <button onClick={() => rejectPayment(order)} disabled={processing[order._id || order.id]} className="rounded-full bg-rose-200 px-4 py-2 text-sm font-black">Reject Payment</button>
                      )}
                    </div>
                  </div>
            
            <input required type="number" min="0.01" step="any" className="field bg-stone-50" placeholder="Purchase price" value={form.purchasePrice} onChange={(event) => setForm({ ...form, purchasePrice: event.target.value })} />
            
            <input className="field bg-stone-50" placeholder="Supplier (optional)" value={form.supplier} onChange={(event) => setForm({ ...form, supplier: event.target.value })} />

            {message && (
              <p className={`text-sm font-bold ${messageType === "error" ? "text-red-700" : "text-emerald-700"}`}>
                {message}
              </p>
            )}
            
            <button disabled={!!validateForm()} className="w-full rounded-full bg-black px-5 py-4 font-black text-white">
              {editingItem ? "Update item" : "Add item"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function AddStockPage({ rawMaterials, onSaved }) {
  const [localItems, setLocalItems] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // Load local inventory items
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("inventoryItems") || "[]");
    setLocalItems(saved);
    
    function handleInventoryUpdated(event) {
      const items = event.detail || JSON.parse(localStorage.getItem("inventoryItems") || "[]");
      setLocalItems(items);
    }
    
    window.addEventListener("inventoryUpdated", handleInventoryUpdated);
    return () => window.removeEventListener("inventoryUpdated", handleInventoryUpdated);
  }, []);

  // Combine backend and local inventory
  const allItems = [...(rawMaterials || []), ...localItems];

  useEffect(() => {
    if (!selectedId && allItems[0]) setSelectedId(allItems[0].id);
  }, [allItems, selectedId]);

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    
    if (!selectedId) {
      setMessage("Please select an inventory item.");
      setMessageType("error");
      return;
    }
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      setMessage("Quantity must be a positive number.");
      setMessageType("error");
      return;
    }

    try {
      const item = localItems.find(i => i.id === selectedId);
      if (item) {
        // Update local inventory item
        const updatedItems = localItems.map(i =>
          i.id === selectedId
            ? { ...i, quantity: i.quantity + Number(quantity), lastUpdated: new Date().toISOString() }
            : i
        );
        localStorage.setItem("inventoryItems", JSON.stringify(updatedItems));
        window.dispatchEvent(new CustomEvent("inventoryUpdated", { detail: updatedItems }));
        setLocalItems(updatedItems);
      } else {
        // Try backend API for server-managed materials
        await (await import("./services/inventoryService")).purchaseInventory(selectedId, { quantity: Number(quantity), note });
      }
      
      setQuantity("");
      setNote("");
      setMessage("Stock updated successfully.");
      setMessageType("success");
      if (onSaved) onSaved();
    } catch (err) {
      setMessage(err.message);
      setMessageType("error");
    }
  }

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black">Add stock</h2>
        <p className="mt-2 text-sm text-stone-600">Use this page to add fresh stock for raw materials, ingredients, and supplies. Quickly increase inventory quantities.</p>
        
        {allItems.length === 0 && (
          <div className="mt-6 rounded-3xl bg-stone-50 p-4 text-center">
            <p className="text-sm font-bold text-stone-600">No inventory items found. Create items in the Inventory tab first.</p>
          </div>
        )}
      </div>
      
      {allItems.length > 0 && (
        <form onSubmit={submit} className="rounded-[1.5rem] bg-white p-5 shadow-sm h-fit">
          <h3 className="font-black mb-3">Quick add stock</h3>
          <div className="space-y-4">
            <select required className="field bg-stone-50" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
              <option value="">Select item...</option>
              {allItems.map((material) => {
                const isLocal = localItems.find(i => i.id === material.id);
                const qty = isLocal ? material.quantity : material.stock;
                const unit = isLocal ? material.unit : material.unit;
                return (
                  <option key={material.id} value={material.id}>
                    {material.name} ({qty}{unit} available)
                  </option>
                );
              })}
            </select>
            <input required className="field bg-stone-50" type="number" min="0" step="any" placeholder="Quantity to add" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
            <textarea className="field min-h-20 resize-none bg-stone-50" placeholder="Note (optional)" value={note} onChange={(event) => setNote(event.target.value)} />
            {message && (
              <p className={`text-sm font-bold ${messageType === "error" ? "text-red-700" : "text-emerald-700"}`}>
                {message}
              </p>
            )}
            <button className="w-full rounded-full bg-black px-5 py-4 font-black text-white">Add to stock</button>
          </div>
        </form>
      )}
    </section>
  );
}

function RecipeMapping({ items, rawMaterials, recipes, onSaved }) {
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id || "");
  const [ingredients, setIngredients] = useState([{ rawMaterialId: "", amount: "", unit: "g", serveType: "" }]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!selectedItemId && items[0]) setSelectedItemId(items[0].id);
  }, [items, selectedItemId]);

  useEffect(() => {
    const recipe = recipes.find((recipeItem) => recipeItem.itemId === selectedItemId);
    if (recipe) {
      setIngredients(recipe.ingredients.length ? recipe.ingredients.map((ingat) => ({ ...ingat })) : [{ rawMaterialId: "", amount: "", unit: "g", serveType: "" }]);
    } else {
      setIngredients([{ rawMaterialId: "", amount: "", unit: "g", serveType: "" }]);
    }
  }, [selectedItemId, recipes]);

  function updateIngredient(index, key, value) {
    setIngredients((current) => current.map((ingredient, i) => (i === index ? { ...ingredient, [key]: value } : ingredient)));
  }

  function addIngredient() {
    setIngredients((current) => [...current, { rawMaterialId: "", amount: "", unit: "g", serveType: "" }]);
  }

  function removeIngredient(index) {
    setIngredients((current) => current.filter((_, i) => i !== index));
  }

  async function submit(event) {
    event.preventDefault();
    setMessage("");
    try {
      const recipeId = selectedItemId;
      await menuService.patchRecipe(recipeId, { id: recipeId, itemId: selectedItemId, ingredients });
      setMessage("Recipe saved.");
      onSaved();
    } catch (err) {
      if (err.message.includes("not found")) {
        try {
          await menuService.createRecipe({ id: selectedItemId, itemId: selectedItemId, ingredients });
          setMessage("Recipe saved.");
          onSaved();
        } catch (postError) {
          setMessage(postError.message);
        }
      } else {
        setMessage(err.message);
      }
    }
  }

  const selectedItem = items.find((item) => item.id === selectedItemId);

  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="rounded-[1.5rem] bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">Recipe mapping</h2>
            <p className="mt-1 text-sm text-stone-600">Link menu items to raw material usage for automatic stock adjustment.</p>
          </div>
          <button type="button" onClick={addIngredient} className="rounded-full bg-black px-4 py-2 text-xs font-black text-white">Add ingredient</button>
        </div>
        <div className="space-y-4">
          <select className="field bg-stone-50" value={selectedItemId} onChange={(event) => setSelectedItemId(event.target.value)}>
            {items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          {ingredients.map((ingredient, index) => (
            <div key={index} className="grid gap-3 rounded-3xl border border-stone-200 bg-stone-50 p-4 sm:grid-cols-[1.5fr_0.9fr_0.9fr_0.9fr_auto]">
              <select value={ingredient.rawMaterialId} onChange={(event) => updateIngredient(index, "rawMaterialId", event.target.value)} className="field bg-white">
                <option value="">Select raw material</option>
                {rawMaterials.map((material) => (
                  <option key={material.id} value={material.id}>{material.name}</option>
                ))}
              </select>
              <input className="field bg-white" placeholder="Amount" value={ingredient.amount} onChange={(event) => updateIngredient(index, "amount", event.target.value)} />
              <select className="field bg-white" value={ingredient.unit} onChange={(event) => updateIngredient(index, "unit", event.target.value)}>
                <option value="g">g</option>
                <option value="ml">ml</option>
                <option value="pcs">pcs</option>
              </select>
              <input className="field bg-white" placeholder="Serve type (optional)" value={ingredient.serveType} onChange={(event) => updateIngredient(index, "serveType", event.target.value)} />
              <button type="button" onClick={() => removeIngredient(index)} className="rounded-full bg-white p-2 text-stone-600 hover:bg-stone-100"><Trash2 size={18} /></button>
            </div>
          ))}
          {message && <p className="text-sm font-bold text-stone-600">{message}</p>}
          <button className="w-full rounded-full bg-black px-5 py-4 font-black text-white">Save recipe</button>
        </div>
      </div>
      <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black">Current recipe for {selectedItem?.name || "selected item"}</h2>
        <div className="mt-4 space-y-3 text-sm text-stone-700">
          {(ingredients.length === 0) ? <p>No ingredients configured.</p> : ingredients.map((ingredient, index) => {
            const material = rawMaterials.find((mat) => mat.id === ingredient.rawMaterialId);
            return (
              <div key={index} className="rounded-3xl bg-stone-50 p-3">
                <p className="font-black">{material ? material.name : ingredient.rawMaterialId || "Unknown raw material"}</p>
                <p>{ingredient.amount} {ingredient.unit} {ingredient.serveType ? `• ${ingredient.serveType}` : ""}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LowStockAlerts({ rawMaterials }) {
  const [localItems, setLocalItems] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("inventoryItems") || "[]");
    setLocalItems(saved);
    
    function handleInventoryUpdated(event) {
      const items = event.detail || JSON.parse(localStorage.getItem("inventoryItems") || "[]");
      setLocalItems(items);
    }
    
    window.addEventListener("inventoryUpdated", handleInventoryUpdated);
    return () => window.removeEventListener("inventoryUpdated", handleInventoryUpdated);
  }, []);

  const allMaterials = [...(rawMaterials || []), ...localItems];
  const lowMaterials = allMaterials.filter((material) => {
    const qty = material.stock !== undefined ? material.stock : material.quantity || 0;
    const minStock = material.minStock || 0;
    return Number(qty) <= Number(minStock);
  });

  return (
    <section className="space-y-5">
      <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black">Low stock & out of stock alerts</h2>
        <p className="mt-2 text-sm text-stone-600">These items need replenishment immediately.</p>
      </div>
      {lowMaterials.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {lowMaterials.map((material) => {
            const qty = material.stock !== undefined ? material.stock : material.quantity || 0;
            const isOutOfStock = qty <= 0;
            return (
              <div key={material.id} className={`rounded-[1.5rem] p-5 shadow-sm ${isOutOfStock ? "bg-red-50" : "bg-orange-50"}`}>
                <p className={`text-sm font-bold ${isOutOfStock ? "text-red-600" : "text-orange-600"}`}>{isOutOfStock ? "OUT OF STOCK" : "LOW STOCK"}</p>
                <h3 className="mt-2 text-xl font-black">{material.name}</h3>
                <p className={`mt-2 text-sm ${isOutOfStock ? "text-red-700" : "text-orange-700"}`}>
                  Stock: {qty}{material.unit || material.unit} / Min: {material.minStock || 0}{material.unit || material.unit}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-[1.5rem] bg-white p-5 text-sm font-bold text-stone-500">All inventory levels are healthy. ✓</p>
      )}
    </section>
  );
}

function ReportsPage({ reports, items, orders = [] }) {
  const savedReports = reports || {};
  const savedItems = Array.isArray(items) ? items : [];
  const savedOrders = Array.isArray(orders) ? orders : [];
  
  // Calculate reports from orders if not available from API (demo mode)
  let topItems = Array.isArray(savedReports.topItems) ? savedReports.topItems : [];
  let totalSales = savedReports.totalSales || 0;
  let totalOrders = savedReports.totalOrders || 0;
  
  if (topItems.length === 0 && savedOrders.length > 0) {
    // Calculate from orders
    const itemSales = {};
    let sales = 0;
    const completed = savedOrders.filter((o) => isCompletedSale(o));
    completed.forEach(order => {
      if (order.total) sales += Number(order.total);
      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          if (!itemSales[item.itemId]) {
            itemSales[item.itemId] = 0;
          }
          itemSales[item.itemId] += Number(item.quantity || 1);
        });
      }
    });
    topItems = Object.entries(itemSales)
      .map(([itemId, quantity]) => ({ itemId, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
    totalSales = sales;
    totalOrders = completed.length;
  }
  
  const enrichedTopItems = topItems.map((record) => ({ ...record, name: savedItems.find((item) => item.id === record.itemId)?.name || record.itemId }));
  return (
    <section className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Inventory & sales reports</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[1.5rem] bg-stone-50 p-5">
              <p className="text-sm font-semibold text-stone-500">Total sales</p>
              <p className="mt-3 text-3xl font-black">{rupees(totalSales || 0)}</p>
            </div>
            <div className="rounded-[1.5rem] bg-stone-50 p-5">
              <p className="text-sm font-semibold text-stone-500">Total orders</p>
              <p className="mt-3 text-3xl font-black">{totalOrders || 0}</p>
            </div>
            <div className="rounded-[1.5rem] bg-stone-50 p-5">
              <p className="text-sm font-semibold text-stone-500">Inventory value</p>
              <p className="mt-3 text-3xl font-black">{rupees(savedReports.inventoryValue || 0)}</p>
            </div>
            <div className="rounded-[1.5rem] bg-stone-50 p-5">
              <p className="text-sm font-semibold text-stone-500">Low stock count</p>
              <p className="mt-3 text-3xl font-black">{savedReports.lowStockCount || 0}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
          <h3 className="text-lg font-black">Top sold items</h3>
          <div className="mt-4 space-y-3">
            {enrichedTopItems.length > 0 ? enrichedTopItems.map((record) => (
              <div key={record.itemId} className="rounded-3xl bg-stone-50 p-4">
                <p className="font-black">{record.name}</p>
                <p className="text-sm text-stone-600">Qty sold: {record.quantity}</p>
              </div>
            )) : <p className="text-sm text-stone-500">No order data yet.</p>}
          </div>
        </div>
      </div>
      <SalesAnalytics orders={orders} />
    </section>
  );
}

function SalesAnalytics({ orders = [] }) {
  const [filterType, setFilterType] = useState("today");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [activeCustomRange, setActiveCustomRange] = useState({ start: "", end: "" });
  const [customError, setCustomError] = useState("");

  const savedOrders = Array.isArray(orders) ? orders : [];

  function getFilterRange() {
    const today = startOfDay(new Date());
    const filterEnd = endOfDay(new Date());

    if (filterType === "today") {
      return { start: today, end: filterEnd };
    }
    if (filterType === "yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return { start: yesterday, end: endOfDay(yesterday) };
    }
    if (filterType === "week") {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { start, end: filterEnd };
    }
    if (filterType === "month") {
      const start = new Date(today);
      start.setDate(start.getDate() - 29);
      return { start, end: filterEnd };
    }
    if (filterType === "three-months") {
      const start = new Date(today);
      start.setDate(start.getDate() - 89);
      return { start, end: filterEnd };
    }
    if (filterType === "custom") {
      if (activeCustomRange.start && activeCustomRange.end) {
        return { start: startOfDay(activeCustomRange.start), end: endOfDay(activeCustomRange.end) };
      }
      return null;
    }
    return { start: today, end: filterEnd };
  }

  const { salesByDate, totalSales, totalOrders, dates, maxSales, dateRangeLabel } = useMemo(() => {
    const range = getFilterRange();
    const salesByDate = {};
    let totalSales = 0;

    if (!range) {
      return { salesByDate, totalSales: 0, totalOrders: 0, dates: [], maxSales: 0, dateRangeLabel: "" };
    }

    const reportOrders = Array.isArray(savedOrders) ? savedOrders : [];

    const salesAnalysisOrders = reportOrders.map(normalizeOrder);

    const filteredOrders = Array.isArray(salesAnalysisOrders) ? salesAnalysisOrders.filter((order) => {
      const orderDate = getOrderDate(order);
      return orderDate !== null && isCompletedSale(order) && orderDate >= range.start && orderDate <= range.end;
    }) : [];

    filteredOrders.forEach((order) => {
      const orderDate = getOrderDate(order);
      if (!orderDate) return;
      const dateStr = orderDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      if (!salesByDate[dateStr]) {
        salesByDate[dateStr] = { sales: 0, orders: 0, dateObj: new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate()) };
      }
      salesByDate[dateStr].sales += Number(order?.total ?? order?.totalAmount ?? order?.grandTotal ?? 0);
      salesByDate[dateStr].orders += 1;
      totalSales += Number(order?.total ?? order?.totalAmount ?? order?.grandTotal ?? 0);
    });

    const dates = Object.keys(salesByDate).sort((a, b) => salesByDate[a].dateObj - salesByDate[b].dateObj);
    const maxSales = dates.length > 0 ? Math.max(...dates.map((d) => salesByDate[d].sales)) : 0;
    const totalOrders = Array.isArray(filteredOrders) ? filteredOrders.length : 0;
    const dateRangeLabel = `${range.start.toLocaleDateString("en-IN")} – ${range.end.toLocaleDateString("en-IN")}`;

    return { salesByDate, totalSales, totalOrders, dates, maxSales, dateRangeLabel };
  }, [orders, filterType, activeCustomRange]);

  const filterButtons = [
    { key: "today", label: "Today Sales" },
    { key: "yesterday", label: "Yesterday" },
    { key: "week", label: "One Week" },
    { key: "month", label: "Last Month" },
    { key: "three-months", label: "Last 3 Months" },
    { key: "custom", label: "Custom Date" }
  ];

  function applyCustomRange() {
    setCustomError("");
    if (!customStartDate || !customEndDate) {
      setCustomError("Please select both start and end dates.");
      return;
    }
    if (new Date(customStartDate) > new Date(customEndDate)) {
      setCustomError("Start date cannot be after end date.");
      return;
    }
    setActiveCustomRange({ start: customStartDate, end: customEndDate });
  }

  function formatLabel(dateString) {
    return new Date(dateString).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  }

  return (
    <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
      <h2 className="text-xl font-black">Sales Analysis</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {filterButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => {
              setFilterType(btn.key);
              if (btn.key !== "custom") {
                setCustomError("");
              }
            }}
            className={`rounded-full px-4 py-2 text-sm font-black transition ${
              filterType === btn.key ? "bg-black text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {filterType === "custom" && (
        <div className="mt-4 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-stone-600 mb-1">From Date</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-semibold text-stone-600 mb-1">To Date</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <button
            onClick={applyCustomRange}
            className="px-4 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-stone-800"
          >
            Apply
          </button>
          {customError && <p className="w-full text-sm text-rose-600">{customError}</p>}
        </div>
      )}

      <div className="mt-6 rounded-[1.5rem] bg-stone-50 p-4">
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold text-stone-600">Total Sales</p>
            <p className="mt-2 text-2xl font-black text-black">{rupees(totalSales)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-600">Total Orders</p>
            <p className="mt-2 text-2xl font-black text-black">{totalOrders}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-600">Avg Order Value</p>
            <p className="mt-2 text-2xl font-black text-black">{totalOrders > 0 ? rupees(totalSales / totalOrders) : "₹0"}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-stone-500">
          <span>
            {filterType === "custom"
              ? `Custom range: ${activeCustomRange.start || "-"} to ${activeCustomRange.end || "-"}`
              : filterType === "three-months"
              ? "Watching last 3 months"
              : `Watching ${filterType} sales`}
          </span>
          {dates.length > 0 && <span>{dateRangeLabel}</span>}
        </div>

        {dates.length > 0 ? (
          <div className="mt-6 overflow-x-auto">
            <div className="relative h-[340px] min-w-full rounded-[1.5rem] bg-white p-4 shadow-sm">
              <div className="absolute left-4 top-4 right-4">
                <div className="flex justify-between text-[11px] text-stone-400">
                  <span>{rupees(maxSales)}</span>
                  <span>{rupees(Math.round(maxSales / 2))}</span>
                  <span>₹0</span>
                </div>
              </div>
              <div className="absolute inset-x-4 top-12 bottom-14 border-t border-stone-200" />
              <div className="absolute inset-x-4 bottom-14 top-16 flex items-end gap-3 overflow-x-auto px-1">
                {dates.map((date) => {
                  const sales = salesByDate[date].sales;
                  const barHeightPercent = maxSales > 0 ? (sales / maxSales) * 100 : 0;
                  return (
                    <div key={date} className="flex flex-col items-center justify-end" style={{ minWidth: "52px" }}>
                      <div
                        className="w-full rounded-t-3xl bg-gradient-to-t from-slate-900 to-stone-700 hover:opacity-90"
                        style={{ height: `${Math.max(barHeightPercent, 8)}%`, minHeight: "18px" }}
                        title={`${date}\nSales: ${rupees(sales)}\nOrders: ${salesByDate[date].orders}`}
                      />
                      <p className="mt-3 text-center text-[11px] font-semibold text-stone-700">{formatLabel(date)}</p>
                      <p className="text-[10px] text-stone-500">{rupees(sales)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-16 text-center">
            <p className="text-lg text-stone-400">📊 No sales data</p>
            <p className="text-sm text-stone-500 mt-1">for selected period</p>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderHistory({ orders }) {
  return (
    <section className="space-y-4">
      <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black">Order history</h2>
        <p className="mt-2 text-sm text-stone-600">Review completed and pending order records.</p>
      </div>
      {orders.map((order) => (
        <article key={order._id || order.id} className="rounded-[1.5rem] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-black">{order.customerName}</h3>
              <p className="text-sm text-stone-500">Table {order.tableNumber || order.tableNo} • {order.phone}</p>
            </div>
            <p className="text-sm font-black text-stone-700">{order.status}</p>
          </div>
          <div className="mt-3 grid gap-2 text-sm font-semibold text-stone-700">
            {(order.items || []).map((line, index) => (
              <p key={index}>{formatOrderItemLine(line)}</p>
            ))}
          </div>
        </article>
      ))}
      {orders.length === 0 && <p className="rounded-[1.5rem] bg-white p-6 font-bold text-stone-500">No orders yet.</p>}
    </section>
  );
}

function PosBilling({ items, categories, onSaved }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  const visibleItems = items.filter((item) => (!query || item.name.toLowerCase().includes(query.toLowerCase())) && (activeCategory === "all" || item.categoryId === activeCategory));
  const cartTotals = useMemo(() => calculateTotals(cart), [cart]);

  function handleAddToCart(item, sizeId, quantity, serveType) {
    setCart((current) => addCartItem(current, item, sizeId, quantity, serveType, { serveTypeFallback: "" }));
  }

  function handleUpdateQty(key, delta) {
    setCart((current) => updateCartQuantity(current, key, delta));
  }

  const total = cartTotals.total;

  async function handleCheckout(details) {
    const payload = {
      customerName: details.customerName || "OOC Customer",
      phone: details.phone || "0000000000",
      tableNumber: details.tableNumber || "OOC",
      paymentMethod: details.paymentMethod || "cash",
      items: cart.map((line) => ({ itemId: line.itemId, sizeId: line.sizeId, quantity: line.quantity, serveType: line.serveType, unitPrice: line.unitPrice, basePrice: line.basePrice, lineTotal: line.lineTotal, name: line.name, addons: line.addons })),
      notes: details.notes || "OOC (Order On Counter)"
    };
    const order = preparePrintableOrder(await orderService.createOrder(payload));
    setOrderResult(order);
    setCart([]);
    setCartOpen(false);
    onSaved();
  }

  return (
    <section className="space-y-5">
      <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">OOC (Order On Counter)</h2>
            <p className="mt-1 text-sm text-stone-600">Take quick counter orders (Order On Counter) and manage them from the owner dashboard.</p>
          </div>
          <button onClick={() => setCartOpen(true)} className="rounded-full bg-black px-4 py-3 text-sm font-black text-white">Open OOC cart ({cart.length})</button>
        </div>
      </div>
      <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap gap-3">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search menu" className="field w-full max-w-lg bg-stone-50" />
          <select value={activeCategory} onChange={(event) => setActiveCategory(event.target.value)} className="field bg-stone-50">
            <option value="all">All categories</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibleItems.map((item) => (
            <MenuItemCard key={item.id} item={item} onDetail={() => {}} onAdd={handleAddToCart} />
          ))}
        </div>
      </div>
      <div className="rounded-[1.5rem] bg-stone-50 p-5 shadow-sm">
        <h3 className="text-lg font-black">OOC summary</h3>
        <p className="mt-2 text-sm text-stone-600">Total items in cart: {cart.length}</p>
        <p className="mt-1 text-3xl font-black">{rupees(total)}</p>
      </div>
      {cartOpen && (
        <CartDrawer cart={cart} total={total} onClose={() => setCartOpen(false)} onQty={handleUpdateQty} onCheckout={handleCheckout} orderOnCounter={false} />
      )}
      {orderResult && <OrderSuccess order={orderResult} onClose={() => setOrderResult(null)} />}
    </section>
  );
}

function QrOrders({ orders, onSaved }) {
  return (
    <section>
      <div className="rounded-[1.5rem] bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black">QR orders</h2>
        <p className="mt-2 text-sm text-stone-600">Orders placed by customers through the digital menu.</p>
      </div>
      <OrderAdmin orders={orders} onSaved={onSaved} hideWarnings={true} />
    </section>
  );
}

export default App;
