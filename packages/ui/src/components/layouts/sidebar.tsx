import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { PanelLeft } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "../primitives/button"

// Context
type SidebarContextValue = {
  isCollapsed: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextValue | undefined>(undefined)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

// Provider
export function SidebarProvider({
  children,
  defaultCollapsed = false,
}: {
  children: React.ReactNode
  defaultCollapsed?: boolean
}) {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)
  
  const toggleSidebar = React.useCallback(() => {
    setIsCollapsed((prev) => !prev)
  }, [])

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}

// Sidebar Root
export const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { isCollapsed } = useSidebar()

  return (
    <aside
      ref={ref}
      className={cn(
        "group peer flex h-full flex-col border-r border-slate-800 bg-slate-900 text-slate-100 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[64px]" : "w-[260px]",
        className
      )}
      {...props}
    />
  )
})
Sidebar.displayName = "Sidebar"

// Header
export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { isCollapsed, toggleSidebar } = useSidebar()

  return (
    <div
      ref={ref}
      className={cn("flex h-[60px] shrink-0 items-center px-4 border-b border-slate-800", className)}
      {...props}
    >
      <div className={cn("flex flex-1 items-center gap-2 overflow-hidden", isCollapsed && "justify-center")}>
        {children}
      </div>
      {!isCollapsed && (
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="ml-auto text-slate-400 hover:bg-slate-800 hover:text-white">
          <PanelLeft className="h-4 w-4" />
          <span className="sr-only">Toggle Sidebar</span>
        </Button>
      )}
    </div>
  )
})
SidebarHeader.displayName = "SidebarHeader"

// Content
export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex-1 overflow-y-auto overflow-x-hidden py-4", className)}
      {...props}
    />
  )
})
SidebarContent.displayName = "SidebarContent"

// Group
export const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-1 px-3 py-2", className)}
      {...props}
    />
  )
})
SidebarGroup.displayName = "SidebarGroup"

// Group Label
export const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { isCollapsed } = useSidebar()
  if (isCollapsed) return null

  return (
    <div
      ref={ref}
      className={cn("mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500", className)}
      {...props}
    />
  )
})
SidebarGroupLabel.displayName = "SidebarGroupLabel"

// Menu Item
export const SidebarMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("relative", className)}
      {...props}
    />
  )
})
SidebarMenuItem.displayName = "SidebarMenuItem"

// Menu Button
const sidebarMenuButtonVariants = cva(
  "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
  {
    variants: {
      isActive: {
        true: "bg-blue-600/10 text-blue-500 hover:bg-blue-600/20 hover:text-blue-400",
        false: "text-slate-400",
      },
    },
    defaultVariants: {
      isActive: false,
    },
  }
)

export interface SidebarMenuButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof sidebarMenuButtonVariants> {
  asChild?: boolean
  tooltip?: string
}

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  SidebarMenuButtonProps
>(({ className, isActive, asChild = false, tooltip, children, ...props }, ref) => {
  const { isCollapsed } = useSidebar()
  const Comp = asChild ? Slot : "button"

  const buttonContent = (
    <Comp
      ref={ref}
      className={cn(
        sidebarMenuButtonVariants({ isActive }),
        isCollapsed && "justify-center px-0",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  )

  if (isCollapsed && tooltip) {
    // Ideally wrap with Tooltip component here
    return <div title={tooltip} className="w-full">{buttonContent}</div>
  }

  return buttonContent
})
SidebarMenuButton.displayName = "SidebarMenuButton"

// Footer
export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("mt-auto flex shrink-0 flex-col gap-2 p-4 border-t border-slate-800", className)}
      {...props}
    />
  )
})
SidebarFooter.displayName = "SidebarFooter"
