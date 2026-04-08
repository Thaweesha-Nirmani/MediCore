import { Redirect, Stack } from 'expo-router';

import { AuthSplashScreen } from '@/features/auth/components/AuthSplashScreen';
import { useAuthBootstrap } from '@/features/auth/hooks/useAuthBootstrap';
import { getDefaultAppRoute } from '@/navigation/tabs';

export default function AuthLayout() {
  const { hasHydrated, isAuthenticated, session } = useAuthBootstrap();

  if (!hasHydrated) {
    return (
      <AuthSplashScreen
        title="Checking access"
        message="Preparing sign-in security and verifying any saved session."
      />
    );
  }

  if (isAuthenticated) {
    return <Redirect href={getDefaultAppRoute(session?.user?.role)} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
