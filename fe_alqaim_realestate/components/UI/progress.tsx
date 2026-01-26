"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

type ProgressProps = React.ComponentProps<typeof ProgressPrimitive.Root> & {
  indeterminate?: boolean;
  value?: number;
};

function Progress({
  className,
  value,
  indeterminate = false,
  ...props
}: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className,
      )}
      {...props}
    >
      {indeterminate ? (
        <span className="absolute left-0 top-0 h-full w-1/3 bg-emerald-500 rounded-full animate-indeterminate" />
      ) : (
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className="bg-emerald-500 h-full w-full flex-1 transition-all"
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      )}
    </ProgressPrimitive.Root>
  );
}

export { Progress };