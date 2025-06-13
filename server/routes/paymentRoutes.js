const express = require('express');
const axios = require('axios');
const Payment = require('../models/paymentModel');
const router = express.Router();

const INSTAMOJO_API_KEY = process.env.INSTAMOJO_API_KEY;
const INSTAMOJO_AUTH_TOKEN = process.env.INSTAMOJO_AUTH_TOKEN;

router.post('/verify-payment', async (req, res) => {
  const { paymentId } = req.body;

  if (!paymentId) {
    return res.status(400).json({ message: 'paymentId is required' });
  }

  try {
    const response = await axios.get(`https://www.instamojo.com/api/1.1/payments/${paymentId}/`, {
      headers: {
        'X-Api-Key': INSTAMOJO_API_KEY,
        'X-Auth-Token': INSTAMOJO_AUTH_TOKEN,
      },
    });

    const paymentData = response.data.payment;

    if (paymentData.status !== 'Credit') {
      return res.status(400).json({ message: 'Payment not successful' });
    }

    let plan = null;
    const amount = parseFloat(paymentData.amount);

    if (amount >= 599) plan = '365-day';
    else if (amount >= 99) plan = '30-day';
    else if (amount >= 49) plan = '7-day';
    else if (amount >= 10) plan = '1-day';
    else plan = '1-day';

    let expiresAt = new Date(paymentData.created_at);
    switch (plan) {
      case '1-day': expiresAt.setDate(expiresAt.getDate() + 1); break;
      case '7-day': expiresAt.setDate(expiresAt.getDate() + 7); break;
      case '30-day': expiresAt.setDate(expiresAt.getDate() + 30); break;
      case '365-day': expiresAt.setDate(expiresAt.getDate() + 365); break;
    }

    const payment = await Payment.findOneAndUpdate(
      { paymentId },
      {
        paymentId,
        status: 'success',
        amount,
        plan,
        expiresAt,
        createdAt: new Date(paymentData.created_at),
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'Payment verified and saved', payment });
  } catch (error) {
    console.error('Instamojo verify error:', error.response?.data || error.message);
    res.status(500).json({ message: 'Payment verification failed' });
  }
});

module.exports = router;
