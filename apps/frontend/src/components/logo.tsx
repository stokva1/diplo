import { Car } from "lucide-react";

export function Logo({ light = true }: { light?: boolean }) {
    return (
        <div className="flex items-center gap-2.5">
            <div
                className={
                    light
                        ? "flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground"
                        : "flex size-8 items-center justify-center rounded-md bg-foreground text-background"
                }
            >
                <Car className="size-4.5" />
            </div>

            <div className="flex flex-col leading-none">
                <span
                    className={
                        light
                            ? "text-sm font-semibold text-sidebar-foreground"
                            : "text-sm font-semibold text-foreground"
                    }
                >
                    FleetCore
                </span>
                <span className="text-[0.65rem] text-sidebar-foreground/50">
                    Fleet management
                </span>
            </div>
        </div>
    );
}