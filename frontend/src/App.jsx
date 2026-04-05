import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";

// Global layout
import AppShell from "./components/core/AppShell";

// Core components
import AuthForm from "./components/AuthForm";
import ResetPassword from "./components/ResetPassword";
import ResetSuccess from "./components/ResetSuccess";
import AdminPanel from "./components/AdminPanel";
import ProtectedRoute from "./routes/ProtectedRoute";
import NotAuthorized from "./components/NotAuthorized";

// User pages
import Profile from "./components/Profile";
import Settings from "./components/Settings";
import Dashboard from "./components/Dashboard";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Wrap all routes with AppShell for global layout */}
          <Route element={<AppShell />}>
            {/* Auth routes */}
            <Route path="/" element={<AuthForm />} />
            <Route path="/login" element={<AuthForm />} />
            <Route path="/signup" element={<AuthForm />} />
            <Route path="/reset" element={<ResetPassword />} />
            <Route path="/reset-success" element={<ResetSuccess />} />

            {/* Dashboard (open to all logged-in users) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute requiredRole="user">
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin panel (restricted to admins) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPanel />
                </ProtectedRoute>
              }
            />

            {/* User profile */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute requiredRole="user">
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Settings page */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute requiredRole="user">
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Not Authorized */}
            <Route path="/not-authorized" element={<NotAuthorized />} />

            {/* Fallback */}
            <Route
              path="*"
              element={<p style={{ color: "white" }}>404 - Page Not Found</p>}
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
