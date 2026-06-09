import { z } from "zod";
import { IssueStatus, IssuePriority, ResolutionReason } from "../constants";

export const issueEventSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["STATUS_CHANGE", "COMMENT", "ASSIGNED"]),
  actorId: z.string(), // who did it
  timestamp: z.string().datetime(),
  fromStatus: z.nativeEnum(IssueStatus).optional(),
  toStatus: z.nativeEnum(IssueStatus).optional(),
  comment: z.string().optional()
});

export const issueSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  
  // Bug specific fields
  reproduceSteps: z.string().optional(),
  expectedBehavior: z.string().optional(),
  actualBehavior: z.string().optional(),
  
  // Classification
  status: z.nativeEnum(IssueStatus).default(IssueStatus.OPEN),
  priority: z.nativeEnum(IssuePriority).default(IssuePriority.MEDIUM),
  tags: z.array(z.string()).default([]),
  
  // Resolution
  resolutionReason: z.nativeEnum(ResolutionReason).optional(),
  
  // History
  events: z.array(issueEventSchema).default([]),
  
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const createIssueSchema = issueSchema.omit({ id: true, createdAt: true, updatedAt: true, events: true });
export const updateIssueSchema = createIssueSchema.partial();
