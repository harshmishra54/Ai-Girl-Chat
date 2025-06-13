import React, { useState } from "react";

const PaymentCheck = () => {
  const [telegramId, setTelegramId] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkPayment = async () => {
    if (!telegramId.trim()) {
      setError("Please enter a Telegram ID");
      setResult(null);
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/payments/check/${telegramId.trim()}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to fetch payment");
      }
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>Check Payment Status</h2>
      <input
        type="text"
        placeholder="Enter Telegram ID"
        value={telegramId}
        onChange={(e) => setTelegramId(e.target.value)}
        style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
      />
      <button onClick={checkPayment} disabled={loading} style={{ width: "100%", padding: "10px" }}>
        {loading ? "Checking..." : "Check Payment"}
      </button>

      {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 20, padding: 10, backgroundColor: "#f0f0f0" }}>
          <p>
            <strong>Status:</strong>{" "}
            {result.valid ? (
              <span style={{ color: "green" }}>Active</span>
            ) : (
              <span style={{ color: "orange" }}>Expired or Not Found</span>
            )}
          </p>
          <p>
            <strong>Message:</strong> {result.message}
          </p>
          {result.payment && (
            <>
              <p>
                <strong>Payment ID:</strong> {result.payment.paymentId}
              </p>
              <p>
                <strong>Amount:</strong> ₹{result.payment.amount}
              </p>
              <p>
                <strong>Verified At:</strong>{" "}
                {result.payment.verifiedAt
                  ? new Date(result.payment.verifiedAt).toLocaleString()
                  : "Not verified"}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PaymentCheck;
