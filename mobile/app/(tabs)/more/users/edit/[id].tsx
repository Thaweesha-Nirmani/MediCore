import { useLocalSearchParams } from 'expo-router';

import { UserFormScreen } from '@/features/users/screens/UserFormScreen';

export default function UserEditRoute() {
  const params = useLocalSearchParams<{ id: string }>();

  return <UserFormScreen userId={params.id} />;
}
