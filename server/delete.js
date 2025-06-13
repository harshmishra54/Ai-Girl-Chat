require("dotenv").config();
const mongoose = require("mongoose");

// Define your schema again here (or import from models)
const userSchema = new mongoose.Schema({
  telegramId: String,
  email: { type: String, unique: true, sparse: true },
  paymentVerified: { type: Boolean, default: false },
  paymentId: String,
  planExpiresAt: Date,
  freeChatStart: { type: Date, default: Date.now },
});
const User = mongoose.model("User", userSchema);

const MONGO_URI = process.env.MONGO_URI;
const telegramIdToDelete = "1469113335"; // <-- Replace with your ID

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    const result = await User.deleteOne({ telegramId: telegramIdToDelete });
    console.log(`✅ Deleted user: ${telegramIdToDelete}`, result);
    process.exit();
  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
})();
