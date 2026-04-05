import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import AppShell from "./components/AppShell";

// Components
import AuthForm from "./components/AuthForm";
import ResetPassword from "./components/ResetPassword";
import ResetSuccess from "./components/ResetSuccess";
import AdminPanel from "./components/AdminPanel";
import ProtectedRoute from "./routes/ProtectedRoute";
import NotAuthorized from "./components/NotAuthorized";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<AuthForm />} />
            <Route path="/login" element={<AuthForm />} />
            <Route path="/signup" element={<AuthForm />} />
            <Route path="/reset" element={<ResetPassword />} />
            <Route path="/reset-success" element={<ResetSuccess />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminPanel />
                </ProtectedRoute>
              }
            />

            <Route path="/not-authorized" element={<NotAuthorized />} />
            <Route path="*" element={<p style={{ color: "white" }}>404 - Page Not Found</p>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}
