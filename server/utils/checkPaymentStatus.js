const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function checkPaymentStatus(paymentId) {
  try {
    // Fetch payment link details by paymentId
    const paymentLink = await razorpay.paymentLink.fetch(paymentId);

    if (!paymentLink) {
      return { success: false, message: "Payment link not found." };
    }

    // paymentLink.status can be: 'created', 'paid', 'cancelled', 'expired'
    if (paymentLink.status === "paid") {
      return { success: true };
    } else {
      return { success: false, message: `Payment status: ${paymentLink.status}` };
    }
  } catch (error) {
    console.error("Error in checkPaymentStatus:", error);
    return { success: false, message: "Failed to check payment status." };
  }
}

module.exports = checkPaymentStatus;
