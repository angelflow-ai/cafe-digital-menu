import React, { useState } from "react";

const UPI_ID = "gpay-12204651313@okbizaxis";
const PAYEE_NAME = "THE INFUSION SAGA";

const TEST_LINKS = [
  {
    label: "Receiver Only",
    url: "upi://pay?pa=gpay-12204651313%40okbizaxis&pn=THE%20INFUSION%20SAGA&cu=INR"
  },
  {
    label: "Amount Decimal",
    url: "upi://pay?pa=gpay-12204651313%40okbizaxis&pn=THE%20INFUSION%20SAGA&am=2.00&cu=INR"
  },
  {
    label: "Amount Integer",
    url: "upi://pay?pa=gpay-12204651313%40okbizaxis&pn=THE%20INFUSION%20SAGA&am=2&cu=INR"
  },
  {
    label: "With Safe Note",
    url: "upi://pay?pa=gpay-12204651313%40okbizaxis&pn=THE%20INFUSION%20SAGA&am=2.00&cu=INR&tn=InfusionSaga"
  }
];

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);
}

export default function CustomerUpiTest() {
  const [copiedKey, setCopiedKey] = useState("");

  async function handleCopy(key, value) {
    await copyText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(""), 1500);
  }

  return (
    <main className="upi-test-page">
      <section className="upi-test-card">
        <h1>UPI Link Test</h1>
        <div className="upi-test-meta">
          <p><strong>UPI ID:</strong> {UPI_ID}</p>
          <p><strong>Payee:</strong> {PAYEE_NAME}</p>
          <p><strong>Amount:</strong> 2</p>
        </div>

        <div className="upi-test-list">
          {TEST_LINKS.map((item) => (
            <article key={item.label} className="upi-test-item">
              <button
                type="button"
                className="upi-test-open-btn"
                onClick={() => {
                  window.location.href = item.url;
                }}
              >
                {item.label}
              </button>
              <code>{item.url}</code>
              <button
                type="button"
                className="upi-test-copy-btn"
                onClick={() => handleCopy(item.label, item.url)}
              >
                {copiedKey === item.label ? "Copied URL" : "Copy URL"}
              </button>
            </article>
          ))}

          <article className="upi-test-item">
            <button
              type="button"
              className="upi-test-open-btn"
              onClick={() => handleCopy("upi-id", UPI_ID)}
            >
              {copiedKey === "upi-id" ? "Copied UPI ID" : "Copy UPI ID"}
            </button>
            <code>{UPI_ID}</code>
          </article>
        </div>
      </section>
    </main>
  );
}

