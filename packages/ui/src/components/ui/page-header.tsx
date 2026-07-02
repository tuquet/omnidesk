import * as React from "react"
import { cn } from "../../lib/utils"

const PageContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-1 flex-col gap-2 p-3 md:gap-4 md:p-4", className)}
    {...props}
  />
))
PageContainer.displayName = "PageContainer"

const PageHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center justify-between space-y-2", className)}
    {...props}
  />
))
PageHeader.displayName = "PageHeader"

const PageTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h1
    ref={ref}
    className={cn("text-3xl font-bold tracking-tight", className)}
    {...props}
  />
))
PageTitle.displayName = "PageTitle"

const PageDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("sr-only", className)}
    {...props}
  />
))
PageDescription.displayName = "PageDescription"

export { PageContainer, PageHeader, PageTitle, PageDescription }
