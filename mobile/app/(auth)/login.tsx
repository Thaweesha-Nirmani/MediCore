import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { AppTextField } from '@/components/ui/AppTextField';
import { ThemePreferenceControl } from '@/components/ui/ThemePreferenceControl';
import { AppBrand } from '@/components/layout/AppBrand';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useAppTheme } from '@/theme/useAppTheme';

const signinBackgroundImage = require('../../assets/images/Signin_BG.png');

export default function LoginRoute() {
  const theme = useAppTheme();
  const responsive = useResponsiveLayout();
  const { height: viewportHeight } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [activeField, setActiveField] = useState<'email' | 'password' | null>(null);
  const loginMutation = useLogin();

  const trimmedEmail = email.trim().toLowerCase();
  const hasValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const emailError =
    showValidation && !trimmedEmail
      ? 'Enter your staff email.'
      : showValidation && trimmedEmail && !hasValidEmail
        ? 'Enter a valid email address.'
        : undefined;
  const passwordError = showValidation && !password.trim() ? 'Enter your password.' : undefined;
  const submitError = loginMutation.error
    ? (loginMutation.error as any)?.message || 'Unable to sign in. Please try again.'
    : '';
  const canSubmit =
    Boolean(trimmedEmail && hasValidEmail && password.trim()) && !loginMutation.isPending;
  const keyboardVisible = keyboardHeight > 0;
  const backgroundOverlayColor = theme.isDark
    ? 'rgba(10,18,30,0.26)'
    : 'rgba(246,251,255,0.18)';
  const loginTopOffset = keyboardVisible
    ? responsive.isMdUp
      ? 44
      : 18
    : responsive.isLgUp
      ? 42
      : responsive.isMdUp
        ? 32
        : 24;
  const loginBottomOffset = keyboardVisible
    ? Math.max(keyboardHeight + 24, 56)
    : responsive.isLgUp
      ? 40
      : responsive.isMdUp
        ? 32
        : 24;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      const scrollTarget =
        activeField === 'password' ? 208 : activeField === 'email' ? 108 : undefined;

      if (scrollTarget !== undefined) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: scrollTarget, animated: true });
        }, Platform.OS === 'android' ? 90 : 40);
      }
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [activeField]);

  async function handleSubmit() {
    setShowValidation(true);

    if (!trimmedEmail || !hasValidEmail || !password.trim()) {
      return;
    }

    await loginMutation.mutateAsync({
      email: trimmedEmail,
      password,
    });
  }

  function clearMutationError() {
    if (loginMutation.error) {
      loginMutation.reset();
    }
  }

  const screenContent = (
    <>
      <ScrollView
        ref={scrollViewRef}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        contentContainerStyle={[
          styles.scrollContent,
          {
            minHeight: viewportHeight,
            paddingHorizontal: responsive.horizontalPadding,
            paddingTop: loginTopOffset,
            paddingBottom: loginBottomOffset,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.container, { justifyContent: keyboardVisible ? 'flex-start' : 'center' }]}>
          <AppCard
            variant="hero"
            style={[
              styles.formShell,
              {
                borderColor: theme.isDark ? 'rgba(223,236,255,0.14)' : 'rgba(255,255,255,0.4)',
                maxWidth: responsive.isLgUp ? 480 : 440,
                shadowColor: theme.colors.shadowStrong,
              },
            ]}
            contentStyle={styles.formCardContent}
          >
            <View
              pointerEvents="box-none"
              style={[
                styles.cardThemeToggle,
                {
                  right: responsive.isMdUp ? 20 : 16,
                  top: responsive.isMdUp ? 18 : 14,
                },
              ]}
            >
              <ThemePreferenceControl variant="compact" />
            </View>

            <View style={styles.hero}>
              <AppBrand variant="hero" />

              <View style={styles.heroCopy}>
                <AppText variant="title" style={styles.centeredText}>
                  Staff Login
                </AppText>
                <AppText
                  style={[
                    styles.subtitle,
                    {
                      color: theme.isDark ? 'rgba(233,241,252,0.86)' : 'rgba(36,72,111,0.84)',
                      maxWidth: responsive.isMdUp ? 328 : 280,
                    },
                  ]}
                >
                  Sign in to access your workspace.
                </AppText>
              </View>
            </View>

            {submitError ? (
              <View
                accessibilityRole="alert"
                style={[
                  styles.errorAlert,
                  {
                    backgroundColor: `${theme.colors.danger}10`,
                    borderColor: `${theme.colors.danger}34`,
                    borderRadius: theme.radius.md,
                  },
                ]}
              >
                <View
                  style={[
                    styles.errorIconShell,
                    {
                      backgroundColor: `${theme.colors.danger}12`,
                      borderColor: `${theme.colors.danger}20`,
                      borderRadius: theme.radius.pill,
                    },
                  ]}
                >
                  <Ionicons color={theme.colors.danger} name="alert-circle-outline" size={16} />
                </View>
                <View style={styles.errorCopy}>
                  <AppText variant="label" style={{ color: theme.colors.danger }}>
                    Sign-in failed
                  </AppText>
                  <AppText variant="caption" style={{ color: theme.colors.danger }}>
                    {submitError}
                  </AppText>
                </View>
              </View>
            ) : null}

            <View style={styles.formBlock}>
              <AppTextField
                accessibilityLabel="Email address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                label="Email address"
                labelTextTransform="none"
                labelLetterSpacing={0}
                required
                onChangeText={(value) => {
                  clearMutationError();
                  setEmail(value);
                }}
                onSubmitEditing={() => passwordRef.current?.focus()}
                onFocus={() => {
                  setActiveField('email');
                  if (!keyboardVisible) {
                    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                  }
                }}
                placeholder="name@example.com"
                returnKeyType="next"
                textContentType="emailAddress"
                value={email}
                error={emailError}
              />

              <AppTextField
                ref={passwordRef}
                accessibilityLabel="Password"
                autoComplete="current-password"
                label="Password"
                labelTextTransform="none"
                labelLetterSpacing={0}
                required
                onChangeText={(value) => {
                  clearMutationError();
                  setPassword(value);
                }}
                onFocus={() => {
                  setActiveField('password');
                  scrollViewRef.current?.scrollTo({ y: 120, animated: true });
                }}
                onSubmitEditing={() => {
                  void handleSubmit();
                }}
                placeholder="Enter password"
                returnKeyType="go"
                secureTextEntry={!showPassword}
                textContentType="password"
                value={password}
                error={passwordError}
                rightAccessory={
                  <Pressable
                    accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                    accessibilityRole="button"
                    hitSlop={10}
                    onPress={() => setShowPassword((current) => !current)}
                    style={({ pressed }) => [
                      styles.passwordToggle,
                      {
                        opacity: pressed ? 0.72 : 1,
                      },
                    ]}
                  >
                    <Ionicons
                      color={theme.colors.mutedText}
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                    />
                  </Pressable>
                }
              />
            </View>

            <AppButton
              label={loginMutation.isPending ? 'Signing in...' : 'Sign In'}
              loading={loginMutation.isPending}
              onPress={() => {
                void handleSubmit();
              }}
              disabled={!canSubmit}
            />
          </AppCard>
        </View>
      </ScrollView>
    </>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <ImageBackground
        source={signinBackgroundImage}
        resizeMode="cover"
        style={[
          styles.background,
          {
            backgroundColor: theme.isDark ? '#0E1B2C' : '#ECF6FE',
            minHeight: viewportHeight,
          },
        ]}
        imageStyle={styles.backgroundImage}
      >
        <View
          pointerEvents="none"
          style={[
            styles.backgroundOverlay,
            {
              backgroundColor: backgroundOverlayColor,
            },
          ]}
        />
        {screenContent}
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    width: '100%',
  },
  background: {
    flex: 1,
    overflow: 'hidden',
    width: '100%',
  },
  backgroundImage: {
    height: '100%',
    width: '100%',
  },
  backgroundOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-start',
    position: 'relative',
    width: '100%',
  },
  formShell: {
    alignSelf: 'center',
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    width: '100%',
  },
  formCardContent: {
    gap: 18,
    paddingBottom: 24,
    paddingHorizontal: 22,
    paddingTop: 30,
  },
  cardThemeToggle: {
    position: 'absolute',
    zIndex: 3,
  },
  hero: {
    alignItems: 'center',
    gap: 16,
  },
  heroCopy: {
    alignItems: 'center',
    gap: 8,
  },
  centeredText: {
    textAlign: 'center',
  },
  subtitle: {
    lineHeight: 24,
    textAlign: 'center',
  },
  errorAlert: {
    alignItems: 'flex-start',
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  errorIconShell: {
    alignItems: 'center',
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  errorCopy: {
    flex: 1,
    gap: 3,
  },
  formBlock: {
    gap: 14,
  },
  passwordToggle: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
});
