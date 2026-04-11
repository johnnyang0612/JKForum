"use client";

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";

interface DropdownContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DropdownContext = createContext<DropdownContextValue>({
  open: false,
  onOpenChange: () => {},
});

export interface DropdownMenuProps {
  children: ReactNode;
}

function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(e.target as Node)
    ) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, handleClickOutside]);

  return (
    <DropdownContext.Provider value={{ open, onOpenChange: setOpen }}>
      <div ref={containerRef} className="relative inline-block">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

function DropdownMenuTrigger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { open, onOpenChange } = useContext(DropdownContext);

  return (
    <button
      type="button"
      onClick={() => onOpenChange(!open)}
      className={cn("outline-none", className)}
      aria-expanded={open}
      aria-haspopup="true"
    >
      {children}
    </button>
  );
}

function DropdownMenuContent({
  children,
  className,
  align = "end",
}: {
  children: ReactNode;
  className?: string;
  align?: "start" | "end" | "center";
}) {
  const { open } = useContext(DropdownContext);

  if (!open) return null;

  return (
    <div
      className={cn(
        "absolute top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-md border bg-card p-1 shadow-lg animate-fade-in",
        align === "end" && "right-0",
        align === "start" && "left-0",
        align === "center" && "left-1/2 -translate-x-1/2",
        className
      )}
      role="menu"
    >
      {children}
    </div>
  );
}

function DropdownMenuItem({
  children,
  className,
  icon,
  disabled,
  destructive,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  onClick?: () => void;
}) {
  const { onOpenChange } = useContext(DropdownContext);

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={() => {
        onClick?.();
        onOpenChange(false);
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        "hover:bg-muted focus:bg-muted",
        "disabled:pointer-events-none disabled:opacity-50",
        destructive && "text-danger hover:bg-danger/10 focus:bg-danger/10",
        className
      )}
    >
      {icon && <span className="h-4 w-4 shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn("-mx-1 my-1 h-px bg-border", className)} />;
}

function DropdownMenuLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("px-2 py-1.5 text-xs font-semibold text-muted-foreground", className)}>
      {children}
    </div>
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
};
