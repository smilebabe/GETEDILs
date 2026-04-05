import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase, registry } from "./Registry";
import { usePrefetch } from "./usePrefetch";

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

// Example pages
function Dashboard({ user }) {
  const { pillars, lessons, states, loading, error } = usePrefetch(user.id, user.role);

  if (loading) return <div style={{ color: "white" }}>Loading data...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error.message}</div>;

  return (
    <div style={{ color: "white", padding: "1rem" }}>
      <h2>Dashboard</h2>
      <h3>Pillars</h3>
      <ul>{pillars.map((p) => <li key={p.id}>{p.name}</li>)}</ul>

      <h3>Lessons</h3>
      <ul>{lessons.map((l) => <li key={l.id}>{l.subject}: {l.question}</li>)}</ul>

      <h3>States</h3>
      <ul>{states.map((s) => <li key={s.id}>{s.state}</li>)}</ul>
    </div>
  );
}

function AdminPanel({ user }) {
  const { lessons, addLesson } = usePrefetch(user.id, user.role);

  async function handleAddLesson() {
    await addLesson("science", 0, "What is H2O?", "Water");
  }

  return (
    <div style={{ color: "white", padding: "1rem" }}>
      <h2>Admin Panel</h2>
      <button onClick={handleAddLesson}>Add Lesson</button>
      <ul>{lessons.map((l) => <li key={l.id}>{l.subject}: {l.question}</li>)}</ul>
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ color: "white", padding: "1rem" }}>
      <h2>404 - Page Not Found</h2>
    </div>
  );
}

// Protected route wrapper
function ProtectedRoute({ user, requiredRole, children }) {
  if (!user) return <Navigate to="/dashboard" replace />;
  if (user.role !== requiredRole) return <Navigate to="/dashboard" replace />;
  return children;
}

/**
 * AgenticRouter
 * Dynamically routes based on Supabase Auth session and role.
 * Includes layout wrapper with NavBar and Toast notifications.
 */
export default function AgenticRouter() {
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

  // Connection status check
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { error } = await supabase.from("governance_pillars").select("id").limit(1);
        setOnline(!error);
      } catch {
        setOnline(false);
      }
    }, 5000);

    return () => clearInterval(interval);
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
      {user ? (
        <>
          <NavBar user={user} onLogout={handleLogout} online={online} />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/dashboard" element={<Dashboard user={user} />} />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute user={user} requiredRole="admin">
                    <AdminPanel user={user} />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </>
      ) : (
        <div style={{ color: "white", padding: "1rem" }}>
          <h2>Please log in</h2>
        </div>
      )}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: "", type: toast.type })}
      />
    </div>
  );
}
