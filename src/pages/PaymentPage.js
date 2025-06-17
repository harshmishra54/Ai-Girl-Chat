import React, { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ✅ Attach autoTable to jsPDF prototype manually
jsPDF.API.autoTable = autoTable;

 // ✅ Just import it like this (NO autoTable(jsPDF))

const PaymentPage = () => {
  const [telegramId, setTelegramId] = useState("");
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState("");

  const fetchPayments = async () => {
    try {
      const response = await fetch(`https://ai-girl-chat-2.onrender.com/api/payments/check/${telegramId}`);
      const data = await response.json();

      if (!response.ok || !data.success || !data.payment) {
        throw new Error(data.message || "Invalid Telegram ID or server issue.");
      }

      setPayment(data.payment);
      setError("");
    } catch (err) {
      console.error("Error fetching payments:", err.message);
      setError(err.message);
      setPayment(null);
    }
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("AI Girl Chat - Payment Invoice", 14, 22);
    doc.setFontSize(12);
    doc.text(`Invoice Date: ${new Date().toLocaleString()}`, 14, 30);

    doc.autoTable({
      startY: 40,
      head: [["Field", "Value"]],
      body: [
        ["Telegram ID", payment.notes?.telegramId || "-"],
        ["Payment ID", payment.paymentId || "-"],
        ["Amount (₹)", payment.amount || "-"],
        ["Verified At", payment.verifiedAt ? new Date(payment.verifiedAt).toLocaleString() : "Not Verified"],
        ["Status", payment.verifiedAt ? "Verified" : "Not Verified"],
        ["UPI/VPA", payment.raw?.vpa || "N/A"],
        ["Email", payment.raw?.email || "N/A"],
      ],
    });

    doc.setFontSize(10);
    doc.text("Thank you for your payment! - AI Girl Chat", 14, doc.lastAutoTable.finalY + 10);

    doc.save(`invoice_${telegramId}.pdf`);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h2>Check Payment Status</h2>
      <input
        type="text"
        placeholder="Enter Telegram ID"
        value={telegramId}
        onChange={(e) => setTelegramId(e.target.value)}
      />
      <button onClick={fetchPayments} style={{ marginLeft: "10px" }}>Check</button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {payment && (
        <div style={{ marginTop: "2rem" }}>
          <h3>Payment Details:</h3>
          <ul>
            <li><strong>Telegram ID:</strong> {payment.notes?.telegramId || "-"}</li>
            <li><strong>Payment ID:</strong> {payment.paymentId || "-"}</li>
            <li><strong>Amount:</strong> ₹{payment.amount || "-"}</li>
            <li><strong>Status:</strong> {payment.verifiedAt ? "Verified" : "Not Verified"}</li>
            <li><strong>Verified At:</strong> {payment.verifiedAt ? new Date(payment.verifiedAt).toLocaleString() : "N/A"}</li>
            <li><strong>UPI/VPA:</strong> {payment.raw?.vpa || "N/A"}</li>
            <li><strong>Email:</strong> {payment.raw?.email || "N/A"}</li>
          </ul>

          <button onClick={downloadPDF} style={{ marginTop: "1rem" }}>
            Download Invoice PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;
