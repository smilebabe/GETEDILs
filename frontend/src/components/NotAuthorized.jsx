import React from "react";
import { Link } from "react-router-dom";

export default function NotAuthorized() {
  return (
    <div
      style={{
        color: "white",
        background: "#222",
        padding: "2rem",
        borderRadius: "8px",
        textAlign: "center",
        maxWidth: "600px",
        margin: "2rem auto"
      }}
    >
      <h2>🚫 Access Denied</h2>
      <p>You do not have permission to view this page.</p>
      <Link
        to="/dashboard"
        style={{
          display: "inline-block",
          marginTop: "1rem",
          background: "#007acc",
          color: "white",
          padding: "0.75rem 1.5rem",
          borderRadius: "6px",
          textDecoration: "none"
        }}
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
