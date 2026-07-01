import type { AppDefinition } from '@omnidesk/types';
import { appInfo as automaInfo } from '@omnidesk/app-automa';

export const APP_REGISTRY: Record<string, AppDefinition> = {
  'automa': automaInfo,
};
