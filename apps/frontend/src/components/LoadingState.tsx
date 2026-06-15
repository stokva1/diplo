import { cn } from "@/lib/utils";

export function LoadingState({
                                 label = "Loading...",
                                 fullScreen = false,
                                 className,
                             }: {
    label?: string;
    fullScreen?: boolean;
    className?: string;
}) {
    const content = (
        <div className={cn("rounded-lg border border-border bg-card px-5 py-4 text-sm text-muted-foreground shadow-sm", className)}>
            {label}
        </div>
    );

    if (fullScreen) {
        return <main className="flex min-h-screen items-center justify-center bg-background">{content}</main>;
    }

    return <div className="flex min-h-40 items-center justify-center">{content}</div>;
}
