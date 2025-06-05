const Razorpay = require("razorpay");

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createPaymentLink(amount, description, customer) {
  // amount in paise, e.g., ₹100 = 10000 paise
  const options = {
    amount: amount, // in paise
    currency: "INR",
    accept_partial: false,
    description: description,
    customer: {
      name: customer.name,
      email: customer.email,
      contact: customer.contact || "", // optional phone number
    },
    notify: {
      sms: true,
      email: true,
    },
    reminder_enable: true,
    notes: {
      note1: "Payment for AI Girl Chat subscription",
    },
    // callback_url: "https://yourapp.com/payment-callback", // optional webhook
    // callback_method: "get",
  };

  const response = await razorpayInstance.paymentLink.create(options);
  return response.short_url; // this is the Razorpay payment link URL
}

module.exports = createPaymentLink;
