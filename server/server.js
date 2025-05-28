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

const allowedOrigins = [
  "http://localhost:3000",
  "https://ai-girl-chat.netlify.app"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes); 

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
