import { createFileRoute } from '@tanstack/react-router';
import { FeedbackShowcase } from '@/features/showcase/feedback-page';

export const Route = createFileRoute('/_authenticated/showcase/feedback')({
  component: FeedbackShowcase,
});
