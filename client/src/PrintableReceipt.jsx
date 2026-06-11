import React from "react";
import logoUrl from "./assets/infusion-saga-logo.png";
import reviewQrUrl from "./assets/review-qr.jpeg";
import { formatOrderItemLine, getAddonTotal, getBasePrice, getFinalItemTotal, getItemQuantity, getOrderTotal } from "./utils/orderDisplayFormatter";

function rupees(value) {
  return `Rs. ${Math.round(Number(value || 0)).toLocaleString("en-IN")}`;
}

function formatDate(value) {
  const date = new Date(value || Date.now());
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function normalizeLineItem(item) {
  const quantity = getItemQuantity(item);
  const lineText = formatOrderItemLine(item);
  return {
    name: item.name || item.title || item.itemId || item.id || "Item",
    qty: quantity,
    total: getFinalItemTotal(item),
    baseTotal: getBasePrice(item) * quantity,
    addonTotal: getAddonTotal(item) * quantity,
    sizeName: item.sizeName || item.size || "",
    serveType: item.serveType || "",
    addons: item.addons || {},
    lineText
  };
}

function getReceiptOrderType(order) {
  const explicitType = String(order.orderType || order.type || "").toLowerCase();
  const paymentMethod = String(order.paymentMethod || order.payment || "").toLowerCase();
  const note = String(order.notes || order.note || "").toLowerCase();

  if (explicitType.includes("coc") || explicitType.includes("counter") || note.includes("order on counter") || note.includes("cash on counter")) {
    return "Order On Counter";
  }
  if (paymentMethod.includes("cash") || paymentMethod.includes("coc")) {
    return "Cash On Counter";
  }
  if (paymentMethod.includes("upi") || paymentMethod.includes("qr") || paymentMethod.includes("online")) {
    return "Paid Online";
  }
  return "Dine-In";
}

function getReceiptPaymentLabel(order) {
  const method = String(order.paymentMethod || order.payment || "cash").toLowerCase();
  if (method.includes("online") || method.includes("upi") || method.includes("qr")) return "Online";
  if (method.includes("cash") || method.includes("coc") || method.includes("counter")) return "Cash";
  return "Cash";
}

function getReceiptStatusLabel() {
  return "Paid";
}

export function normalizeReceiptOrder(order = {}) {
  const receiptId = order.orderId || order.id || order._id || `INF-${String(Date.now()).slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
  const createdAt = order.createdAt || order.createdAtAt || order.date || order.orderDate || order.confirmedAt || order.updatedAt || new Date().toISOString();
  const paymentStatus = String(order.paymentStatus || order.status || "").toLowerCase().replace(/[_\s-]+/g, " ");
  const paymentLabel = paymentStatus ? paymentStatus.replace(/\b\w/g, (match) => match.toUpperCase()) : "Unknown";

  return {
    ...order,
    orderId: receiptId,
    createdAt,
    customerName: order.customerName || order.name || order.customer || "Guest",
    phone: order.phone || order.mobile || order.contact || "-",
    tableNumber: order.tableNumber ?? order.table ?? order.tableNo ?? "-",
    paymentMethod: order.paymentMethod || order.payment || "cash",
    paymentStatus: paymentLabel,
    items: Array.isArray(order.items) ? order.items : Array.isArray(order.cart) ? order.cart : [],
    subtotal: Number(order.subtotal ?? getOrderTotal(order) ?? 0),
    total: Number(order.total ?? order.grandTotal ?? getOrderTotal(order) ?? 0),
    gst: Number(order.gst ?? Math.round((Number(order.subtotal ?? getOrderTotal(order) ?? 0)) * (Number(order.gstRate ?? 0.05)) ))
  };
}

export default function PrintableReceipt({ order, copyType = "customer", receiptWidth, fontSize }) {
  const normalizedOrder = normalizeReceiptOrder(order);
  const receiptId = normalizedOrder.orderId;
  const createdAt = normalizedOrder.createdAt;
  const items = Array.isArray(normalizedOrder.items) ? normalizedOrder.items.map(normalizeLineItem) : [];
  const subtotal = Number(normalizedOrder.subtotal || getOrderTotal(normalizedOrder) || 0);
  const total = Number(normalizedOrder.total ?? subtotal);
  const paymentMethod = getReceiptPaymentLabel(normalizedOrder);
  const statusLabel = getReceiptStatusLabel(normalizedOrder);
  const handledBy = String(normalizedOrder.handledBy || normalizedOrder.billerName || normalizedOrder.staffName || "-").trim() || "-";
  const copyLabel = copyType === "kitchen" ? "Kitchen Copy" : copyType === "both" ? "Customer / Kitchen Copy" : "Customer Copy";
  const orderLines = copyType === "both" ? ["Customer Copy", "Kitchen Copy"] : [copyLabel];

  return (
    <div className="receipt-print-area print-only">
      {orderLines.map((label) => (
        <article key={label} className="receipt" style={{ width: receiptWidth ? `${receiptWidth}px` : undefined, fontSize: fontSize ? `${fontSize}px` : undefined }}>
          <div className="receipt-header">
            <img src={logoUrl} alt="The Infusion Saga" className="receipt-logo" />
            <div className="receipt-title">THE INFUSION SAGA</div>
            <div className="receipt-address">A155, Ramnagariya Rd, Mahadev Nagar, Jagatpura, Jaipur, Rajasthan</div>
          </div>

          <div className="receipt-line" />

          <div className="receipt-center-text">{label}</div>

          <div style={{ marginTop: 6 }}>
            <div className="receipt-row"><div>Date/Time</div><div>{formatDate(createdAt)}</div></div>
            <div className="receipt-row"><div>Order ID</div><div>{receiptId}</div></div>
            <div className="receipt-row"><div>Table No.</div><div>{normalizedOrder.tableNumber ?? (normalizedOrder.table ?? "-")}</div></div>
            <div className="receipt-row"><div>Customer</div><div>{normalizedOrder.customerName || "Guest"}</div></div>
            <div className="receipt-row"><div>Phone</div><div>{normalizedOrder.phone || "-"}</div></div>
            <div className="receipt-row"><div>Payment</div><div>{paymentMethod}</div></div>
            <div className="receipt-row"><div>Status</div><div>{statusLabel}</div></div>
            {handledBy && handledBy !== "-" && (
              <div className="receipt-row"><div>Handled By</div><div>{handledBy}</div></div>
            )}
          </div>

          <div className="receipt-line" />

          <div>
            <div className="receipt-table-header receipt-table-header--compact">
              <div>QTY</div>
              <div>ITEM</div>
              <div className="receipt-amount">AMOUNT</div>
            </div>
            {items.length === 0 && <div style={{padding:'8px 0'}}>No items.</div>}
            {items.map((line, idx) => {
              const addonEntries = [
                ...(Array.isArray(line.addons?.selectedAddons) ? line.addons.selectedAddons.map((addon) => ({
                  name: addon.name || "Addon",
                  amount: Number(addon.price || 0) * line.qty
                })) : []),
                ...(line.addons?.extraCheese ? [{
                  name: "Extra Cheese",
                  amount: Number(line.addons?.extraCheesePrice || 0) * line.qty
                }] : [])
              ];
              const itemLabel = [line.name, line.serveType ? `• ${line.serveType}` : ""].filter(Boolean).join(" ");

              return (
                <div key={`${line.name}-${idx}`} style={{ marginTop: 6 }}>
                  <div className="receipt-item">
                    <div>{line.qty}</div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{itemLabel}</div>
                    </div>
                    <div className="receipt-amount">{rupees(line.baseTotal)}</div>
                  </div>
                  {addonEntries.map((addon, addonIndex) => (
                    <div key={`${line.name}-${idx}-addon-${addonIndex}`} className="receipt-item receipt-item-addon">
                      <div />
                      <div style={{ fontSize: 10 }}>{addon.name}</div>
                      <div className="receipt-amount">+ {rupees(addon.amount)}</div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="receipt-line" />

          <div style={{ marginTop: 6 }}>
            <div className="receipt-row receipt-row--total-label"><div>Subtotal</div><div>{rupees(subtotal)}</div></div>
            <div className="receipt-total" style={{ marginTop: 8 }}>
              <div>TOTAL</div>
              <div>{rupees(total)}</div>
            </div>
          </div>

          <div className="receipt-line" />

          <div className="receipt-center-text">Thank You For Visiting ☕</div>
          <div className="receipt-center-text receipt-center-text--small">We Hope To Serve You Again Soon</div>
          <div className="receipt-line" />
          <div className="receipt-center-text">Scan To Review Us ⭐⭐⭐⭐⭐</div>
          <div className="receipt-qr"><img src={reviewQrUrl} alt="Google Review QR" className="review-qr-image" /></div>
          <div className="receipt-line" />
          <div className="receipt-center-text">Follow Us On Instagram</div>
          <div className="receipt-center-text receipt-center-text--small">@theinfusionsaga</div>

        </article>
      ))}
    </div>
  );
}
