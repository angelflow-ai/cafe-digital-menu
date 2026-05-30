import React, { useEffect, useRef } from "react";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import logoUrl from "./assets/infusion-saga-logo.png";
import { formatOrderItemLine, getFinalItemTotal, getOrderTotal } from "./utils/orderDisplayFormatter";

function rupees(value) {
  return `Rs. ${Number(value || 0).toFixed(2)}`;
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
  const quantity = Number(item.quantity ?? 1);
  const lineText = formatOrderItemLine(item);
  return {
    name: item.name || item.title || item.itemId || item.id || "Item",
    qty: quantity,
    total: getFinalItemTotal(item),
    sizeName: item.sizeName || item.size || "",
    serveType: item.serveType || "",
    addons: item.addons || {},
    lineText
  };
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
  const gstRate = 0.05;
  const gstAmount = Number(normalizedOrder.gst ?? Math.round(subtotal * gstRate));
  const total = Number(normalizedOrder.total ?? subtotal + gstAmount);
  const paymentMethod = String(normalizedOrder.paymentMethod || "Cash").replace(/online/i, "Online").replace(/cash/i, "Cash");
  const copyLabel = copyType === "kitchen" ? "Kitchen Copy" : copyType === "both" ? "Customer / Kitchen Copy" : "Customer Copy";
  const orderLines = copyType === "both" ? ["Customer Copy", "Kitchen Copy"] : [copyLabel];

  const qrData = normalizedOrder.qrData || receiptId;
  const gstin = normalizedOrder.gstin || normalizedOrder.GSTIN || normalizedOrder.gstinNo || normalizedOrder.businessGstin || "08AAAPL1234C1Z1";
  const qrImgRef = useRef(null);
  const barcodeRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    if (typeof QRCode?.toDataURL === 'function') {
      QRCode.toDataURL(String(qrData), { margin: 1, width: 150 })
        .then((url) => {
          if (!mounted) return;
          if (qrImgRef.current) qrImgRef.current.src = url;
        })
        .catch(() => { /* ignore */ });
    }
    try {
      if (barcodeRef.current && typeof JsBarcode === 'function') {
        JsBarcode(barcodeRef.current, String(receiptId), { format: 'CODE128', displayValue: false, height: 36, width: 1, margin: 0 });
      }
    } catch (e) {
      // ignore barcode errors
    }
    return () => { mounted = false; };
  }, [qrData, receiptId]);

  return (
    <div className="receipt-print-area print-only">
      {orderLines.map((label) => (
        <article key={label} className="receipt" style={{ width: receiptWidth ? `${receiptWidth}px` : undefined, fontSize: fontSize ? `${fontSize}px` : undefined }}>
          <div className="receipt-header">
            <div style={{fontWeight:700}}>{label}</div>
            <div className="receipt-title">THE INFUSION SAGA</div>
            <div style={{fontSize:11}}>A155, Ramnagariya Rd, Mahadev Nagar, Jagatpura, Jaipur, Rajasthan 302017</div>
          </div>

          <div className="receipt-line" />

          <div style={{marginTop:6}}>
            <div className="receipt-row"><div>Date</div><div>{formatDate(createdAt)}</div></div>
            <div className="receipt-row"><div>Order ID</div><div>{receiptId}</div></div>
            <div className="receipt-row"><div>Table</div><div>{normalizedOrder.tableNumber ?? (normalizedOrder.table ?? "-")}</div></div>
            <div className="receipt-row"><div>Customer</div><div>{normalizedOrder.customerName || "Guest"}</div></div>
            <div className="receipt-row"><div>Phone</div><div>{normalizedOrder.phone || "-"}</div></div>
            <div className="receipt-row"><div>Payment</div><div>{paymentMethod}</div></div>
            <div className="receipt-row"><div>Status</div><div>{normalizedOrder.paymentStatus || "Unknown"}</div></div>
            <div className="receipt-row"><div>Invoice</div><div>{order.invoiceNo || `INV-${String(receiptId).slice(-8)}`}</div></div>
            <div className="receipt-row"><div>GSTIN</div><div>{gstin}</div></div>
          </div>

          <div className="receipt-line" />

          <div>
            <div className="receipt-table-header">
              <div>QTY</div>
              <div>DESC</div>
              <div className="receipt-amount">AMT</div>
            </div>
            {items.length === 0 && <div style={{padding:'8px 0'}}>No items.</div>}
            {items.map((line, idx) => (
              <div key={`${line.name}-${idx}`} className="receipt-item" style={{marginTop:6}}>
                <div>{line.qty}</div>
                <div>
                  <div style={{fontWeight:700}}>{line.lineText}</div>
                  {line.addons?.extraCheese && <div style={{fontSize:10}}>Extra Cheese</div>}
                </div>
                <div className="receipt-amount">{rupees(line.total)}</div>
              </div>
            ))}
          </div>

          <div className="receipt-line" />

          <div style={{marginTop:6}}>
            <div className="receipt-row"><div>Subtotal</div><div>{rupees(subtotal)}</div></div>
            <div className="receipt-row"><div>Tax ({Math.round(gstRate*100)}%)</div><div>{rupees(gstAmount)}</div></div>
            <div className="receipt-total" style={{marginTop:8}}>
              <div>AMOUNT</div>
              <div>{rupees(total)}</div>
            </div>
          </div>

          <div className="receipt-qr"><img ref={qrImgRef} alt="Order QR" /></div>

        </article>
      ))}
    </div>
  );
}
