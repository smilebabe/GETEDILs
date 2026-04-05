import React, { useState } from "react";

export default function Settings() {
  const [theme, setTheme] = useState("dark");

  return (
    <div
      style={{
        color: "white",
        background: "#222",
        padding: "2rem",
        borderRadius: "8px",
        maxWidth: "600px",
        margin: "2rem auto"
      }}
    >
      <h2>⚙ Settings</h2>
      <p>Adjust your preferences below:</p>

      <div style={{ marginTop: "1rem" }}>
        <label style={{ marginRight: "1rem" }}>Theme:</label>
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          style={{ padding: "0.5rem", borderRadius: "4px" }}
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>

      <p style={{ marginTop: "1rem" }}>
        Current theme: <strong>{theme}</strong>
      </p>
    </div>
  );
}
