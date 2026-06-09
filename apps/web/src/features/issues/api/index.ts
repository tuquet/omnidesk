// TODO: Later integrate with OpenAPI 3.0 generated client (e.g. @hey-api/openapi-ts)
// For now, these are placeholder React Query hooks

import { useQuery, useMutation } from "@tanstack/react-query";
import type { Issue, CreateIssuePayload } from "../types";

export const useIssues = () => {
  return useQuery({
    queryKey: ["issues"],
    queryFn: async (): Promise<Issue[]> => {
      // TODO: Replace with OpenAPI generated client call
      return [];
    }
  });
};

export const useCreateIssue = () => {
  return useMutation({
    mutationFn: async (payload: CreateIssuePayload): Promise<Issue> => {
      // TODO: Replace with OpenAPI generated client call
      throw new Error("Not implemented");
    }
  });
};
