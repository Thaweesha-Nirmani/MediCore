import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, Tabs, useSegments } from 'expo-router';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { appRoutes } from '@/constants/routes';
import { AuthSplashScreen } from '@/features/auth/components/AuthSplashScreen';
import { useAuthBootstrap } from '@/features/auth/hooks/useAuthBootstrap';
import {
  canAccessTab,
  getAccessibleTabs,
  getDefaultAppRoute,
  tabDefinitions,
} from '@/navigation/tabs';
import { useAppTheme } from '@/theme/useAppTheme';

export default function TabsLayout() {
  const theme = useAppTheme();
  const segments = useSegments();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { hasHydrated, isAuthenticated, session } = useAuthBootstrap();
  const accessibleTabs = getAccessibleTabs(session?.user?.role);
  const currentTab =
    segments.find((segment) => tabDefinitions.some((tab) => tab.name === segment)) || '';
  const horizontalInset = width >= 1280 ? 32 : width >= 768 ? 24 : 14;
  const tabBarMaxWidth = width >= 1280 ? 860 : width >= 1024 ? 780 : width >= 768 ? 700 : undefined;
  const tabBarBottom = Math.max((width >= 1024 ? 22 : 18) + insets.bottom * 0.35, insets.bottom + 10);

  if (!hasHydrated) {
    return (
      <AuthSplashScreen
        title="Loading workspace"
        message="Securing your access and preparing the mobile navigation shell."
      />
    );
  }

  if (!isAuthenticated) {
    return <Redirect href={appRoutes.login} />;
  }

  if (!canAccessTab(currentTab, session?.user?.role)) {
    return <Redirect href={getDefaultAppRoute(session?.user?.role)} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.tabInactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 2,
          marginTop: 1,
        },
        tabBarStyle: {
          position: 'absolute',
          left: horizontalInset,
          right: horizontalInset,
          maxWidth: tabBarMaxWidth,
          alignSelf: 'center',
          bottom: tabBarBottom,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 82,
          borderRadius: theme.radius.xl,
          paddingTop: 8,
          paddingBottom: 10,
          shadowColor: theme.colors.shadowStrong,
          shadowOffset: {
            width: 0,
            height: 16,
          },
          shadowOpacity: 0.22,
          shadowRadius: 24,
          overflow: 'hidden',
        },
        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: 4,
          paddingBottom: 2,
        },
        tabBarBackground: () => (
          <View
            style={[
              StyleSheet.absoluteFillObject,
              {
                borderRadius: theme.radius.xl,
                overflow: 'hidden',
              },
            ]}
          >
            <BlurView
              intensity={theme.effects.blurStrong}
              tint={theme.isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFillObject}
            />
            <LinearGradient
              colors={[theme.colors.surfaceStrong, theme.colors.surfaceMuted]}
              style={StyleSheet.absoluteFillObject}
            />
            <View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFillObject,
                styles.tabBorder,
                {
                  borderRadius: theme.radius.xl,
                  borderColor: theme.colors.borderStrong,
                },
              ]}
            />
          </View>
        ),
      }}
    >
      {accessibleTabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.label,
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons
                color={color}
                name={focused ? tab.activeIcon : tab.icon}
                size={size}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBorder: {
    borderWidth: 1,
  },
});
