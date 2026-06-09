import * as React from "react"
import { Badge, Button, Separator } from "@kbm/ui"
import type { Issue } from "../types"
import { IssueStatus } from "../constants"

export function IssueDetailPanel({ issue, onClose }: { issue?: Issue | null, onClose: () => void }) {
  if (!issue) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500">
        Select an issue to view details
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Badge variant={issue.status === IssueStatus.OPEN ? "secondary" : "default"}>
            {issue.status}
          </Badge>
          <span className="text-sm text-slate-500">{issue.id.split('-')[0]}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">{issue.title}</h2>
          <div className="flex gap-2">
            {issue.tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-500 mb-1">Description</h3>
            <p className="text-sm">{issue.description || "No description provided."}</p>
          </div>

          {issue.reproduceSteps && (
            <div>
              <h3 className="text-sm font-medium text-slate-500 mb-1">Steps to Reproduce</h3>
              <div className="rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-900 font-mono whitespace-pre-wrap">
                {issue.reproduceSteps}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {issue.expectedBehavior && (
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-1">Expected</h3>
                <p className="text-sm">{issue.expectedBehavior}</p>
              </div>
            )}
            {issue.actualBehavior && (
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-1">Actual</h3>
                <p className="text-sm text-red-600 dark:text-red-400">{issue.actualBehavior}</p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-medium mb-3">Activity History</h3>
          {issue.events.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No activity yet.</p>
          ) : (
            <div className="space-y-3">
              {issue.events.map(event => (
                <div key={event.id} className="text-sm flex gap-3">
                  <div className="w-24 text-slate-500 text-xs mt-0.5">
                    {new Date(event.timestamp).toLocaleString()}
                  </div>
                  <div>
                    {event.type === "STATUS_CHANGE" && (
                      <span>Changed status from <b>{event.fromStatus}</b> to <b>{event.toStatus}</b></span>
                    )}
                    {event.type === "COMMENT" && (
                      <div>
                        <span className="font-medium">Commented:</span>
                        <div className="mt-1 p-2 rounded bg-slate-100 dark:bg-slate-800">
                          {event.comment}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="flex gap-2">
          {issue.status === IssueStatus.OPEN && (
            <Button className="flex-1">Mark as In Progress</Button>
          )}
          {(issue.status === IssueStatus.IN_PROGRESS || issue.status === IssueStatus.REOPENED) && (
            <Button className="flex-1" variant="default">Resolve Issue</Button>
          )}
          {issue.status === IssueStatus.RESOLVED && (
            <Button className="flex-1" variant="outline">Reopen Issue</Button>
          )}
        </div>
      </div>
    </div>
  )
}
