import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "warning" | "error";

const variantClasses: Record<AlertVariant, string> = {
    info: "border-info/25 bg-info/10 text-info",
    success: "border-success/25 bg-success/10 text-success",
    warning: "border-warning/40 bg-warning/15 text-warning-foreground",
    error: "border-destructive/25 bg-destructive/10 text-destructive",
};

export function Alert({
                          title,
                          children,
                          variant = "info",
                          className,
                      }: {
    title?: ReactNode;
    children?: ReactNode;
    variant?: AlertVariant;
    className?: string;
}) {
    return (
        <div className={cn("flex items-center gap-2 rounded-lg border px-4 py-3 text-sm", variantClasses[variant], className)}>
            {title ? <p className="mb-1 font-medium">{title}</p> : null}
            {children}
        </div>
    );
}
