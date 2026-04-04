// ============================================
// frontend/src/hooks/useAuth.jsx
// ============================================
// Auth Context + Provider + Hook with role enforcement
// Integrates Supabase profiles table and Registry.js permissions

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ROLE_LEVELS } from '@/core/Registry';

const AuthContext = createContext(null);

function useProvideAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('public');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        fetchUserRole(currentUser.id);
      } else {
        setRole('public');
      }
    });

    // Initial session check
    supabase.auth.getSession().then(({ data }) => {
      const currentUser = data?.session?.user ?? null;
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        fetchUserRole(currentUser.id);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // 🔹 Fetch role from profiles table
  const fetchUserRole = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (!error && data?.role) {
      setRole(data.role);
    } else {
      setRole('user'); // default fallback
    }
  };

  // 🔹 Auth actions
  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setRole('public');
  };

  return { user, role, roleLevel: ROLE_LEVELS[role] ?? 0, loading, signIn, signUp, signOut };
}

export function AuthProvider({ children }) {
  const auth = useProvideAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};
