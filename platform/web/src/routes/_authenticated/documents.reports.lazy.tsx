import { createLazyFileRoute } from '@tanstack/react-router';
import { ReportsPage } from '@omnidesk/app-documents/reports';

export const Route = createLazyFileRoute('/_authenticated/documents/reports')({
  component: ReportsPage,
});
