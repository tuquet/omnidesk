import { createLazyFileRoute } from '@tanstack/react-router';
import { WordAssistantPage } from '@/features/documents/word-assistant';

export const Route = createLazyFileRoute('/_authenticated/documents/word-assistant')({
  component: WordAssistantPage,
});
