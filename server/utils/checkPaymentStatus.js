const Razorpay = require("razorpay");
require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function checkPaymentStatus(paymentId) {
  try {
    // ✅ Correct method to fetch a payment
    const payment = await razorpay.payments.fetch(paymentId);

    if (!payment) {
      return { success: false, message: "Payment not found." };
    }

    // ✅ Check if payment is captured (i.e., successful)
    if (payment.status === "captured") {
      return { success: true };
    } else {
      return { success: false, message: `Payment status: ${payment.status}` };
    }
  } catch (error) {
    console.error("Error in checkPaymentStatus:", error);
    return { success: false, message: "Failed to check payment status." };
  }
}

module.exports = checkPaymentStatus;
