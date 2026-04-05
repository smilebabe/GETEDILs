import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { usePrefetch } from "./usePrefetch";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
);

// Dashboard for normal users
function Dashboard({ user }) {
  const { pillars, lessons, states, loading, error } = usePrefetch(user.id, "user");

  if (loading) return <div style={{ color: "white" }}>Loading data...</div>;
  if (error) return <div style={{ color: "red" }}>Error: {error.message}</div>;

  return (
    <div style={{ color: "white", padding: "1rem" }}>
      <h2>Active Pillars</h2>
      <ul>{pillars.map((p) => <li key={p.id}>{p.name}</li>)}</ul>

      <h2>Tutor Lessons</h2>
      <ul>{lessons.map((l) => <li key={l.id}>{l.subject}: {l.question}</li>)}</ul>

      <h2>Your Governance States</h2>
      <ul>{states.map((s) => <li key={s.id}>{s.state}</li>)}</ul>
    </div>
  );
}

// Admin panel (protected)
function AdminPanel({ user }) {
  const { lessons, addLesson } = usePrefetch(user.id, "admin");

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

// 404 fallback
function NotFound() {
  return (
    <div style={{ color: "white", padding: "1rem" }}>
      <h2>404 - Page Not Found</h2>
      <p>The page you’re looking for doesn’t exist.</p>
    </div>
  );
}

// Protected route wrapper
function ProtectedRoute({ user, requiredRole, children }) {
  if (!user) {
    return <Navigate to="/dashboard" replace />;
  }
  if (user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

/**
 * Router component
 * Wraps the app in BrowserRouter and defines routes.
 * Automatically pulls user session from Supabase Auth.
 */
export default function AppRouter() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load Supabase Auth session
  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        // Attach role from JWT or metadata
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

  if (loading) return <div style={{ color: "white" }}>Loading session...</div>;

  return (
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
  );
}
