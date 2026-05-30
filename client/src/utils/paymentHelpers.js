import QRCode from "qrcode";

export function normalizePaymentStatus(value) {
  return String(value || "").toLowerCase().trim().replace(/[_\s]+/g, " ");
}

export function getPaymentFlowState(paymentStatus) {
  const normalizedStatus = normalizePaymentStatus(paymentStatus);
  const isRejected = ["payment issue", "rejected", "payment rejected", "payment_rejected"].includes(normalizedStatus);
  return {
    normalizedStatus,
    isPendingVerification: normalizedStatus === "pending verification",
    isPaymentIssue: isRejected,
    isConfirmed: ["confirmed", "paid"].includes(normalizedStatus)
  };
}

export function getPaymentOutcomeCopy(paymentStatus) {
  const state = getPaymentFlowState(paymentStatus);

  if (state.isPendingVerification) {
    return {
      headline: "Biller is checking your payment...",
      description: "Please stay on this page. Your order will update automatically — the biller will verify your payment shortly."
    };
  }

  if (state.isConfirmed) {
    return {
      headline: "Order Placed Successfully!",
      description: "Your payment has been verified and your order is now being prepared."
    };
  }

  if (state.isPaymentIssue) {
    return {
      headline: "Payment Rejected",
      description: "Your payment was not verified. Please check your payment or talk to the biller at the counter."
    };
  }

  return { headline: "", description: "" };
}

export function buildUpiString({ upiId, payeeName, amount, orderId }) {
  const amountStr = String(Math.floor(Number(amount) || 0));
  const params = new URLSearchParams({
    pa: upiId,
    pn: payeeName,
    am: amountStr,
    cu: "INR",
    tn: `Order_${orderId || ""}`
  });

  return `upi://pay?${params.toString()}`;
}

export async function createQrDataUrl(value, options = { margin: 1, width: 280 }) {
  return QRCode.toDataURL(String(value), options);
}