const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function checkPaymentStatus(paymentId) {
  try {
    // ✅ Fetch actual payment using paymentId
    const payment = await razorpay.payments.fetch(paymentId);

    if (!payment) {
      return { success: false, message: "Payment not found." };
    }

    if (payment.status === "captured" || payment.status === "authorized") {
      return {
        success: true,
        amount: payment.amount, // still in paisa
      };
    } else {
      return {
        success: false,
        message: `Payment status: ${payment.status}`,
      };
    }
  } catch (error) {
    console.error("Error in checkPaymentStatus:", error);
    return { success: false, message: "Failed to check payment status." };
  }
}

module.exports = checkPaymentStatus;
