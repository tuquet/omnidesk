import { createLazyFileRoute } from '@tanstack/react-router';
import { DataLibraryPage } from '@/features/documents/data-library';

export const Route = createLazyFileRoute('/_authenticated/documents/data-library')({
  component: DataLibraryPage,
});
