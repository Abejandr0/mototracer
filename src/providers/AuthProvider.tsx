import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as Linking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from '../services/supabase';

type AuthContextValue = {
  configured: boolean;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  resendConfirmation: (email: string) => Promise<void>;
  verifyEmailCode: (email: string, code: string) => Promise<void>;
  acceptLegal: () => Promise<void>;
  signOut: () => Promise<void>;
  callbackError: string | null;
};
const AuthContext = createContext<AuthContextValue | null>(null);
const EMAIL_REDIRECT = 'mototracer://auth-callback';

export function AuthProvider({ children }: React.PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(supabaseConfigured);
  const [callbackError, setCallbackError] = useState<string | null>(null);
  const processedCallback = useRef<string | null>(null);
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    supabase.auth.getSession().then(({ data }) => { if (alive) { setSession(data.session); setLoading(false); } });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    const appSubscription = AppState.addEventListener('change', (state) => { if (state === 'active') void supabase?.auth.startAutoRefresh(); else void supabase?.auth.stopAutoRefresh(); });
    return () => { alive = false; subscription.unsubscribe(); appSubscription.remove(); };
  }, []);
  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    const handleUrl = async (url: string) => {
      if (!url.startsWith(EMAIL_REDIRECT)) return;
      if (processedCallback.current === url) return;
      processedCallback.current = url;
      const params = new URLSearchParams(url.split('#')[1] || url.split('?')[1] || '');
      const message = params.get('error_description') || params.get('error');
      if (message) { if (alive) setCallbackError(message); return; }
      const access_token = params.get('access_token'), refresh_token = params.get('refresh_token');
      if (!access_token || !refresh_token) { if (alive) setCallbackError('El enlace no incluyó una sesión. Prueba iniciar sesión después de confirmar el correo.'); return; }
      const { error } = await supabase!.auth.setSession({ access_token, refresh_token });
      if (alive) setCallbackError(error?.message ?? null);
    };
    void Linking.getInitialURL().then((url) => { if (url) void handleUrl(url); });
    const listener = Linking.addEventListener('url', ({ url }) => { void handleUrl(url); });
    return () => { alive = false; listener.remove(); };
  }, []);
  const value = useMemo<AuthContextValue>(() => ({
    configured: supabaseConfigured,
    session,
    loading,
    callbackError,
    signIn: async (email, password) => {
      if (!supabase) throw new Error('Falta configurar Supabase.');
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    },
    signUp: async (email, password, name) => {
      if (!supabase) throw new Error('Falta configurar Supabase.');
      const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: EMAIL_REDIRECT, data: { full_name: name.trim(), legal_accepted_at: new Date().toISOString(), legal_version: '2026-11-10' } } });
      if (error) throw error;
      return data.session === null;
    },
    resendConfirmation: async (email) => { if (!supabase) throw new Error('Falta configurar Supabase.'); const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: EMAIL_REDIRECT } }); if (error) throw error; },
    verifyEmailCode: async (email, code) => { if (!supabase) throw new Error('Falta configurar Supabase.'); const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' }); if (error) throw error; },
    acceptLegal: async () => { if (!supabase) throw new Error('Falta configurar Supabase.'); const { error } = await supabase.auth.updateUser({ data: { legal_accepted_at: new Date().toISOString(), legal_version: '2026-11-10' } }); if (error) throw error; },
    signOut: async () => { if (!supabase) return; const { error } = await supabase.auth.signOut(); if (error) throw error; },
  }), [session, loading, callbackError]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
