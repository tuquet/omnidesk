import { createFileRoute } from '@tanstack/react-router';
import { CardsShowcase } from '@/features/showcase/cards-page';

export const Route = createFileRoute('/_authenticated/showcase/cards')({
  component: CardsShowcase,
});
