const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
  caption: String,
  category: String,
  image: Buffer,
  contentType: String,
});

module.exports = mongoose.model("Image", imageSchema);
