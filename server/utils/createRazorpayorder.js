const Razorpay = require("razorpay");

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createOrder = async (amount, telegramId) => {
  const options = {
    amount: amount * 100,
    currency: "INR",
    receipt: `receipt_${telegramId}_${Date.now()}`,
    notes: { telegramId },
  };
  return await instance.orders.create(options);
};

module.exports = createOrder;
