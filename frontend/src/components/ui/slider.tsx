import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <div className="w-full">
    {/* Ruler marks above */}
    <div className="flex items-end justify-between h-1.5 mb-0.5 pointer-events-none select-none">
      {[...Array(21)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-px pointer-events-none",
            i % 10 === 0 ? "h-1.5 bg-muted-foreground/50" : i % 5 === 0 ? "h-1 bg-muted-foreground/30" : "h-0.5 bg-muted-foreground/20"
          )}
        />
      ))}
    </div>

    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center group",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-6 w-full grow overflow-hidden bg-zinc-900 border border-zinc-700/50">
        <SliderPrimitive.Range className="absolute h-full bg-zinc-800" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-5 w-3 bg-zinc-300 border border-zinc-500/50 ring-0 focus-visible:outline-none focus-visible:ring-0 disabled:pointer-events-none disabled:opacity-50 cursor-ew-resize hover:bg-zinc-200 active:bg-zinc-100" />
    </SliderPrimitive.Root>
  </div>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
