import React, { useState } from "react";

const PaymentPage = () => {
  const [telegramId, setTelegramId] = useState("");
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");

  const fetchPayments = async () => {
    try {
      const response = await fetch(`https://ai-girl-chat-2.onrender.com/api/payments/${telegramId}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch payment data.");
      }

      const data = await response.json();
      setPayments(data);
      setError("");
    } catch (err) {
      console.error("Error fetching payments:", err.message);
      setError("Invalid Telegram ID or server issue.");
      setPayments([]);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Check Payment Status</h2>
      <input
        type="text"
        placeholder="Enter Telegram ID"
        value={telegramId}
        onChange={(e) => setTelegramId(e.target.value)}
      />
      <button onClick={fetchPayments}>Check</button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {payments.length > 0 && (
        <div>
          <h3>Payment Results:</h3>
          <ul>
            {payments.map((payment) => (
              <li key={payment.paymentId}>
                <strong>ID:</strong> {payment.paymentId} | <strong>Amount:</strong> ₹{payment.amount} | <strong>Status:</strong>{" "}
                {payment.verifiedAt ? "Verified" : "Not Verified"} | <strong>Date:</strong> {new Date(payment.verifiedAt).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;
