import type React from 'react';
import {
  FilePlusIcon,
  LayoutTemplateIcon,
  UploadIcon,
  SparklesIcon,
} from 'lucide-react';
import { z } from 'zod';

export const recentDocumentSchema = z.object({
  name: z.string(),
  lastEdited: z.string(),
  type: z.string(),
});

export type RecentDocument = z.infer<typeof recentDocumentSchema>;

export const recentDocuments = z.array(recentDocumentSchema).parse([
  {
    name: 'Q2 Strategy Brief',
    lastEdited: '2 hours ago',
    type: 'Document',
  },
  {
    name: 'API Integration Guide',
    lastEdited: '5 hours ago',
    type: 'Technical',
  },
  {
    name: 'Team Standup Notes — Jun 9',
    lastEdited: 'Yesterday',
    type: 'Notes',
  },
  {
    name: 'Product Roadmap 2026',
    lastEdited: '2 days ago',
    type: 'Planning',
  },
  {
    name: 'Customer Onboarding Flow',
    lastEdited: '3 days ago',
    type: 'Process',
  },
]);

export const quickActionSchema = z.object({
  title: z.string(),
  description: z.string(),
  icon: z.custom<React.ElementType>(),
  color: z.string(),
});

export type QuickAction = z.infer<typeof quickActionSchema>;

export const quickActions = z.array(quickActionSchema).parse([
  {
    title: 'New Document',
    description: 'Start with a blank document',
    icon: FilePlusIcon as React.ElementType,
    color: 'bg-muted text-muted-foreground',
  },
  {
    title: 'From Template',
    description: 'Choose from pre-built templates',
    icon: LayoutTemplateIcon as React.ElementType,
    color: 'bg-muted text-muted-foreground',
  },
  {
    title: 'Import',
    description: 'Import .docx, .pdf, or .md files',
    icon: UploadIcon as React.ElementType,
    color: 'bg-muted text-muted-foreground',
  },
  {
    title: 'AI Generate',
    description: 'Generate content with AI assistance',
    icon: SparklesIcon as React.ElementType,
    color: 'bg-muted text-muted-foreground',
  },
]);

export const templateSchema = z.object({
  title: z.string(),
  description: z.string(),
  badge: z.string().nullable(),
});

export type Template = z.infer<typeof templateSchema>;

export const templates = z.array(templateSchema).parse([
  {
    title: 'Project Proposal',
    description:
      'A structured proposal template with sections for objectives, timeline, budget, and deliverables.',
    badge: 'Popular',
  },
  {
    title: 'Meeting Notes',
    description: 'Capture agendas, action items, and decisions with a clean meeting notes format.',
    badge: 'New',
  },
  {
    title: 'Technical Spec',
    description:
      'RFC-style technical specification with problem statement, proposed solution, and trade-offs.',
    badge: null,
  },
  {
    title: 'Release Notes',
    description:
      'Changelog-style template for documenting features, fixes, and breaking changes per release.',
    badge: null,
  },
]);
