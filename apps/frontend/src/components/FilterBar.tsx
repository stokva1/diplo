import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FilterBar({
                              children,
                              className,
                              gridClassName,
                              variant = "card",
                          }: {
    children: ReactNode;
    className?: string;
    gridClassName?: string;
    variant?: "card" | "embedded";
}) {
    return (
        <div
            className={cn(
                variant === "card"
                    ? "mb-6 rounded-xl border border-border bg-card p-4 shadow-sm"
                    : "mb-0 border-0 bg-transparent p-0 shadow-none",
                className,
            )}
        >
            <div
                className={cn(
                    "grid grid-cols-1 gap-3 md:grid-cols-2",
                    gridClassName,
                )}
            >
                {children}
            </div>
        </div>
    );
}

export function FilterField({
                                label,
                                children,
                                className,
                            }: {
    label: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
            {children}
        </label>
    );
}