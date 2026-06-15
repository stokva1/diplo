import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatCard({
                             label,
                             value,
                             description,
                             icon: Icon,
                             className,
                         }: {
    label: string;
    value: ReactNode;
    description?: ReactNode;
    icon?: ElementType;
    className?: string;
}) {
    return (
        <div className={cn("rounded-xl border border-border bg-card px-4 py-3 shadow-sm", className)}>
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                {Icon ? <Icon className="size-4 shrink-0 text-muted-foreground" /> : null}
            </div>
            <p className="mt-1 truncate text-2xl font-semibold tracking-tight text-card-foreground">{value}</p>
            {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
        </div>
    );
}
