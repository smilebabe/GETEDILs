import React, { useState } from "react";
import { supabase, registry } from "../hooks/Registry";

function getPasswordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { label: "Weak", color: "crimson", width: "33%" };
  if (score === 2) return { label: "Medium", color: "orange", width: "66%" };
  if (score >= 3) return { label: "Strong", color: "limegreen", width: "100%" };
}

function getValidationHints(password) {
  return [
    { text: "At least 8 characters", valid: password.length >= 8 },
    { text: "One uppercase letter", valid: /[A-Z]/.test(password) },
    { text: "One number", valid: /[0-9]/.test(password) },
    { text: "One special character", valid: /[^A-Za-z0-9]/.test(password) },
  ];
}

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const strength = getPasswordStrength(newPassword);
  const hints = getValidationHints(newPassword);

  async function handleReset(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) registry.notify("Password reset failed: " + error.message, "error");
    else {
      registry.notify("Password updated successfully! You can now log in.", "success");
      window.location.href = "/reset-success";
    }
    setLoading(false);
  }

  return (
    <div style={{ color: "white", padding: "1rem" }}>
      <h2>Reset Your Password</h2>
      <form>
        <div style={{ marginBottom: "0.5rem" }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ display: "inline-block", marginRight: "0.5rem" }}
          />
          <label style={{ cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
              style={{ marginRight: "0.25rem" }}
            />
            Show Password
          </label>
        </div>

       {newPassword && (
  <div style={{ marginTop: "1rem" }}>
    <p>New password set successfully!</p>
  </div>
)}

