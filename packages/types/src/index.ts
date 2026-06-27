// Interfaces (type-only exports)
export type {
  Person,
  Attachment,
  Comment,
  PaginationParams,
  PaginatedResult,
} from './interfaces/common.types';

// API Response schema & error codes
export * from './api-response';

export interface PlatformAdapter {
  platform: 'desktop' | 'web';
  runCommand: (command: string, args: string[]) => Promise<any>;
  openUrl: (url: string) => Promise<void>;
  getOAuthRedirectUrl: () => string;
  isOAuthSkipBrowserRedirect: () => boolean;
}
