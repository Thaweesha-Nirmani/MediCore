import { Redirect } from 'expo-router';

import { appRoutes } from '@/constants/routes';
import { AuthSplashScreen } from '@/features/auth/components/AuthSplashScreen';
import { useAuthBootstrap } from '@/features/auth/hooks/useAuthBootstrap';
import { getDefaultAppRoute } from '@/navigation/tabs';

export default function IndexRoute() {
  const { hasHydrated, isAuthenticated, session } = useAuthBootstrap();

  if (!hasHydrated) {
    return (
      <AuthSplashScreen
        title="Launching MediCore"
        message="Restoring your secure session and preparing the pharmacy workspace."
      />
    );
  }

  if (isAuthenticated) {
    return <Redirect href={getDefaultAppRoute(session?.user?.role)} />;
  }

  return <Redirect href={appRoutes.login} />;
}
