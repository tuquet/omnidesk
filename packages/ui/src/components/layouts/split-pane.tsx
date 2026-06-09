import * as React from "react"
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels"

import { cn } from "../../lib/utils"

export const SplitPaneGroup = ({ className, ...props }: React.ComponentProps<typeof PanelGroup>) => (
  <PanelGroup
    className={cn("h-full w-full", className)}
    {...props}
  />
)

export const SplitPane = Panel

export const SplitPaneHandle = ({
  className,
  withHandle = true,
  ...props
}: React.ComponentProps<typeof PanelResizeHandle> & { withHandle?: boolean }) => (
  <PanelResizeHandle
    className={cn(
      "relative flex w-1.5 items-center justify-center bg-transparent transition-colors hover:bg-blue-500/50 active:bg-blue-500",
      "after:absolute after:inset-y-0 after:left-1/2 after:w-3 after:-translate-x-1/2",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-6 w-1 items-center justify-center rounded-sm bg-slate-300 dark:bg-slate-700">
        <div className="h-full w-[1px] bg-slate-400 dark:bg-slate-500" />
      </div>
    )}
  </PanelResizeHandle>
)
