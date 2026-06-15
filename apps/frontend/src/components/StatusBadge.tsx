import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatusBadgeVariant = "default" | "success" | "warning" | "danger" | "muted" | "info";

const variantClasses: Record<StatusBadgeVariant, string> = {
    default: "border-border bg-muted text-muted-foreground",
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warning: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    danger: "border-destructive/20 bg-destructive/10 text-destructive",
    muted: "border-border bg-background text-muted-foreground",
    info: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
};

export function StatusBadge({
                                children,
                                variant = "default",
                                className,
                            }: {
    children: ReactNode;
    variant?: StatusBadgeVariant;
    className?: string;
}) {
    return (
        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", variantClasses[variant], className)}>
      {children}
    </span>
    );
}
