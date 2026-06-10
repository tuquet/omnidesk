import { createFileRoute } from '@tanstack/react-router';
import { ReportsPage } from '@/features/documents/reports';

export const Route = createFileRoute('/_authenticated/documents/reports')({
  component: ReportsPage,
});
