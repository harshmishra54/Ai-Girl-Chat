const Razorpay = require("razorpay");
const express = require("express");
const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

router.post("/create-order", async (req, res) => {
  const { name, email } = req.body;

  const options = {
    amount: 9900, // ₹99 in paise
    currency: "INR",
    receipt: "receipt_" + Date.now(),
  };

  try {
    const order = await razorpay.orders.create(options);
    res.json({ orderId: order.id, amount: order.amount });
  } catch (error) {
    console.error("Order creation failed:", error.message);
    res.status(500).json({ error: "Order creation failed" });
  }
});

module.exports = router;
