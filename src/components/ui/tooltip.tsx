'use client';

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    showArrow?: boolean;
  }
>(({ className, sideOffset = 6, showArrow = true, children, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'relative z-50 max-w-[320px] rounded-none border border-[#C1FF07]/40 bg-[#08080c] px-3.5 py-2 text-xs text-white shadow-2xl backdrop-blur-md',
        'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        'data-[side=bottom]:slide-in-from-top-1.5 data-[side=left]:slide-in-from-right-1.5 data-[side=right]:slide-in-from-left-1.5 data-[side=top]:slide-in-from-bottom-1.5',
        className
      )}
      {...props}
    >
      {children}
      {showArrow && (
        <TooltipPrimitive.Arrow className="-my-px fill-[#121318] drop-shadow-[0_1px_0_rgba(255,255,255,0.15)]" />
      )}
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

/**
 * OriginUI Stats List Component for Tooltip Content
 */
export function TooltipStats({
  items,
}: {
  items: { label: string; value: React.ReactNode; icon?: React.ReactNode }[];
}) {
  return (
    <ul className="grid gap-2 text-xs py-1 min-w-[180px]">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-center justify-between gap-4 border-b border-white/5 pb-1 last:border-0 last:pb-0">
          <span className="text-white/60 flex items-center gap-1.5">
            {item.icon}
            {item.label}
          </span>
          <span className="font-semibold text-white font-outfit">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
export default Tooltip;
