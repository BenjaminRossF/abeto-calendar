"use client";

import { Dialog } from "@base-ui/react/dialog";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "cn";
import { buttonVariants } from "@/components/ui/button";

export const Sheet = Dialog.Root;
export const SheetTrigger = Dialog.Trigger;
export const SheetTitle = Dialog.Title;
export const SheetDescription = Dialog.Description;

export function SheetPortal(props: ComponentProps<typeof Dialog.Portal>) {
  return <Dialog.Portal {...props} />;
}

export function SheetOverlay({ className, ...props }: ComponentProps<typeof Dialog.Backdrop>) {
  return (
    <Dialog.Backdrop
      className={cn(
        "fixed inset-0 bg-foreground/25 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

type SheetContentProps = ComponentProps<typeof Dialog.Popup> & {
  side?: "left" | "right";
};

export function SheetContent({ className, side = "right", ...props }: SheetContentProps) {
  const position = side === "right"
    ? "right-0 translate-x-0 data-ending-style:translate-x-full data-starting-style:translate-x-full border-l"
    : "left-0 translate-x-0 data-ending-style:-translate-x-full data-starting-style:-translate-x-full border-r";

  return (
    <Dialog.Portal>
      <SheetOverlay />
      <Dialog.Popup
        className={cn(
          "fixed inset-y-0 flex h-dvh w-full max-w-[calc(100vw-1rem)] flex-col overflow-y-auto border-border bg-card text-card-foreground shadow-xl outline-none transition-transform duration-200 ease-out motion-reduce:transition-none sm:max-w-lg",
          position,
          className,
        )}
        {...props}
      />
    </Dialog.Portal>
  );
}

export function SheetClose({ className, ...props }: ComponentProps<typeof Dialog.Close>) {
  return (
    <Dialog.Close
      className={cn(buttonVariants({ variant: "ghost", size: "icon" }), className)}
      {...props}
    />
  );
}

export function SheetHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}

export function SheetFooter({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("mt-auto flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end", className)} {...props} />;
}

export function SheetBody({ className, children, ...props }: ComponentProps<"div"> & { children: ReactNode }) {
  return <div className={cn("flex flex-col gap-5 p-5 sm:p-6", className)} {...props}>{children}</div>;
}
