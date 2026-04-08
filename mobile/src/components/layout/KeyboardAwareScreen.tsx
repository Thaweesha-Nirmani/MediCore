import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleProp,
  StyleSheet,
  TextInput,
  ViewStyle,
} from 'react-native';

import { AppScreen } from '@/components/layout/AppScreen';
import {
  type ResponsiveContentWidth,
} from '@/hooks/useResponsiveLayout';

type KeyboardAwareScreenProps = PropsWithChildren<{
  contentContainerStyle?: StyleProp<ViewStyle>;
  contentWidth?: ResponsiveContentWidth;
  style?: StyleProp<ViewStyle>;
  showsVerticalScrollIndicator?: boolean;
}>;

export function KeyboardAwareScreen({
  children,
  contentContainerStyle,
  contentWidth = 'page',
  style,
  showsVerticalScrollIndicator = false,
}: KeyboardAwareScreenProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardVisible = keyboardHeight > 0;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);

      setTimeout(() => {
        ensureFocusedInputVisible(scrollViewRef.current, 36);
      }, Platform.OS === 'android' ? 90 : 40);
    });

    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <AppScreen contentWidth={contentWidth} style={style}>
        <ScrollView
          ref={scrollViewRef}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentContainerStyle={[
            styles.scrollContent,
            contentContainerStyle,
            keyboardVisible ? { paddingBottom: keyboardHeight + 24 } : null,
          ]}
          keyboardShouldPersistTaps="handled"
          onTouchEndCapture={() => {
            if (!keyboardVisible) {
              return;
            }

            setTimeout(() => {
              ensureFocusedInputVisible(scrollViewRef.current, 24);
            }, 30);
          }}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        >
          {children}
        </ScrollView>
      </AppScreen>
    </KeyboardAvoidingView>
  );
}

function ensureFocusedInputVisible(scrollView: ScrollView | null, extraOffset: number) {
  // Android already gets acceptable behavior from the keyboard-avoiding container,
  // and this measurement-based helper can spam "Error measuring text field" warnings.
  if (Platform.OS !== 'ios') {
    return;
  }

  const focusedInput = (TextInput.State as { currentlyFocusedInput?: () => unknown })
    .currentlyFocusedInput?.();
  const responder = scrollView as ScrollView & {
    scrollResponderScrollNativeHandleToKeyboard?: (
      nodeHandle: unknown,
      additionalOffset?: number,
      preventNegativeScrollOffset?: boolean
    ) => void;
  };

  if (!focusedInput || typeof responder?.scrollResponderScrollNativeHandleToKeyboard !== 'function') {
    return;
  }

  responder.scrollResponderScrollNativeHandleToKeyboard(focusedInput, extraOffset, true);
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
