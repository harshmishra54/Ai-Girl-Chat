import React from "react";

const BotPage = () => {
  const telegramBotUsername = "AiGirlfriendBot54329Bot";
  const telegramLink = `https://t.me/${telegramBotUsername}`;

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Welcome to Your AI Girlfriend Chat Bot</h1>
      <p>Click the button below to chat with the Telegram bot.</p>
      <a
        href={telegramLink}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-block",
          padding: "15px 30px",
          backgroundColor: "#0088cc",
          color: "white",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: "bold",
          fontSize: "18px",
        }}
      >
        Open Telegram Bot
      </a>
    </div>
  );
};

export default BotPage;
