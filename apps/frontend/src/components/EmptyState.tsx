import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
                               title,
                               description,
                               action,
                               className,
                           }: {
    title?: string;
    description?: string;
    action?: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center", className)}>
            {title ? <h3 className="text-base font-semibold text-card-foreground">{title}</h3> : null}
            {description ? <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p> : null}
            {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
        </div>
    );
}
