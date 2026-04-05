import React, { useEffect, useState } from "react";
import { supabase, registry } from "./Registry"; // centralized client + registry
import AppRouter from "./Router";
import AuthForm from "../components/AuthForm";

/**
 * Toast Notification Component
 */
function Toast({ message, type, onClose }) {
  if (!message) return null;
  return (
    <div
      style={{
        position: "fixed",
        bottom: "1rem",
        right: "1rem",
        background: type === "error" ? "crimson" : "limegreen",
        color: "white",
        padding: "0.75rem 1rem",
        borderRadius: "6px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        zIndex: 1000,
      }}
    >
      {message}
      <button
        onClick={onClose}
        style={{
          marginLeft: "1rem",
          background: "transparent",
          border: "none",
          color: "white",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        ×
      </button>
    </div>
  );
}

/**
 * Top Navigation Bar
 * Shows links, role indicator, logout button, and real-time connection status
 */
function NavBar({ user, onLogout, online }) {
  return (
    <nav
      style={{
        background: "#222",
        color: "white",
        padding: "0.75rem 1rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", gap: "1rem" }}>
        <a href="/dashboard" style={{ color: "white", textDecoration: "none" }}>
          Dashboard
        </a>
        {user?.role === "admin" && (
          <a href="/admin" style={{ color: "white", textDecoration: "none" }}>
            Admin
          </a>
        )}
      </div>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <span>Role: {user?.role}</span>
        <span
          style={{
            color: online ? "limegreen" : "orange",
            fontWeight: "bold",
          }}
        >
          {online ? "Online" : "Offline"}
        </span>
        <button
          onClick={onLogout}
          style={{
            background: "crimson",
            color: "white",
            border: "none",
            padding: "0.5rem 1rem",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

/**
 * AppShell
 * Provides the main application shell:
 * - Handles Supabase Auth session
 * - Displays AuthForm when not logged in
 * - Wraps AppRouter when logged in
 * - Provides consistent layout and navigation
 * - Shows real-time connection status
 * - Toast notifications for user feedback
 */
export default function AppShell() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "success" });

  // Attach toast handler to registry
  useEffect(() => {
    registry.setToastHandler((message, type) => {
      setToast({ message, type });
      setTimeout(() => setToast({ message: "", type }), 4000);
    });
  }, []);

  // Load Supabase Auth session
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const role =
          session.user.app_metadata?.role ||
          session.user.user_metadata?.role ||
          "user";
        setUser({ id: session.user.id, role });
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const role =
          session.user.app_metadata?.role ||
          session.user.user_metadata?.role ||
          "user";
        setUser({ id: session.user.id, role });
      } else {
        setUser(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Real-time connection status
  useEffect(() => {
    const channel = supabase.channel("connection-status");

    channel
      .on("broadcast", { event: "ping" }, () => {
        setOnline(true);
      })
      .subscribe();

    // Periodic ping to check connection
    const interval = setInterval(async () => {
      try {
        const { error } = await supabase.from("governance_pillars").select("id").limit(1);
        setOnline(!error);
      } catch {
        setOnline(false);
      }
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    registry.notify("Logged out successfully", "success");
  }

  if (loading) {
    return (
      <div style={{ background: "black", color: "white", minHeight: "100vh" }}>
        <p>Loading session...</p>
      </div>
    );
  }

  return (
    <div style={{ background: "black", minHeight: "100vh" }}>
      {!user ? (
        <AuthForm />
      ) : (
        <>
          <NavBar user={user} onLogout={handleLogout} online={online} />
          <AppRouter user={user} />
        </>
      )}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: toast.type })}
      />
    </div>
  );
}
