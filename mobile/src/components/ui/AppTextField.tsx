import { type ReactNode, forwardRef, useState } from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  TextStyle,
  ViewStyle,
} from 'react-native';

import { useAppTheme } from '@/theme/useAppTheme';

import { AppText } from '@/components/ui/AppText';

type AppTextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  rightAccessory?: ReactNode;
  labelStyle?: StyleProp<TextStyle>;
  labelTextTransform?: 'uppercase' | 'none';
  labelLetterSpacing?: number;
};

export const AppTextField = forwardRef<TextInput, AppTextFieldProps>(function AppTextField(
  {
    label,
    error,
    helperText,
    required = false,
    containerStyle,
    style,
    inputStyle,
    rightAccessory,
    labelStyle,
    labelTextTransform = 'uppercase',
    labelLetterSpacing = 0.35,
    ...props
  },
  ref
) {
  const theme = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);
  const isMultiline = Boolean(props.multiline);
  const labelColor = isFocused ? theme.colors.primary : theme.colors.heading;
  const shellRadius = isMultiline ? theme.radius.md : theme.radius.pill;
  const borderColor = error
    ? `${theme.colors.danger}70`
    : isFocused
      ? `${theme.colors.primary}52`
      : theme.isDark
        ? 'rgba(255,255,255,0.12)'
        : 'rgba(255,255,255,0.22)';
  const surfaceColor = theme.isDark ? 'rgba(12,27,47,0.38)' : 'rgba(255,255,255,0.16)';
  const shadowColor = error
    ? `${theme.colors.danger}18`
    : isFocused
      ? theme.colors.shadowStrong
      : theme.colors.shadow;
  const placeholderColor = theme.isDark
    ? 'rgba(207,223,241,0.72)'
    : 'rgba(56,83,117,0.64)';
  const textColor = theme.isDark ? '#F3F8FF' : '#163257';

  return (
    <View style={[styles.container, containerStyle]}>
      <AppText
        variant="caption"
        style={[
          styles.label,
          {
            color: labelColor,
            letterSpacing: labelLetterSpacing,
            textTransform: labelTextTransform,
          },
          labelStyle,
        ]}
      >
        {required ? `${label} *` : label}
      </AppText>
      <View
        style={[
          styles.shell,
          {
            backgroundColor: surfaceColor,
            borderColor,
            borderRadius: shellRadius,
            shadowColor,
          },
        ]}
      >
        <View
          pointerEvents="none"
          style={[
            styles.topEdge,
            {
              backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.42)',
            },
          ]}
        />
        <View style={[styles.inputRow, isMultiline ? styles.multilineRow : null]}>
          <TextInput
            ref={ref}
            {...props}
            placeholderTextColor={placeholderColor}
            selectionColor={theme.colors.primary}
            keyboardAppearance={theme.isDark ? 'dark' : 'light'}
            onBlur={(event) => {
              setIsFocused(false);
              props.onBlur?.(event);
            }}
            onFocus={(event) => {
              setIsFocused(true);
              props.onFocus?.(event);
            }}
            style={[
              styles.input,
              Platform.OS === 'web' ? styles.webInput : null,
              isMultiline ? styles.multilineInput : null,
              {
                color: textColor,
              },
              inputStyle,
              style,
            ]}
          />
          {rightAccessory ? (
            <View style={styles.accessory}>
              {rightAccessory}
            </View>
          ) : null}
        </View>
      </View>
      {error ? (
        <AppText variant="caption" style={[styles.message, { color: theme.colors.danger }]}>
          {error}
        </AppText>
      ) : helperText ? (
        <AppText variant="caption" style={styles.message}>
          {helperText}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    minWidth: 0,
    width: '100%',
  },
  label: {
    fontWeight: '700',
    marginBottom: 10,
  },
  message: {
    marginTop: 6,
  },
  shell: {
    borderWidth: 1,
    minHeight: 50,
    overflow: 'hidden',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    width: '100%',
  },
  inputRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 50,
    minWidth: 0,
    paddingHorizontal: 1,
    width: '100%',
  },
  multilineRow: {
    alignItems: 'stretch',
    minHeight: 112,
  },
  input: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    minWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  multilineInput: {
    minHeight: 112,
    paddingBottom: 14,
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  webInput: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    outlineColor: 'transparent',
    outlineWidth: 0,
  } as TextStyle,
  accessory: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    paddingLeft: 4,
    paddingRight: 12,
  },
  topEdge: {
    borderRadius: 999,
    height: 1,
    left: 16,
    opacity: 0.4,
    position: 'absolute',
    right: 16,
    top: 0.5,
  },
});
