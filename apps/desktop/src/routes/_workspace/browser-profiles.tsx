import { createFileRoute } from '@tanstack/react-router';
import { BrowserProfileManager } from '../../components/browser-profiles/BrowserProfileManager';

export const Route = createFileRoute('/_workspace/browser-profiles')({
  component: BrowserProfileManager,
});
