import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@kbm/ui"
import { Input } from "@kbm/ui"
import { createIssueSchema } from "../schemas"
import { IssueStatus, IssuePriority } from "../constants"
import type { CreateIssuePayload } from "../types"

// Temporary mock for Select components until they are built in @kbm/ui
const SelectMock = ({ value, onChange, options }: any) => (
  <select value={value} onChange={onChange} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
    {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
  </select>
)

export function IssueForm({ onSubmit, defaultValues }: { onSubmit: (data: CreateIssuePayload) => void, defaultValues?: Partial<CreateIssuePayload> }) {
  const form = useForm<CreateIssuePayload>({
    resolver: zodResolver(createIssueSchema),
    defaultValues: defaultValues || {
      title: "",
      description: "",
      status: IssueStatus.OPEN,
      priority: IssuePriority.MEDIUM,
      tags: []
    }
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Title</label>
        <Input {...form.register("title")} placeholder="Issue title..." />
        {form.formState.errors.title && (
          <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Input {...form.register("description")} placeholder="Describe the issue..." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <SelectMock
            value={form.watch("status")}
            onChange={(e: any) => form.setValue("status", e.target.value)}
            options={["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Priority</label>
          <SelectMock
            value={form.watch("priority")}
            onChange={(e: any) => form.setValue("priority", e.target.value)}
            options={["LOW", "MEDIUM", "HIGH", "URGENT"]}
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        Save Issue
      </Button>
    </form>
  )
}
