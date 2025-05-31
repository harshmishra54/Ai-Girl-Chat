const axios = require("axios");
require("dotenv").config();

const INSTAMOJO_API_KEY = process.env.INSTAMOJO_API_KEY;
const INSTAMOJO_AUTH_TOKEN = process.env.INSTAMOJO_AUTH_TOKEN;

async function checkPaymentStatus(paymentId) {
  try {
    const res = await axios.get(
      `https://www.instamojo.com/api/1.1/payments/${paymentId}/`,
      {
        headers: {
          "X-Api-Key": INSTAMOJO_API_KEY,
          "X-Auth-Token": INSTAMOJO_AUTH_TOKEN,
        },
      }
    );

    const payment = res.data.payment;
    return {
      success: payment.status === "Credit",
      payment,
    };
  } catch (err) {
    console.error("Instamojo error:", err.response?.data || err.message);
    return { success: false };
  }
}

module.exports = checkPaymentStatus;
