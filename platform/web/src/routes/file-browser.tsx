import { createFileRoute } from '@tanstack/react-router';
import { FileBrowserApp } from '@omnidesk/app-file-browser';

export const Route = createFileRoute('/file-browser')({
  component: FileBrowserApp,
});
