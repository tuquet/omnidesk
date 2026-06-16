import { createLazyFileRoute } from '@tanstack/react-router';
import { CardsShowcase } from '@omnidesk/app-showcase/cards-page';

export const Route = createLazyFileRoute('/_authenticated/showcase/cards')({
  component: CardsShowcase,
});
