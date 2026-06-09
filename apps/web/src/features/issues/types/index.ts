import { z } from "zod";
import { issueSchema, createIssueSchema, updateIssueSchema } from "../schemas";

export type Issue = z.infer<typeof issueSchema>;
export type CreateIssuePayload = z.infer<typeof createIssueSchema>;
export type UpdateIssuePayload = z.infer<typeof updateIssueSchema>;
