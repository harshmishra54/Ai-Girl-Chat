async function sendRealChat(bot, chatId, msg) {
  try {
    await bot.sendMessage(chatId, msg);
  } catch (err) {
    console.error("sendRealChat error:", err.message);
  }
}

module.exports = sendRealChat;
