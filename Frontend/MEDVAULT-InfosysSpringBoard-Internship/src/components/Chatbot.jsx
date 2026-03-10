import React, { useState } from "react";
import axios from "axios";

const parseAppointmentList = (text) => {
  if (typeof text !== "string" || !text.startsWith("Here are your upcoming appointments:")) {
    return null;
  }

  const appointments = text
    .split("\n")
    .slice(1)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(
        /^\d+\.\s+Dr\.\s+(.+?)\s+-\s+([^,]+),\s+(.+?)\s+at\s+(.+?)\s+\((.+)\)$/
      );
      if (!match) {
        return { raw: line };
      }

      return {
        doctorName: match[1],
        appointmentDay: match[2],
        appointmentDate: match[3],
        appointmentTime: match[4],
        appointmentStatus: match[5]
      };
    });

  return appointments.length > 0 ? appointments : null;
};

const Chatbot = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);

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
    if (!message.trim()) return;

    const userMsg = { sender: "user", text: message };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await axios.post(
        "http://localhost:8080/chat",
        { message },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      const botText = extractBotText(res.data);
      const botMsg = { sender: "bot", text: botText };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
      const botMsg = {
        sender: "bot",
        text: "Something went wrong. Please try again."
      };
      setMessages((prev) => [...prev, botMsg]);
    }

    setMessage("");
  };

  if (isMinimized) {
    return (
      <button
        type="button"
        style={styles.minimizedButton}
        onClick={() => setIsMinimized(false)}
        aria-label="Open chatbot"
        title="Open chatbot"
      >
        Chat
      </button>
    );
  }

  return (
    <div style={styles.chatContainer}>
      <div style={styles.header}>
        <strong>MedVault Assistant</strong>
        <button
          type="button"
          style={styles.minimizeButton}
          onClick={() => setIsMinimized(true)}
          aria-label="Minimize chatbot"
          title="Minimize"
        >
          _
        </button>
      </div>

      <div style={styles.chatBox}>
        {messages.map((msg, index) => {
          const parsedAppointments = msg.sender === "bot" ? parseAppointmentList(msg.text) : null;

          return (
            <div
              key={index}
              style={{
                textAlign: msg.sender === "user" ? "right" : "left",
                marginBottom: "8px"
              }}
            >
              {parsedAppointments ? (
                <div style={styles.appointmentResponse}>
                  <p style={styles.botHeading}>Here are your upcoming appointments:</p>
                  {parsedAppointments.map((appointment, appointmentIndex) => (
                    <div key={`${index}-${appointmentIndex}`} style={styles.appointmentCard}>
                      {"raw" in appointment ? (
                        <span>{appointment.raw}</span>
                      ) : (
                        <>
                          <strong>Dr. {appointment.doctorName}</strong>
                          <span>
                            {appointment.appointmentDay}, {appointment.appointmentDate}
                          </span>
                          <span>{appointment.appointmentTime}</span>
                          <span>Status: {appointment.appointmentStatus}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{msg.text}</p>
              )}
            </div>
          );
        })}
      </div>

      <div style={styles.inputContainer}>
        <input
          style={styles.input}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask something..."
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
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
    height: "auto",
    background: "white",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column"
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #eee",
    padding: "10px 12px",
    fontSize: "14px"
  },
  minimizeButton: {
    border: "none",
    background: "#e8f0ff",
    color: "#0f62fe",
    borderRadius: "8px",
    padding: "6px 10px",
    cursor: "pointer",
    fontWeight: 600
  },
  minimizedButton: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    border: "none",
    borderRadius: "999px",
    background: "#0f62fe",
    color: "white",
    padding: "10px 14px",
    boxShadow: "0 4px 16px rgba(15,98,254,0.35)",
    cursor: "pointer",
    zIndex: 9999
  },
  chatBox: {
    height: "320px",
    overflowY: "auto",
    padding: "10px",
    fontSize: "14px"
  },
  appointmentResponse: {
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },
  botHeading: {
    margin: 0,
    fontWeight: 600
  },
  appointmentCard: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "10px 12px",
    borderRadius: "10px",
    background: "#f4f8ff",
    border: "1px solid #d9e6ff"
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
