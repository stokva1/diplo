import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatusBadgeVariant =
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "muted"
    | "info";

type StatusBadgeSize = "sm" | "md";

const variantClasses: Record<StatusBadgeVariant, string> = {
    default: "border-border bg-muted text-muted-foreground",
    success: "border-success/25 bg-success/10 text-success",
    warning: "border-warning/40 bg-warning/15 text-warning-foreground",
    danger: "border-destructive/25 bg-destructive/10 text-destructive",
    muted: "border-border bg-muted text-muted-foreground",
    info: "border-info/25 bg-info/10 text-info",
};

const sizeClasses: Record<StatusBadgeSize, string> = {
    sm: "px-2.5 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
};

export function StatusBadge({
                                children,
                                variant = "default",
                                size = "sm",
                                className,
                            }: {
    children: ReactNode;
    variant?: StatusBadgeVariant;
    size?: StatusBadgeSize;
    className?: string;
}) {
    return (
        <span
            className={cn(
                "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border font-medium",
                variantClasses[variant],
                sizeClasses[size],
                className,
            )}
        >
      {children}
    </span>
    );
}