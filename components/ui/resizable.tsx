"use client"

import { GripVertical } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
)

const ResizablePanel = ResizablePrimitive.Panel

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      "relative flex items-center justify-center transition-colors duration-200 ease-in-out",
      "bg-border/70",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      "data-[resize-handle-state=hover]:bg-primary/40 data-[resize-handle-state=drag]:bg-primary/60",
      "data-[panel-group-direction=horizontal]:w-1.5 data-[panel-group-direction=horizontal]:hover:w-2 data-[panel-group-direction=horizontal]:data-[resize-handle-state=drag]:w-2.5",
      "data-[panel-group-direction=horizontal]:after:absolute data-[panel-group-direction=horizontal]:after:inset-y-0 data-[panel-group-direction=horizontal]:after:left-1/2 data-[panel-group-direction=horizontal]:after:w-2 data-[panel-group-direction=horizontal]:after:-translate-x-1/2",
      "data-[panel-group-direction=vertical]:h-1.5 data-[panel-group-direction=vertical]:hover:h-2 data-[panel-group-direction=vertical]:data-[resize-handle-state=drag]:h-2.5",
      "data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:absolute data-[panel-group-direction=vertical]:after:inset-x-0 data-[panel-group-direction=vertical]:after:top-1/2 data-[panel-group-direction=vertical]:after:h-2 data-[panel-group-direction=vertical]:after:-translate-y-1/2",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-8 w-6 items-center justify-center rounded-md border border-border/60 bg-background/70 backdrop-blur-sm shadow-lg">
        <GripVertical className="h-4 w-4 text-foreground/70" />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
