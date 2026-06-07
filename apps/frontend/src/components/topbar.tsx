"use client";

import { Bell, LogOut, Menu, Search, User } from "lucide-react";
import type { Role } from "@/lib/types";

const roleLabels: Record<Role, string> = {
    MEMBER: "Member",
    VEHICLE_MANAGER: "Vehicle manager",
    ADMIN: "Administrator",
};

export function Topbar({
                           userName,
                           userEmail,
                           role,
                           onLogout,
                       }: {
    userName?: string;
    userEmail?: string;
    role: Role;
    onLogout: () => void;
}) {
    const initials = getInitials(userName);

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:px-6">
            <button
                type="button"
                className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
                aria-label="Open menu"
            >
                <Menu className="size-5" />
            </button>

            <div className="relative hidden max-w-sm flex-1 sm:block">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    className="h-9 w-full rounded-[8px] border border-border bg-muted/50 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/10"
                    placeholder="Search vehicles, reservations, members..."
                />
            </div>

            <div className="ml-auto flex items-center gap-2">
                <button
                    type="button"
                    className="relative flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Notifications"
                >
                    <Bell className="size-5" />
                    <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive" />
                </button>

                <div className="group relative">
                    <button
                        type="button"
                        className="flex size-9 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background"
                        aria-label="User menu"
                    >
                        {initials}
                    </button>

                    <div className="invisible absolute right-0 top-11 w-56 rounded-[8px] border border-border bg-card p-1 opacity-0 shadow-sm transition-all group-hover:visible group-hover:opacity-100">
                        <div className="px-3 py-2">
                            <p className="truncate text-sm font-medium text-card-foreground">
                                {userName}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                                {userEmail}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {roleLabels[role]}
                            </p>
                        </div>

                        <div className="my-1 h-px bg-border" />

                        <button
                            type="button"
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <User className="size-4" />
                            Profile
                        </button>

                        <button
                            type="button"
                            onClick={onLogout}
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <LogOut className="size-4" />
                            Sign out
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}

function getInitials(name?: string) {
    if (!name) {
        return "U";
    }

    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}