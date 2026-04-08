import { ErrorState } from '@/components/feedback/ErrorState';

export default function NotFoundScreen() {
  return (
    <ErrorState
      title="Route not found"
      message="This mobile placeholder route does not exist yet."
      actionLabel="Back to start"
      onAction={() => {}}
    />
  );
}
