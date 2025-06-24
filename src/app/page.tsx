import React from "react";
import styles from "@/app/page.module.css";
import Countdown3D from "@/components/MessageDots";

const Home: React.FC = () => {
  return (
    <div className={styles.container}>
      <div className={styles.fullScreenContainer}>
        {Array.from({ length: 50 }).map((_, idx) => {
          const randomDelay = Math.random().toFixed(2);
          return (
            <h1
              key={idx}
              className={styles.loadingText}
              style={
                {
                  left: `${1 + idx * 5}%`,
                  "--random-delay": randomDelay,
                  opacity: 0.5,
                } as React.CSSProperties
              }
            >
              Anh yêu em
            </h1>
          );
        })}
        <Countdown3D messages={["Happy ", "Anh Yêu Em", "Anh nhớ em nhiều lắm.", "Anh yêu em rất nhiều."]} />
      </div>
    </div>
  );
};

export default Home;

/*
"use client";
import React, { useState } from "react";
import styles from "@/app/page.module.css";
import Countdown3D from "@/components/MessageDots";

const DEFAULT_MESSAGES = ["Anh yêu em", "Anh nhớ em nhiều lắm", "Anh yêu em rất nhiều"];

const Home: React.FC = () => {
  const [messages, setMessages] = useState<string[]>(["", "", ""]);
  const [started, setStarted] = useState(false);
  const [autoStart, setAutoStart] = useState(false);

  React.useEffect(() => {
    // Nếu đã có đủ 3 message mặc định thì tự động bắt đầu
    if (!started && autoStart && messages.every((m) => m && m.trim() !== "")) {
      setStarted(true);
    }
  }, [autoStart, started, messages]);

  const handleChange = (idx: number, value: string) => {
    setMessages((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    setStarted(true);
  };

  const handleDefault = () => {
    setMessages(DEFAULT_MESSAGES);
    setAutoStart(true);
  };

  return (
    <div className={styles.container}>
      {!started ? (
        <>
          <button
            type="button"
            onClick={handleDefault}
            style={{
              marginBottom: 12,
              padding: "10px 32px",
              fontSize: 18,
              background: "#4a90e2",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Bắt đầu với message mặc định
          </button>
          <div
            style={{
              background: "#f7f7f7",
              border: "1px solid #ddd",
              borderRadius: 6,
              padding: 16,
              marginBottom: 24,
              width: 340,
              color: "#333",
            }}
          >
            <div>
              <b>Message mặc định:</b>
            </div>
            <ol style={{ margin: 0, paddingLeft: 20 }}>
              {DEFAULT_MESSAGES.map((msg, idx) => (
                <li key={idx}>{msg}</li>
              ))}
            </ol>
          </div>
          <form
            onSubmit={handleStart}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              alignItems: "center",
              marginTop: 0,
            }}
          >
            <h2>Nhập 3 thông điệp</h2>
            <input
              type="text"
              placeholder="Message 1"
              value={messages[0]}
              onChange={(e) => handleChange(0, e.target.value)}
              required
              style={{ padding: 8, width: 300, fontSize: 16 }}
            />
            <input
              type="text"
              placeholder="Message 2"
              value={messages[1]}
              onChange={(e) => handleChange(1, e.target.value)}
              required
              style={{ padding: 8, width: 300, fontSize: 16 }}
            />
            <input
              type="text"
              placeholder="Message 3"
              value={messages[2]}
              onChange={(e) => handleChange(2, e.target.value)}
              required
              style={{ padding: 8, width: 300, fontSize: 16 }}
            />
            <button
              type="submit"
              style={{
                padding: "10px 32px",
                fontSize: 18,
                background: "#4a90e2",
                color: "white",
                border: "none",
                borderRadius: 4,
                cursor: "pointer",
              }}
            >
              OK
            </button>
          </form>
        </>
      ) : (
        <Countdown3D messages={messages} />
      )}
    </div>
  );
};

export default Home;

*/
