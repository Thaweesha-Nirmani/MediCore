import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useAppTheme } from '@/theme/useAppTheme';

import { AppText } from '@/components/ui/AppText';

type AppButtonProps = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'destructive' | 'ghost' | 'success';
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function AppButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  fullWidth = variant === 'primary' || variant === 'destructive' || variant === 'success',
  style,
}: AppButtonProps) {
  const theme = useAppTheme();
  const isDisabled = disabled || loading;
  const textColor =
    variant === 'primary' || variant === 'destructive' || variant === 'success'
      ? '#FFFFFF'
      : theme.colors.heading;
  const indicatorColor =
    variant === 'primary' || variant === 'destructive' || variant === 'success'
      ? '#FFFFFF'
      : theme.colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      android_ripple={
        variant === 'ghost'
          ? undefined
          : {
              borderless: false,
              color:
                variant === 'primary' || variant === 'destructive' || variant === 'success'
                  ? 'rgba(255,255,255,0.18)'
                  : theme.colors.primarySoft,
            }
      }
      style={({ pressed }) => [
        styles.button,
        fullWidth ? styles.fullWidth : styles.inlineButton,
        {
          opacity: isDisabled ? 0.62 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
        },
        style,
      ]}
    >
      {variant === 'primary' || variant === 'destructive' || variant === 'success' ? (
        <LinearGradient
          colors={
            variant === 'destructive'
              ? theme.gradients.destructive
              : variant === 'success'
                ? (['#4ADE80', '#22C55E', '#16A34A'] as const)
                : theme.gradients.button
          }
          style={[
            styles.buttonShell,
            fullWidth ? styles.fullWidth : styles.inlineButton,
            {
              borderColor: 'rgba(255,255,255,0.16)',
              borderRadius: theme.radius.md,
              shadowColor: theme.colors.shadowStrong,
            },
          ]}
        >
          <ButtonContent
            indicatorColor={indicatorColor}
            label={label}
            loading={loading}
            textColor={textColor}
          />
        </LinearGradient>
      ) : variant === 'secondary' ? (
        <View
          style={[
            styles.buttonShell,
            fullWidth ? styles.fullWidth : styles.inlineButton,
            {
              backgroundColor: theme.isDark ? 'rgba(24,40,63,0.56)' : 'rgba(255,255,255,0.24)',
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              shadowColor: theme.colors.shadow,
            },
          ]}
        >
          <ButtonContent
            indicatorColor={indicatorColor}
            label={label}
            loading={loading}
            textColor={textColor}
          />
        </View>
      ) : (
        <View
          style={[
            styles.buttonShell,
            styles.ghostShell,
            fullWidth ? styles.fullWidth : styles.inlineButton,
            {
              borderColor: theme.colors.borderSoft,
              borderRadius: theme.radius.md,
              shadowColor: theme.colors.shadow,
            },
          ]}
        >
          <ButtonContent
            indicatorColor={indicatorColor}
            label={label}
            loading={loading}
            textColor={textColor}
          />
        </View>
      )}
    </Pressable>
  );
}

function ButtonContent({
  label,
  loading,
  textColor,
  indicatorColor,
}: {
  label: string;
  loading: boolean;
  textColor: string;
  indicatorColor: string;
}) {
  return (
    <View style={styles.content}>
      {loading ? <ActivityIndicator size="small" color={indicatorColor} /> : null}
      <AppText
        variant="label"
        style={{ color: textColor, textAlign: 'center', flexShrink: 1 }}
      >
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    minWidth: 0,
  },
  fullWidth: {
    width: '100%',
  },
  inlineButton: {
    alignSelf: 'flex-start',
  },
  buttonShell: {
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 52,
    overflow: 'hidden',
    paddingHorizontal: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  ghostShell: {
    backgroundColor: 'transparent',
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    minWidth: 0,
    paddingVertical: 14,
  },
});
