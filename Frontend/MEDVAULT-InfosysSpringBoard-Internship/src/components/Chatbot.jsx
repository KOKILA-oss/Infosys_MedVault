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
      const match = new RegExp(/^\d+\.\s+Dr\.\s+(.+?)\s+-\s+([^,]+),\s+(.+?)\s+at\s+(.+?)\s+\((.+)\)$/).exec(line);
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
        <span style={styles.minimizedEmoji} role="img" aria-hidden="true">
          💬
        </span>
        <span style={styles.minimizedLabel}>Ask MedBot your query</span>
      </button>
    );
  }

  return (
    <div style={styles.chatContainer}>
      <div style={styles.header}>
        <div>
          <strong style={styles.headerTitle}>MedVault Assistant</strong>
          <p style={styles.headerSubtitle}>Ask health or appointment questions</p>
        </div>
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
                <p style={{ ...styles.messageBubble, ...(msg.sender === "user" ? styles.userBubble : styles.botBubble) }}>
                  {msg.text}
                </p>
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
          placeholder="Ask MedBot anything..."
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
    bottom: "22px",
    right: "22px",
    width: "370px",
    height: "auto",
    background: "linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)",
    borderRadius: "16px",
    boxShadow: "0 18px 45px rgba(13, 34, 71, 0.22)",
    border: "1px solid #dce8ff",
    zIndex: 9999,
    display: "flex",
    flexDirection: "column"
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    borderBottom: "1px solid #e5edff",
    padding: "12px 14px",
    background: "linear-gradient(135deg, #0f62fe 0%, #2d7dff 100%)",
    borderTopLeftRadius: "16px",
    borderTopRightRadius: "16px",
    color: "#ffffff",
    fontSize: "14px"
  },
  headerTitle: {
    display: "block",
    fontSize: "14px",
    letterSpacing: "0.01em"
  },
  headerSubtitle: {
    margin: "2px 0 0",
    fontSize: "11px",
    opacity: 0.9
  },
  minimizeButton: {
    border: "none",
    background: "rgba(255,255,255,0.2)",
    color: "#ffffff",
    borderRadius: "8px",
    padding: "4px 10px",
    cursor: "pointer",
    fontWeight: 600
  },
  minimizedButton: {
    position: "fixed",
    bottom: "22px",
    right: "22px",
    border: "2px solid #7a2100",
    borderRadius: "999px",
    background: "linear-gradient(135deg, #ff7a00 0%, #ff2f2f 100%)",
    color: "white",
    padding: "11px 16px",
    boxShadow: "0 12px 28px rgba(168, 50, 0, 0.4), 0 0 0 4px rgba(255, 122, 0, 0.18)",
    cursor: "pointer",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 600,
    maxWidth: "240px",
    textAlign: "left"
  },
  minimizedEmoji: {
    fontSize: "16px",
    lineHeight: 1,
    filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.25))"
  },
  minimizedLabel: {
    fontSize: "12px",
    lineHeight: 1.2
  },
  chatBox: {
    height: "340px",
    overflowY: "auto",
    padding: "12px",
    fontSize: "14px"
  },
  messageBubble: {
    whiteSpace: "pre-wrap",
    margin: 0,
    display: "inline-block",
    maxWidth: "90%",
    borderRadius: "12px",
    padding: "8px 10px",
    lineHeight: 1.4
  },
  userBubble: {
    background: "linear-gradient(135deg, #0f62fe 0%, #3d86ff 100%)",
    color: "#ffffff",
    borderBottomRightRadius: "4px"
  },
  botBubble: {
    background: "#eef4ff",
    color: "#1f2f46",
    border: "1px solid #d9e7ff",
    borderBottomLeftRadius: "4px"
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
    borderRadius: "12px",
    background: "#f4f8ff",
    border: "1px solid #d9e6ff"
  },
  inputContainer: {
    display: "flex",
    borderTop: "1px solid #e5edff",
    padding: "10px",
    gap: "8px"
  },
  input: {
    flex: 1,
    border: "1px solid #d6e5ff",
    borderRadius: "10px",
    padding: "10px",
    outline: "none",
    background: "#ffffff"
  },
  button: {
    padding: "10px 14px",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(135deg, #0f62fe 0%, #2d7dff 100%)",
    color: "white",
    cursor: "pointer",
    fontWeight: 600
  }
};

export default Chatbot;
