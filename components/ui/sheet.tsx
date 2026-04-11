"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SheetContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SheetContext = createContext<SheetContextValue>({
  open: false,
  onOpenChange: () => {},
});

export interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

function Sheet({ open: controlledOpen, onOpenChange, children }: SheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const handleOpenChange = (value: boolean) => {
    if (!isControlled) setInternalOpen(value);
    onOpenChange?.(value);
  };

  return (
    <SheetContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

function SheetTrigger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { onOpenChange } = useContext(SheetContext);

  return (
    <button
      type="button"
      onClick={() => onOpenChange(true)}
      className={className}
    >
      {children}
    </button>
  );
}

function SheetContent({
  children,
  className,
  side = "left",
}: {
  children: ReactNode;
  className?: string;
  side?: "left" | "right";
}) {
  const { open, onOpenChange } = useContext(SheetContext);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") onOpenChange(false);
      };
      document.addEventListener("keydown", handleEscape);
      return () => {
        document.body.style.overflow = "";
        document.removeEventListener("keydown", handleEscape);
      };
    }
  }, [open, onOpenChange]);

  if (!mounted || !open) return null;

  const slideClasses = {
    left: "inset-y-0 left-0 border-r slide-in-from-left",
    right: "inset-y-0 right-0 border-l animate-slide-in-right",
  };

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      {/* Panel */}
      <div
        className={cn(
          "fixed z-50 flex h-full w-3/4 max-w-sm flex-col bg-card shadow-xl transition-transform duration-300",
          slideClasses[side],
          className
        )}
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">關閉</span>
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

function SheetHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col space-y-2 p-4 pb-0", className)}>
      {children}
    </div>
  );
}

function SheetTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("text-lg font-semibold text-foreground", className)}>
      {children}
    </h2>
  );
}

export { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle };
