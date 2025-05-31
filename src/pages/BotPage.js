import React from "react";

const BotPage = () => {
  const telegramBotUsername = "AiGirlfriendBot54329Bot";
  const telegramLink = `https://t.me/${telegramBotUsername}`;

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.heading}>✨ Meet Ayesha, Your AI Girlfriend 💖</h1>
        <p style={styles.description}>
          Tap the button below to start chatting with your personalized AI companion.
        </p>
        <a
          href={telegramLink}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.button}
        >
          🚀 Start Here
        </a>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #ffe6f0, #fff0f5)",
    padding: "20px",
  },
  card: {
    backgroundColor: "#ffffff",
    padding: "40px 30px",
    borderRadius: "16px",
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.1)",
    maxWidth: "500px",
    textAlign: "center",
  },
  heading: {
    fontSize: "28px",
    color: "#e75480",
    marginBottom: "20px",
    fontWeight: "600",
  },
  description: {
    fontSize: "16px",
    color: "#555",
    marginBottom: "30px",
    lineHeight: "1.6",
  },
  button: {
    padding: "14px 28px",
    backgroundColor: "#0088cc",
    color: "#ffffff",
    borderRadius: "10px",
    textDecoration: "none",
    fontSize: "18px",
    fontWeight: "bold",
    transition: "background-color 0.3s ease",
  },
};

export default BotPage;
