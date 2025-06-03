require("dotenv").config();
const express = require("express");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");
const connectDB = require("./config/db");
const User = require("./models/User");
const createOrder = require("./utils/createRazorpayorder");
const crypto = require("crypto");

const app = express();
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

app.use(express.json());

// ✅ MongoDB
connectDB();

// ✅ Telegram Webhook Endpoint
app.post(`/bot${process.env.BOT_TOKEN}`, async (req, res) => {
  const msg = req.body.message;
  const chatId = msg.chat.id;
  const text = msg.text;

  let user = await User.findOne({ telegramId: chatId });
  if (!user) {
    user = await User.create({
      telegramId: chatId,
      username: msg.from.username || "",
    });
  }

  if (text === "/start") {
    const payLink = `${process.env.APP_URL}/payment/${chatId}`;
    bot.sendMessage(chatId, `Welcome! Click to pay: ${payLink}`);
  } else {
    if (user.paymentVerified && user.planExpiresAt > new Date()) {
      const response = await axios.post("https://api.openai.com/v1/chat/completions", {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: text }],
      }, {
        headers: {
          Authorization: `Bearer ${process.env.BOT_API_KEY}`,
          "Content-Type": "application/json",
        },
      });

      const aiReply = response.data.choices[0].message.content;
      bot.sendMessage(chatId, aiReply);
    } else {
      bot.sendMessage(chatId, "❌ You need to pay to use this bot.");
    }
  }

  res.sendStatus(200);
});

// ✅ Razorpay Order Creator (used by frontend)
app.get("/payment/:telegramId", async (req, res) => {
  const telegramId = req.params.telegramId;
  const amount = 99; // ₹99

  try {
    const order = await createOrder(amount, telegramId);
    res.send(`
      <html>
        <body>
          <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
          <script>
            const options = {
              key: "${process.env.RAZORPAY_KEY_ID}",
              amount: ${order.amount},
              currency: "INR",
              name: "Premium Bot Access",
              description: "Get 30 days of access",
              order_id: "${order.id}",
              handler: function (response) {
                alert("Payment successful!");
              },
              prefill: {
                name: "Telegram User",
                email: "example@example.com"
              },
              notes: {
                telegramId: "${telegramId}"
              },
              theme: {
                color: "#3399cc"
              }
            };
            const rzp = new Razorpay(options);
            rzp.open();
          </script>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send("Error creating order");
  }
});

// ✅ Razorpay Webhook Handler
app.post("/webhook/razorpay", express.json({ type: "application/json" }), async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];
  const digest = crypto.createHmac("sha256", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (digest !== signature) {
    return res.status(400).send("Invalid signature");
  }

  const payload = req.body;
  if (payload.event === "payment.captured") {
    const paymentId = payload.payload.payment.entity.id;
    const telegramId = payload.payload.payment.entity.notes.telegramId;

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    await User.findOneAndUpdate(
      { telegramId },
      {
        paymentVerified: true,
        paymentId,
        planExpiresAt: expiry,
      }
    );
    console.log(`✅ Payment verified for ${telegramId}`);
  }

  res.sendStatus(200);
});

// ✅ Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Set Telegram webhook
  const webhookUrl = `${process.env.APP_URL}/bot${process.env.BOT_TOKEN}`;
  try {
    await bot.setWebHook(webhookUrl);
    console.log("✅ Webhook set:", webhookUrl);
  } catch (err) {
    console.error("❌ Webhook error:", err.message);
  }
});
