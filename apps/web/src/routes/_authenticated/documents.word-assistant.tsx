import { createFileRoute } from '@tanstack/react-router';
import { WordAssistantPage } from '@/features/documents/word-assistant';

export const Route = createFileRoute('/_authenticated/documents/word-assistant')({
  component: WordAssistantPage,
});
