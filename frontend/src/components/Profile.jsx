import React from "react";
import { useAuth } from "../hooks/useAuth";

export default function Profile() {
  const { user } = useAuth();

  if (!user) {
    return <p style={{ color: "white" }}>You must be logged in to view your profile.</p>;
  }

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
      <h2>👤 Profile</h2>
      <p><strong>Email:</strong> {user.email}</p>
      {user.role && <p><strong>Role:</strong> {user.role}</p>}
      <p>Welcome back! This is your personal profile page.</p>
    </div>
  );
}
