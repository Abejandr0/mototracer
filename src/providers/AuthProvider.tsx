import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from '../services/supabase';

type AuthContextValue = {
  configured: boolean;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  acceptLegal: () => Promise<void>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(supabaseConfigured);
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase.auth.getSession().then(({ data }) => { if (alive) { setSession(data.session); setLoading(false); } });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    const appSubscription = AppState.addEventListener('change', (state) => { if (state === 'active') void supabase?.auth.startAutoRefresh(); else void supabase?.auth.stopAutoRefresh(); });
    return () => { alive = false; subscription.unsubscribe(); appSubscription.remove(); };
  }, []);
  const value = useMemo<AuthContextValue>(() => ({
    configured: supabaseConfigured,
    session,
    loading,
    signIn: async (email, password) => {
      if (!supabase) throw new Error('Falta configurar Supabase.');
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    },
    signUp: async (email, password, name) => {
      if (!supabase) throw new Error('Falta configurar Supabase.');
      const { error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: name.trim(), legal_accepted_at: new Date().toISOString(), legal_version: '2026-11-10' } } });
      if (error) throw error;
    },
    acceptLegal: async () => { if (!supabase) throw new Error('Falta configurar Supabase.'); const { error } = await supabase.auth.updateUser({ data: { legal_accepted_at: new Date().toISOString(), legal_version: '2026-11-10' } }); if (error) throw error; },
    signOut: async () => { if (!supabase) return; const { error } = await supabase.auth.signOut(); if (error) throw error; },
  }), [session, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
