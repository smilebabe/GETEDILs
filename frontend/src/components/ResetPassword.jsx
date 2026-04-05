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
          <div style={{ marginBottom: "0.5rem" }}>
Perfect — let’s add **real‑time password validation hints** to both signup and reset flows. These hints show users exactly what requirements are missing (length, uppercase, number, special character) while typing, alongside the strength bar and show/hide toggle.

---

## 📂 Updated `frontend/src/components/AuthForm.jsx`

```jsx
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

export default function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const strength = getPasswordStrength(password);
  const hints = getValidationHints(password);

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } },
    });
    if (error) registry.notify("Signup failed: " + error.message, "error");
    else registry.notify("Signup successful! Please check your email to confirm.", "success");
    setLoading(false);
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) registry.notify("Login failed: " + error.message, "error");
    else registry.notify("Login successful!", "success");
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    registry.notify("Logged out successfully", "success");
  }

  async function handlePasswordReset(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset",
    });
    if (error) registry.notify("Password reset failed: " + error.message, "error");
    else registry.notify("Password reset email sent! Check your inbox.", "success");
    setLoading(false);
  }

  return (
    <div style={{ color: "white", padding: "1rem" }}>
      <h2>Authentication</h2>
      <form>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: "block", marginBottom: "0.5rem" }}
        />

        <div style={{ marginBottom: "0.5rem" }}>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

        {password && (
          <div style={{ marginBottom: "0.5rem" }}>
            {/* Strength bar */}
            <div
              style={{
                width: "100%",
                height: "8px",
                background: "#444",
                borderRadius: "4px",
                overflow: "hidden",
                marginBottom: "0.25rem",
              }}
            >
              <div
                style={{
                  width: strength.width,
                  height: "100%",
                  background: strength.color,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <span style={{ color: strength.color }}>Strength: {strength.label}</span>

            {/* Validation hints */}
            <ul style={{ marginTop: "0.5rem", textAlign: "left" }}>
              {hints.map((hint, idx) => (
                <li
                  key={idx}
                  style={{
                    color: hint.valid ? "limegreen" : "crimson",
                    fontSize: "0.9rem",
                  }}
                >
                  {hint.valid ? "✔" : "✖"} {hint.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{ display: "block", marginBottom: "0.5rem" }}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>

        <button onClick={handleSignup} disabled={loading}>Sign Up</button>
        <button onClick={handleLogin} disabled={loading} style={{ marginLeft: "0.5rem" }}>Log In</button>
        <button onClick={handleLogout} style={{ marginLeft: "0.5rem" }}>Log Out</button>
      </form>

      <div style={{ marginTop: "1rem" }}>
        <a href="#" onClick={handlePasswordReset} style={{ color: "lightblue", textDecoration: "underline" }}>
          Forgot Password?
        </a>
      </div>
    </div>
  );
}
