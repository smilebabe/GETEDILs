import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { ROLE_LEVELS } from "../core/Registry";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("guest");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        const u = data.session.user;
        setUser(u);
        setRole(u.user_metadata?.role || "user");
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setRole(session.user.user_metadata?.role || "user");
      } else {
        setUser(null);
        setRole("guest");
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Role check helper
  const hasRole = (requiredRole) => {
    return ROLE_LEVELS[role] >= ROLE_LEVELS[requiredRole];
  };

  // Expose auth context
  return (
    <AuthContext.Provider value={{ user, role, hasRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
