import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FilterBar({
                              children,
                              className,
                          }: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("mb-6 rounded-xl border border-border bg-card p-4 shadow-sm", className)}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">{children}</div>
        </div>
    );
}

export function FilterField({
                                label,
                                children,
                            }: {
    label: string;
    children: ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
            {children}
        </label>
    );
}
