import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * ProtectedRoute wraps children and enforces authentication + role checks.
 *
 * @param {ReactNode} children - The component(s) to render if allowed
 * @param {string} requiredRole - Optional role string ("user", "admin", etc.)
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth();

  // If no user is logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If a role is required and the user doesn't match, redirect
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/not-authorized" replace />;
  }

  // Otherwise, render the protected children
  return children;
}
