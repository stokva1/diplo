import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatCardTone = "neutral" | "warning" | "danger" | "success" | "info";

export function StatCard({
                             label,
                             value,
                             description,
                             icon: Icon,
                             tone = "neutral",
                             className,
                         }: {
    label: string;
    value: ReactNode;
    description?: ReactNode;
    icon?: ElementType;
    tone?: StatCardTone;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "rounded-xl border px-4 py-3 shadow-sm",
                tone === "neutral" && "border-border bg-card",
                tone === "warning" && "border-warning/40 bg-warning/15",
                tone === "danger" && "border-destructive/25 bg-destructive/10",
                tone === "success" && "border-success/25 bg-success/10",
                tone === "info" && "border-info/25 bg-info/10",
                className,
            )}
        >
            <div className="flex items-center justify-between gap-3">
                <p
                    className={cn(
                        "text-xs font-medium",
                        tone === "neutral" && "text-muted-foreground",
                        tone === "warning" && "text-warning-foreground",
                        tone === "danger" && "text-destructive",
                        tone === "success" && "text-success",
                        tone === "info" && "text-info",
                    )}
                >
                    {label}
                </p>

                {Icon ? (
                    <Icon
                        className={cn(
                            "size-4 shrink-0",
                            tone === "neutral" && "text-muted-foreground",
                            tone === "warning" && "text-warning-foreground",
                            tone === "danger" && "text-destructive",
                            tone === "success" && "text-success",
                            tone === "info" && "text-info",
                        )}
                    />
                ) : null}
            </div>

            <p
                className={cn(
                    "mt-1 truncate text-2xl font-semibold tracking-tight",
                    tone === "neutral" && "text-card-foreground",
                    tone === "warning" && "text-warning-foreground",
                    tone === "danger" && "text-destructive",
                    tone === "success" && "text-success",
                    tone === "info" && "text-info",
                )}
            >
                {value}
            </p>

            {description ? (
                <p
                    className={cn(
                        "mt-1 text-xs",
                        tone === "neutral" && "text-muted-foreground",
                        tone === "warning" && "text-warning-foreground",
                        tone === "danger" && "text-destructive",
                        tone === "success" && "text-success",
                        tone === "info" && "text-info",
                    )}
                >
                    {description}
                </p>
            ) : null}
        </div>
    );
}