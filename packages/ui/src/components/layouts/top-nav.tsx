import * as React from "react"
import { cn } from "../../lib/utils"

export const TopNav = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <header
      ref={ref}
      className={cn(
        "flex h-[60px] shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-950",
        className
      )}
      {...props}
    />
  )
})
TopNav.displayName = "TopNav"

export const TopNavTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => {
  return (
    <h1
      ref={ref}
      className={cn("text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100", className)}
      {...props}
    />
  )
})
TopNavTitle.displayName = "TopNavTitle"

export const TopNavActions = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("ml-auto flex items-center gap-2", className)}
      {...props}
    />
  )
})
TopNavActions.displayName = "TopNavActions"
