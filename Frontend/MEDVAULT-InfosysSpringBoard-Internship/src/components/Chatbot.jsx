import React, { useState } from "react";
import axios from "axios";

const Chatbot = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const extractBotText = (data) => {
    if (typeof data === "string") {
      try {
        const parsed = JSON.parse(data);
        return parsed?.choices?.[0]?.message?.content ?? data;
      } catch {
        return data;
      }
    }

    if (data && typeof data === "object") {
      return data?.choices?.[0]?.message?.content ?? JSON.stringify(data);
    }

    return "No response received.";
  };

  const sendMessage = async () => {
  if (!message) return;

  const userMsg = { sender: "user", text: message };
  setMessages(prev => [...prev, userMsg]);

  try {
    const res = await axios.post(
  "http://localhost:8080/chat",
  { message: message },
  {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`
    }
  }
);

    const botText = extractBotText(res.data);

    const botMsg = {
      sender: "bot",
      text: botText
    };

    setMessages(prev => [...prev, botMsg]);

  } catch (error) {
    console.error(error);

    const botMsg = {
      sender: "bot",
      text: "Something went wrong. Please try again."
    };

    setMessages(prev => [...prev, botMsg]);
  }

  setMessage("");
};

  return (
  <div style={styles.chatContainer}>
    
    <div style={styles.chatBox}>
      {messages.map((msg, index) => (
        <div
          key={index}
          style={{
            textAlign: msg.sender === "user" ? "right" : "left",
            marginBottom: "8px"
          }}
        >
          <p>{msg.text}</p>
        </div>
      ))}
    </div>

    <div style={styles.inputContainer}>
      <input
        style={styles.input}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask something..."
      />

      <button style={styles.button} onClick={sendMessage}>
        Send
      </button>
    </div>

  </div>
);
};

const styles = {
  chatContainer: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    width: "340px",
    height: "420px",
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column"
  },

  chatBox: {
    flex: 1,
    overflowY: "auto",
    padding: "10px",
    fontSize: "14px"
  },

  inputContainer: {
    display: "flex",
    borderTop: "1px solid #eee"
  },

  input: {
    flex: 1,
    border: "none",
    padding: "10px",
    outline: "none"
  },

  button: {
    padding: "10px 14px",
    border: "none",
    background: "#0f62fe",
    color: "white",
    cursor: "pointer"
  }
};

export default Chatbot;
