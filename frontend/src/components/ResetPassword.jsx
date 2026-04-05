import React, { useState } from "react";
import { supabase, registry } from "../core/Registry";

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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const strength = getPasswordStrength(newPassword);
  const hints = getValidationHints(newPassword);
  const passwordsMatch = newPassword === confirmPassword;

  async function handleReset(e) {
    e.preventDefault();
    if (!passwordsMatch) {
      registry.notify("Passwords do not match!", "error");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      registry.notify("Password reset failed: " + error.message, "error");
    } else {
      registry.notify("Password updated successfully! You can now log in.", "success");
      window.location.href = "/reset-success";
    }
    setLoading(false);
  }

  return (
    <div style={{ color: "white", padding: "1rem" }}>
      <h2>Reset Your Password</h2>
      <form onSubmit={handleReset}>
        {/* New password input */}
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

        {/* Confirm password input */}
        <div style={{ marginBottom: "0.5rem" }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {/* Password strength meter */}
        {newPassword && strength && (
          <div style={{ marginTop: "0.5rem" }}>
            <div
              style={{
                background: "#333",
                height: "8px",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: strength.width,
                  background: strength.color,
                  height: "100%",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <p style={{ color: strength.color, marginTop: "0.25rem" }}>
              Strength: {strength.label}
            </p>
          </div>
        )}

        {/* Validation hints */}
        {newPassword && (
          <ul style={{ marginTop: "0.5rem", paddingLeft: "1rem" }}>
            {hints.map((hint, idx) => (
              <li
                key={idx}
                style={{
                  color: hint.valid ? "limegreen" : "crimson",
                  fontSize: "0.9rem",
                }}
              >
                {hint.text}
              </li>
            ))}
          </ul>
        )}

        {/* Password match feedback */}
        {confirmPassword && !passwordsMatch && (
          <p style={{ color: "crimson", marginTop: "0.5rem" }}>
            Passwords do not match
          </p>
        )}
        {confirmPassword && passwordsMatch && (
          <p style={{ color: "limegreen", marginTop: "0.5rem" }}>
            Passwords match ✔
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !newPassword || !confirmPassword || !passwordsMatch}
          style={{
            background: "limegreen",
            color: "white",
            border: "none",
            padding: "0.5rem 1rem",
            borderRadius: "4px",
            cursor: "pointer",
            marginTop: "1rem",
          }}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
