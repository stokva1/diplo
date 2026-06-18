import { cn } from "@/lib/utils";

export function LoadingState({
                                 label = "Loading...",
                                 variant = "page",
                                 fullScreen = false,
                                 className,
                             }: {
    label?: string;
    variant?: "page" | "inline";
    fullScreen?: boolean;
    className?: string;
}) {
    const content = (
        <div
            className={cn(
                "rounded-lg border border-border bg-card px-5 py-4 text-sm text-muted-foreground shadow-sm",
                variant === "inline" && "border-0 bg-transparent px-5 py-4 shadow-none",
                className,
            )}
        >
            {label}
        </div>
    );

    if (fullScreen) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-background">
                {content}
            </main>
        );
    }

    if (variant === "inline") {
        return content;
    }

    return (
        <div className="flex min-h-40 items-center justify-center">
            {content}
        </div>
    );
}