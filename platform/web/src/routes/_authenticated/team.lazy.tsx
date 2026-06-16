import { createLazyFileRoute } from '@tanstack/react-router';
import { TeamPage } from '@omnidesk/app-team';

export const Route = createLazyFileRoute('/_authenticated/team')({
  component: TeamPage,
});
