import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Colors, Radius, Spacing } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  style,
  textStyle,
  fullWidth,
}) => {
  const bgColor = {
    primary: Colors.primaryAction,
    secondary: Colors.card,
    danger: Colors.emergency,
    ghost: 'transparent',
  }[variant];

  const borderColor = {
    primary: Colors.primaryAction,
    secondary: Colors.border,
    danger: Colors.emergency,
    ghost: Colors.border,
  }[variant];

  const textColor = {
    primary: Colors.textPrimary,
    secondary: Colors.textSecondary,
    danger: Colors.textPrimary,
    ghost: Colors.textSecondary,
  }[variant];

  const height = { sm: 36, md: 48, lg: 56 }[size];
  const fontSize = { sm: 12, md: 14, lg: 16 }[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.base,
        {
          backgroundColor: bgColor,
          borderColor,
          height,
          opacity: disabled ? 0.5 : 1,
          width: fullWidth ? '100%' : undefined,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <Text
          style={[
            styles.text,
            { color: textColor, fontSize },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    gap: 8,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
