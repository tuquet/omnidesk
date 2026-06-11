import { createLazyFileRoute } from '@tanstack/react-router';
import { CardsShowcase } from '@/features/showcase/cards-page';

export const Route = createLazyFileRoute('/_authenticated/showcase/cards')({
  component: CardsShowcase,
});
