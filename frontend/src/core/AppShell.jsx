import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { registry } from "../core/Registry";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../core/Registry";

export default function AppShell() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Attach toast handler globally
  useEffect(() => {
    registry.setToastHandler((msg, type) => {
      switch (type) {
        case "success":
          toast.success(msg);
          break;
        case "error":
          toast.error(msg);
          break;
        case "info":
          toast.info(msg);
          break;
        default:
          toast(msg);
      }
    });
  }, []);

  // Toggle theme and persist choice
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  // Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    registry.notify("Logged out successfully!", "info");
    navigate("/login");
  };

  // Theme styles
  const styles = {
    dark: {
      background: "#111",
      color: "white",
      headerBg: "#222",
      linkColor: "limegreen",
      footerBg: "#222",
    },
    light: {
      background: "#f9f9f9",
      color: "#222",
      headerBg: "#eaeaea",
      linkColor: "#007acc",
      footerBg: "#eaeaea",
    },
  };

  const themeStyles = styles[theme];

  return (
    <div style={{ background: themeStyles.background, minHeight: "100vh", color: themeStyles.color }}>
      {/* Header */}
      <header
        style={{
          background: themeStyles.headerBg,
          padding: "1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 1000,
        }}
      >
        <nav>
          <Link to="/" style={{ color: themeStyles.linkColor, marginRight: "1rem" }}>
            Home
          </Link>
          <Link to="/dashboard" style={{ color: themeStyles.linkColor, marginRight: "1rem" }}>
            Dashboard
          </Link>
          <Link to="/admin" style={{ color: themeStyles.linkColor }}>
            Admin
          </Link>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem", position: "relative" }}>
          {user ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: themeStyles.color,
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                {user.email} ▼
              </button>
              {dropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "2rem",
                    background: themeStyles.headerBg,
                    border: `1px solid ${themeStyles.linkColor}`,
                    borderRadius: "6px",
                    padding: "0.5rem",
                    minWidth: "160px",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
                  }}
                >
                  <Link
                    to="/profile"
                    style={{
                      display: "block",
                      color: themeStyles.linkColor,
                      marginBottom: "0.5rem",
                      textDecoration: "none",
                    }}
                    onClick={() => setDropdownOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    style={{
                      display: "block",
                      color: themeStyles.linkColor,
                      marginBottom: "0.5rem",
                      textDecoration: "none",
                    }}
                    onClick={() => setDropdownOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: themeStyles.linkColor,
                      cursor: "pointer",
                      textAlign: "left",
                      width: "100%",
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <span>Not logged in</span>
          )}

          <button
            onClick={toggleTheme}
            style={{
              background: themeStyles.linkColor,
              color: "white",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            {theme === "dark" ? "☀ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main style={{ padding: "2rem" }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer
        style={{
          background: themeStyles.footerBg,
          padding: "1rem",
          textAlign: "center",
          marginTop: "auto",
        }}
      >
        <p style={{ color: theme === "dark" ? "gray" : "#555" }}>
          © {new Date().getFullYear()} GETEDIL‑OS — Empowering Governance Through AI
        </p>
      </footer>

      {/* Toast notifications */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </div>
  );
}
