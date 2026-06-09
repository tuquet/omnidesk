import * as React from "react"
import { DataTable, Badge, type ColumnDef } from "@kbm/ui"
import type { Issue } from "../types"
import { IssueStatus, IssuePriority } from "../constants"

// Define columns for the data table
export const columns: ColumnDef<Issue>[] = [
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => (
      <div className="font-medium">
        {row.getValue("title")}
        {row.original.tags.map(tag => (
          <Badge key={tag} variant="outline" className="ml-2 text-xs">
            {tag}
          </Badge>
        ))}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return (
        <Badge 
          variant={status === IssueStatus.RESOLVED || status === IssueStatus.CLOSED ? "default" : "secondary"}
        >
          {status.replace("_", " ")}
        </Badge>
      )
    },
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string
      return (
        <div className="text-sm font-medium">
          {priority}
        </div>
      )
    },
  },
  {
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }) => {
      const date = new Date(row.getValue("updatedAt"))
      return <div className="text-sm text-slate-500">{date.toLocaleDateString()}</div>
    },
  },
]

// Mock data for demonstration
const mockData: Issue[] = [
  {
    id: "123e4567-e89b-12d3-a456-426614174000",
    title: "App crashes on startup",
    description: "When launching the app on Windows 11, it immediately crashes without any error dialog.",
    reproduceSteps: "1. Open app\n2. Crash happens",
    expectedBehavior: "App opens successfully",
    actualBehavior: "App crashes",
    status: IssueStatus.OPEN,
    priority: IssuePriority.CRITICAL,
    tags: ["bug", "windows"],
    events: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "123e4567-e89b-12d3-a456-426614174001",
    title: "Sidebar doesn't collapse on mobile",
    description: "The sidebar stays open and overlaps content on smaller screens.",
    status: IssueStatus.IN_PROGRESS,
    priority: IssuePriority.MEDIUM,
    tags: ["ui", "mobile"],
    events: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
]

export function IssueList() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Issues</h2>
      </div>
      <DataTable columns={columns} data={mockData} />
    </div>
  )
}
