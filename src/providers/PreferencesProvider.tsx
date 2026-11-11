import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { setColorPalette } from '../theme/colors';

export type Language = 'es' | 'en';
export type ThemeChoice = 'system' | 'dark' | 'light';
type Preferences = { theme: ThemeChoice; language: Language; largeText: boolean; highContrast: boolean; reduceMotion: boolean };
const DEFAULT: Preferences = { theme: 'system', language: 'es', largeText: false, highContrast: false, reduceMotion: false };
const KEY = 'mototracer.preferences.v1';
const english: Record<string, string> = {
  Inicio: 'Home', Rutas: 'Routes', Garaje: 'Garage', Perfil: 'Profile',
  'Mi garaje': 'My garage', 'Mi perfil': 'My profile', Estadísticas: 'Statistics',
  'En ruta': 'Riding', 'Ajustes de la app': 'App settings', 'Rutas de otros bikers': 'Routes from other riders',
  'MOTOCICLETA ACTIVA': 'ACTIVE MOTORCYCLE', 'ODÓMETRO TOTAL': 'TOTAL ODOMETER',
  'ESTADO DE LA MOTO': 'MOTORCYCLE STATUS', 'ACTIVIDAD': 'ACTIVITY',
  'INICIAR RODADA': 'START RIDE', 'GRABAR UNA RUTA': 'RECORD A ROUTE',
  PAUSAR: 'PAUSE', CONTINUAR: 'RESUME', TERMINAR: 'FINISH',
  'TIEMPO': 'TIME', 'DISTANCIA': 'DISTANCE', 'MÁXIMO': 'MAX',
  'VELOCIDAD PROM.': 'AVG. SPEED', 'INCLINACIÓN MÁX.': 'MAX. LEAN', 'ACELERACIÓN': 'ACCELERATION',
  'CONTACTOS SOS': 'SOS CONTACTS', 'SEGURIDAD Y SENSORES': 'SAFETY AND SENSORS',
  'VERIFICAR TWILIO': 'CHECK TWILIO', 'CERRAR SESIÓN': 'SIGN OUT',
};
type PreferencesContextValue = Preferences & { ready: boolean; resolvedTheme: 'dark' | 'light'; update: (changes: Partial<Preferences>) => void; t: (text: string) => string };
const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: React.PropsWithChildren) {
  const systemTheme = useColorScheme();
  const [settings, setSettings] = useState<Preferences>(DEFAULT);
  const [ready, setReady] = useState(false);
  useEffect(() => { AsyncStorage.getItem(KEY).then((raw) => { if (raw) setSettings({ ...DEFAULT, ...JSON.parse(raw) }); }).catch(() => undefined).finally(() => setReady(true)); }, []);
  const resolvedTheme = settings.theme === 'system' ? systemTheme === 'light' ? 'light' : 'dark' : settings.theme;
  setColorPalette(resolvedTheme, settings.highContrast);
  useEffect(() => { if (ready) void AsyncStorage.setItem(KEY, JSON.stringify(settings)); }, [ready, settings]);
  const update = useCallback((changes: Partial<Preferences>) => setSettings((current) => ({ ...current, ...changes })), []);
  const value = useMemo<PreferencesContextValue>(() => ({ ...settings, ready, resolvedTheme, update, t: (text) => settings.language === 'en' ? english[text] ?? text : text }), [settings, ready, resolvedTheme, update]);
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}
export function usePreferences() { const value = useContext(PreferencesContext); if (!value) throw new Error('PreferencesProvider is required'); return value; }
