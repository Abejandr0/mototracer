import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { Colors } from '../theme';
import { usePreferences } from '../providers/PreferencesProvider';

export function HoldAction({ label, onComplete, color = Colors.primaryAction, duration = 2000 }: { label: string; onComplete: () => void; color?: string; duration?: number }) {
  const { t, language } = usePreferences();
  const [progress] = useState(() => new Animated.Value(0));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);
  const [holding, setHolding] = useState(false);
  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    progress.stopAnimation();
    progress.setValue(0);
    setHolding(false);
  };
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); progress.stopAnimation(); }, [progress]);
  return <Pressable
    accessibilityRole="button" accessibilityLabel={`${t(label)}. ${language === 'en' ? 'Hold for two seconds' : 'Mantener presionado dos segundos'}`}
    onPressIn={() => {
      fired.current = false;
      setHolding(true);
      progress.setValue(0);
      Animated.timing(progress, { toValue: 1, duration, useNativeDriver: false }).start();
      timer.current = setTimeout(() => { fired.current = true; stop(); onComplete(); }, duration);
    }}
    onPressOut={() => { if (!fired.current) stop(); }}
    style={{ flex: 1, minHeight: 50, backgroundColor: Colors.cardElevated, borderRadius: 12, borderColor: color, borderWidth: 1, overflow: 'hidden', justifyContent: 'center' }}>
    <Animated.View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), backgroundColor: color, opacity: .8 }} />
    <View style={{ paddingHorizontal: 5 }}><Text style={{ color: Colors.textPrimary, fontSize: 11, fontWeight: '900', textAlign: 'center' }}>{holding ? language === 'en' ? 'HOLD 2 S…' : 'MANTÉN 2 S…' : t(label)}</Text></View>
  </Pressable>;
}
