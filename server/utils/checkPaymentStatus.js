const axios = require("axios");
require("dotenv").config();

const INSTAMOJO_API_KEY = process.env.INSTAMOJO_API_KEY;
const INSTAMOJO_AUTH_TOKEN = process.env.INSTAMOJO_AUTH_TOKEN;

async function checkPaymentStatus(paymentId) {
  try {
    const response = await axios.get(
      `https://www.instamojo.com/api/1.1/payments/${paymentId}/`,
      {
        headers: {
          "X-Api-Key": INSTAMOJO_API_KEY,
          "X-Auth-Token": INSTAMOJO_AUTH_TOKEN,
        },
      }
    );

    const payment = response.data?.payment;

    if (!payment) {
      console.warn("⚠️ Payment not found or malformed response:", response.data);
      return { success: false };
    }

    const isPaid = payment.status === "Credit";

    return {
      success: isPaid,
      payment,
    };
  } catch (err) {
    console.error("❌ Instamojo Error:", err.response?.data || err.message);
    return { success: false };
  }
}

module.exports = checkPaymentStatus;
