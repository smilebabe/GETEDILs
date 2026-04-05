import React from "react";

export default function ResetSuccess() {
  return (
    <div style={{ color: "white", padding: "1rem" }}>
      <h2>Password Reset Successful ✅</h2>
      <p>You can now log in with your new password.</p>
      <a href="/login" style={{ color: "limegreen" }}>
        Go to Login
      </a>
    </div>
  );
}
