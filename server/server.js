const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");

dotenv.config();
connectDB();

const app = express();

// ✅ CORS setup for Netlify frontend
app.use(
  cors({
    origin: "https://ai-girl-chat.netlify.app",
    credentials: true,
  })
);

// ✅ Ensure preflight requests are handled




app.use(express.json());

app.use('/api/auth', authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
// app.use("/")
app.get("/ping", (req, res) => {
  res.send("Pong!");
});
// Root route for GET /
app.get("/", (req, res) => {
  res.send("AI Girl Chat Server is active!");
});

// app.use('/api/payments', paymentRoutes);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
