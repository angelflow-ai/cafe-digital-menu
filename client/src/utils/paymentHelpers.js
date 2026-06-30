import QRCode from "qrcode";
import { normalizeStatus } from "./orderHelpers";

export function getPaymentFlowState(paymentStatus) {
  const normalizedStatus = normalizeStatus(paymentStatus);
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

function formatUpiAmount(amount) {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) {
    throw new Error("Payment amount is invalid. Please refresh and try again.");
  }
  return Number.isInteger(numericAmount) ? String(numericAmount) : numericAmount.toFixed(2);
}

function buildSafePaymentNote(orderId) {
  const shortOrderId = String(orderId || "")
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 16);
  return `InfusionSaga Order ${shortOrderId}`.trim();
}

export function buildUpiString({ upiId, payeeName, amount, orderId }) {
  const trustedUpiId = String(upiId || "").trim();
  const trustedPayeeName = String(payeeName || "").trim();
  const amountStr = formatUpiAmount(amount);
  const params = {
    pa: trustedUpiId,
    pn: trustedPayeeName,
    am: amountStr,
    cu: "INR",
    tn: buildSafePaymentNote(orderId)
  };

  return `upi://pay?${Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&")}`;
}

export async function createQrDataUrl(value, options = { margin: 1, width: 280 }) {
  return QRCode.toDataURL(String(value), options);
}
