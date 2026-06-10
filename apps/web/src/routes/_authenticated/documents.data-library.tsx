import { createFileRoute } from '@tanstack/react-router';
import { DataLibraryPage } from '@/features/documents/data-library';

export const Route = createFileRoute('/_authenticated/documents/data-library')({
  component: DataLibraryPage,
});
