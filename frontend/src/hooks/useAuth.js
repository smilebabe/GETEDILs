// frontend/src/hooks/useAuth.js
import { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const auth = useProvideAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

function useProvideAuth() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setUser(session?.user ?? null);
        if (session?.user) await fetchRole(session.user.id);
      } catch (err) {
        console.error('Auth error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchRole(session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch role from Supabase (stored in profiles table)
  const fetchRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      if (error) throw error;
      setRole(data?.role ?? 'user');
    } catch (err) {
      console.error('Role fetch error:', err.message);
      setRole('user');
    }
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  };

  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    setUser(data.session?.user ?? null);
    if (data.session?.user) await fetchRole(data.session.user.id);
  };

  return useMemo(() => ({
    user,
    role,
    loading,
    isAuthenticated: !!user,
    isAdmin: role === 'admin',
    isCreator: role === 'creator',
    signIn,
    signOut,
    refreshSession
  }), [user, role, loading]);
}
