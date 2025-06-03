import React, { useEffect } from "react";
import "./PaymentPage.css";

const BACKEND_URL = "https://ai-girl-chat-2.onrender.com"; // Your bot backend

const PaymentPage = () => {
  const query = new URLSearchParams(window.location.search);
  const telegramId = query.get("telegramId");

  useEffect(() => {
    if (!telegramId) {
      alert("Telegram ID missing in URL!");
    }
  }, [telegramId]);

  const handlePayment = async () => {
    if (!telegramId) return;

    try {
      const res = await fetch(`${BACKEND_URL}/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId }),
      });

      const data = await res.json();

      const options = {
        key: "rzp_test_wU21klHA5cKF02", // 🛑 Replace with real Razorpay Key ID
        amount: data.amount,
        currency: data.currency,
        name: "AI Girlfriend Chat",
        description: "Premium Access Plan",
        order_id: data.orderId,
        handler: function (response) {
          alert("✅ Payment successful! Returning to bot...");
          window.location.href = "https://t.me/AiGirlfriendbot54329Bot"; // ✅ Your bot link
        },
        prefill: {
          name: "Telegram User",
          email: "user@example.com",
        },
        notes: {
          telegramId,
        },
        theme: {
          color: "#ff4081",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      alert("❌ Failed to initiate payment. Try again.");
    }
  };

  return (
    <div className="payment-container">
      <h1>💖 Unlock AI Girlfriend Premium</h1>
      <p>Just ₹499 for unlimited chats for 30 days.</p>
      <button onClick={handlePayment}>Pay ₹499 Now</button>
    </div>
  );
};

export default PaymentPage;
