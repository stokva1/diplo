import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
                               title,
                               description,
                               actions,
                               className,
                           }: {
    title: string;
    description?: string;
    actions?: ReactNode;
    className?: string;
}) {
    if (!actions) {
        return (
            <div className={cn(className)}>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                    {title}
                </h1>
                {description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                ) : null}
            </div>
        );
    }

    return (
        <div className={cn(className)}>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                {title}
            </h1>
            {description ? (
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            ) : null}
        </div>
    );
}