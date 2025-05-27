import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const randomBotNames = [
  "Sophia", "Pooja", "Varsha", "Ritika", "Disha", "Ayesha", "Katrina", "Priyanka", "Avneet", "Anushka", "Sonakshi"
];

const Chat = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [botTyping, setBotTyping] = useState(false);
  const [botName, setBotName] = useState("AI Assistant");
  const [errorMsg, setErrorMsg] = useState("");
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    axios
      .get("http://localhost:8080/api/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUser(res.data.user);
        const randomName = randomBotNames[Math.floor(Math.random() * randomBotNames.length)];
        setBotName(randomName);
        setMessages([
          {
            from: "bot",
            text: `Hi, I am ${randomName}. Ready to fulfill your desires! How would you like me?`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem("token");
        navigate("/login");
      });
  }, [navigate]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [
      ...prev,
      { from: "user", text: userMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
    ]);
    setInput("");
    setBotTyping(true);
    setErrorMsg("");

    try {
      const token = localStorage.getItem("token");

      const res = await axios.post(
        "http://localhost:8080/api/chat/chat",
        { message: userMessage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const botReply = res.data.reply || "Sorry, I have no answer for that.";
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: botReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setErrorMsg("Oops! Could not get a reply from the server.");
    } finally {
      setBotTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading)
    return <h3 style={{ textAlign: "center", marginTop: 40 }}>Loading...</h3>;

  return (
    <div style={styles.chatContainer}>
      <header style={styles.header}>
        <div>
          <p style={styles.botIntro}>Hi, I am <strong>{botName}</strong> to fulfill your desires!</p>
          <p style={styles.userWelcome}>Welcome, <strong>{user?.name}</strong></p>
        </div>
        <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
      </header>

      <main style={styles.messagesContainer}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={msg.from === "user" ? styles.userMsgWrapper : styles.botMsgWrapper}
          >
            <div style={msg.from === "user" ? styles.userMsg : styles.botMsg}>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.text}</p>
              <span style={styles.timestamp}>{msg.time}</span>
            </div>
          </div>
        ))}

        {botTyping && (
          <div style={styles.botMsgWrapper}>
            <div style={styles.botMsg}>
              <em>Typing...</em>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {errorMsg && <p style={styles.error}>{errorMsg}</p>}

      <footer style={styles.inputContainer}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message (Shift + Enter for new line)..."
          style={styles.textarea}
          disabled={botTyping}
          rows={2}
        />
        <button
          onClick={handleSend}
          style={input.trim() && !botTyping ? styles.sendButton : styles.sendButtonDisabled}
          disabled={botTyping || !input.trim()}
          title={botTyping ? "Wait for the bot..." : "Send message"}
        >
          Send
        </button>
      </footer>
    </div>
  );
};

const styles = {
  chatContainer: {
    maxWidth: 600,
    margin: "40px auto",
    height: "80vh",
    display: "flex",
    flexDirection: "column",
    borderRadius: 10,
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    backgroundColor: "#fafafa",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    overflow: "hidden",
    border: "1px solid #ddd",
  },
  header: {
    backgroundColor: "#075E54",
    color: "white",
    padding: "14px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  botIntro: {
    margin: 0,
    fontWeight: "600",
    fontSize: 16,
  },
  userWelcome: {
    margin: 0,
    fontSize: 14,
    opacity: 0.8,
  },
  logoutButton: {
    backgroundColor: "#25D366",
    border: "none",
    color: "white",
    padding: "8px 14px",
    borderRadius: 20,
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: 14,
    transition: "background-color 0.3s ease",
  },
  messagesContainer: {
    flex: 1,
    padding: "10px 16px",
    backgroundColor: "#ECE5DD",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
  },
  botMsgWrapper: {
    display: "flex",
    justifyContent: "flex-start",
    marginBottom: 10,
  },
  userMsgWrapper: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  botMsg: {
    backgroundColor: "white",
    color: "black",
    padding: "8px 12px",
    paddingRight: "50px",
    borderRadius: "18px 18px 18px 4px",
    maxWidth: "70%",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    position: "relative",
    fontSize: 15,
    whiteSpace: 'pre-wrap',
  },
  userMsg: {
    backgroundColor: "#DCF8C6",
    color: "black",
    padding: "8px 12px",
    paddingRight: "50px",
    borderRadius: "18px 18px 4px 18px",
    maxWidth: "70%",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    position: "relative",
    fontSize: 15,
    whiteSpace: 'pre-wrap',
  },
  timestamp: {
    fontSize: 11,
    color: "#999",
    position: "absolute",
    bottom: 2,
    right: 8,
  },
  inputContainer: {
    display: "flex",
    padding: "10px 16px",
    backgroundColor: "white",
    borderTop: "1px solid #ddd",
  },
  textarea: {
    flex: 1,
    resize: "none",
    borderRadius: 20,
    border: "1px solid #ccc",
    padding: 10,
    fontSize: 15,
    outline: "none",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  sendButton: {
    backgroundColor: "#128C7E",
    border: "none",
    color: "white",
    padding: "0 20px",
    marginLeft: 10,
    borderRadius: 20,
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: 15,
    userSelect: "none",
    transition: "background-color 0.3s ease",
  },
  sendButtonDisabled: {
    backgroundColor: "#a6a6a6",
    border: "none",
    color: "white",
    padding: "0 20px",
    marginLeft: 10,
    borderRadius: 20,
    cursor: "not-allowed",
    fontWeight: "bold",
    fontSize: 15,
    userSelect: "none",
  },
  error: {
    color: "#ff4d4f",
    textAlign: "center",
    margin: "6px 0",
    fontWeight: "bold",
  },
};

export default Chat;
