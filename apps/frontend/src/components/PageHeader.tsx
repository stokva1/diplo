import { cn } from "@/lib/utils";

export function PageHeader({
                               title,
                               description,
                               className,
                           }: {
    title: string;
    description?: string;
    className?: string;
}) {
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