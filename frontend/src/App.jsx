import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { registry } from "./core/Registry";

// Components
import AuthForm from "./components/AuthForm";
import ResetPassword from "./components/ResetPassword";
import ResetSuccess from "./components/ResetSuccess";
import AdminPanel from "./components/AdminPanel";
import ProtectedRoute from "./routes/ProtectedRoute";

// Toast library (example: react-toastify)
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  // Attach toast handler to registry
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

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Default route */}
          <Route path="/" element={<AuthForm />} />

          {/* Auth routes */}
          <Route path="/login" element={<AuthForm />} />
          <Route path="/signup" element={<AuthForm />} />
          <Route path="/reset" element={<ResetPassword />} />
          <Route path="/reset-success" element={<ResetSuccess />} />

          {/* Protected admin route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<p style={{ color: "white" }}>404 - Page Not Found</p>} />
        </Routes>
      </Router>

      {/* Toast notifications */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </AuthProvider>
  );
}
