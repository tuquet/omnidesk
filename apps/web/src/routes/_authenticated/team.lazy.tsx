import { createLazyFileRoute } from '@tanstack/react-router';
import { TeamPage } from '@/features/team';

export const Route = createLazyFileRoute('/_authenticated/team')({
  component: TeamPage,
});
