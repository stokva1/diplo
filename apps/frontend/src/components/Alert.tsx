import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "warning" | "error";

const variantClasses: Record<AlertVariant, string> = {
    info: "border-border bg-card text-card-foreground",
    success: "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    warning: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    error: "border-destructive/25 bg-destructive/10 text-destructive",
};

export function Alert({
                          title,
                          children,
                          variant = "info",
                          className,
                      }: {
    title?: ReactNode;
    children: ReactNode;
    variant?: AlertVariant;
    className?: string;
}) {
    return (
        <div className={cn("rounded-lg border px-4 py-3 text-sm", variantClasses[variant], className)}>
            {title ? <p className="mb-1 font-medium">{title}</p> : null}
            <div className="text-sm leading-6">{children}</div>
        </div>
    );
}
