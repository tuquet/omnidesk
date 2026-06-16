import { createLazyFileRoute } from '@tanstack/react-router';
import { LifecyclePage } from '@omnidesk/app-lifecycle';

export const Route = createLazyFileRoute('/_authenticated/lifecycle')({
  component: LifecyclePage,
});
