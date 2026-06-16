import { createLazyFileRoute } from '@tanstack/react-router';
import { FeedbackShowcase } from '@omnidesk/app-showcase/feedback-page';

export const Route = createLazyFileRoute('/_authenticated/showcase/feedback')({
  component: FeedbackShowcase,
});
