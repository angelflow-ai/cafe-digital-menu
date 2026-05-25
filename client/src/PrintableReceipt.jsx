import React, { useEffect, useRef } from "react";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import logoUrl from "./assets/infusion-saga-logo.png";

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
  const unitPrice = Number(item.unitPrice ?? item.price ?? 0);
  const quantity = Number(item.quantity ?? 1);
  return {
    name: item.name || item.itemId || item.id || "Item",
    qty: quantity,
    price: unitPrice,
    total: unitPrice * quantity,
    sizeName: item.sizeName || item.size || ""
  };
}

export default function PrintableReceipt({ order, copyType = "customer", receiptWidth, fontSize }) {
  const receiptId = order.orderId || order.id || order._id || `INF-${String(Date.now()).slice(-6)}-${Math.floor(Math.random() * 900 + 100)}`;
  const createdAt = order.createdAt || order.createdAtAt || order.date || new Date().toISOString();
  const items = Array.isArray(order.items) ? order.items.map(normalizeLineItem) : [];
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const gstRate = 0.05;
  const gstAmount = Number(order.gst ?? Math.round(subtotal * gstRate));
  const total = Number(order.total ?? subtotal + gstAmount);
  const paymentMethod = String(order.paymentMethod || order.payment || "Cash").replace(/online/i, "Online").replace(/cash/i, "Cash");
  const tableLabel = order.tableNumber ? `Table ${order.tableNumber}` : order.paymentMethod === "online" ? "Online order" : order.pendingApproval ? "Counter" : "Counter";
  const copyLabel = copyType === "kitchen" ? "Kitchen Copy" : copyType === "both" ? "Customer / Kitchen Copy" : "Customer Copy";
  const orderLines = copyType === "both" ? ["Customer Copy", "Kitchen Copy"] : [copyLabel];

  const qrData = order.qrData || receiptId;
  const gstin = order.gstin || order.GSTIN || order.gstinNo || order.businessGstin || "08AAAPL1234C1Z1";
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
            <div className="receipt-row"><div>Table</div><div>{order.tableNumber ?? (order.table ?? "-")}</div></div>
            <div className="receipt-row"><div>Order No.</div><div>{receiptId}</div></div>
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
                  <div style={{fontWeight:700}}>{line.name}</div>
                  {line.sizeName && <div style={{fontSize:10}}>{line.sizeName}</div>}
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
