import React from 'react';
import { StyleSheet, Text as NativeText, TextInput as NativeTextInput } from 'react-native';
import type { TextProps, TextInputProps } from 'react-native';
import { usePreferences } from '../providers/PreferencesProvider';

function translateChildren(children: React.ReactNode, t: (value: string) => string): React.ReactNode {
  if (typeof children === 'string') return t(children);
  if (Array.isArray(children)) return children.map((child, index) => <React.Fragment key={index}>{translateChildren(child, t)}</React.Fragment>);
  return children;
}
export const Text = React.forwardRef<React.ElementRef<typeof NativeText>, TextProps>(function LocalizedText({ children, style, maxFontSizeMultiplier, ...props }, ref) {
  const { t, largeText } = usePreferences();
  const flatStyle = StyleSheet.flatten(style) ?? {};
  const scaledStyle = largeText ? { ...flatStyle, ...(flatStyle.fontSize ? { fontSize: flatStyle.fontSize * 1.2 } : {}), ...(flatStyle.lineHeight ? { lineHeight: flatStyle.lineHeight * 1.2 } : {}) } : style;
  return <NativeText ref={ref} {...props} style={scaledStyle} maxFontSizeMultiplier={maxFontSizeMultiplier ?? (largeText ? 2 : 1.5)}>{translateChildren(children, t)}</NativeText>;
});
export const TextInput = React.forwardRef<React.ElementRef<typeof NativeTextInput>, TextInputProps>(function LocalizedTextInput({ placeholder, accessibilityLabel, ...props }, ref) {
  const { t, largeText } = usePreferences();
  const flatStyle = StyleSheet.flatten(props.style) ?? {};
  const scaledStyle = largeText ? { ...flatStyle, ...(flatStyle.fontSize ? { fontSize: flatStyle.fontSize * 1.2 } : {}) } : props.style;
  return <NativeTextInput ref={ref} {...props} style={scaledStyle} placeholder={placeholder ? t(placeholder) : undefined} accessibilityLabel={accessibilityLabel ? t(accessibilityLabel) : undefined} />;
});
