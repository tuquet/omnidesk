import { createLazyFileRoute } from '@tanstack/react-router';
import { DataLibraryPage } from '@omnidesk/app-documents/data-library';

export const Route = createLazyFileRoute('/_authenticated/documents/data-library')({
  component: DataLibraryPage,
});
