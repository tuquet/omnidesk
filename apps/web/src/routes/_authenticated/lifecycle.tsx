import { createFileRoute } from '@tanstack/react-router';
import { LifecyclePage } from '@/features/lifecycle';

export const Route = createFileRoute('/_authenticated/lifecycle')({
  component: LifecyclePage,
});
