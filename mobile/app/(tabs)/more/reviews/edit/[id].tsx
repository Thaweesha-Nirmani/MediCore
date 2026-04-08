import { useLocalSearchParams } from 'expo-router';

import { ReviewFormScreen } from '@/features/reviews/screens/ReviewFormScreen';

export default function ReviewEditRoute() {
  const params = useLocalSearchParams<{ id: string }>();

  return <ReviewFormScreen reviewId={params.id} />;
}
