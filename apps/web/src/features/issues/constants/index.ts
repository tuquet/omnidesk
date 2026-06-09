export enum IssueStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  IN_REVIEW = "IN_REVIEW",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
  REOPENED = "REOPENED"
}

export enum IssuePriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL"
}

export enum ResolutionReason {
  FIXED = "FIXED",
  WONTFIX = "WONTFIX",
  DUPLICATE = "DUPLICATE",
  CANNOT_REPRODUCE = "CANNOT_REPRODUCE"
}
