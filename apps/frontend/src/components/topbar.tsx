"use client";

import {LogOut, Menu, Search, User} from "lucide-react";
import type { Role } from "@/lib/types";
import {useState} from "react";

const roleLabels: Record<Role, string> = {
    MEMBER: "Member",
    VEHICLE_MANAGER: "Vehicle manager",
    ADMIN: "Administrator",
};

type Language = "en" | "cs";

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
    const [language, setLanguage] = useState<Language>("en");

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
                    className="h-9 w-full rounded-md border border-border bg-muted/50 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/10"
                    placeholder="Search vehicles, reservations, members..."
                />
            </div>

            <div className="ml-auto flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setLanguage((current) => (current === "en" ? "cs" : "en"))}
                    className="flex size-7 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-border bg-background shadow-sm transition-transform hover:scale-105"
                    aria-label={language === "en" ? "Switch to Czech" : "Switch to English"}
                    title={language === "en" ? "Switch to Czech" : "Switch to English"}
                >
                    {language === "en" ? <UkFlag/> : <CzFlag/>}
                </button>

                <div className="group relative">
                    <button
                        type="button"
                        className="flex size-9 items-center justify-center rounded-full bg-foreground text-sm font-medium text-background"
                        aria-label="User menu"
                    >
                        {initials}
                    </button>

                    <div className="invisible absolute right-0 top-11 w-56 rounded-md border border-border bg-card p-1 opacity-0 shadow-sm transition-all group-hover:visible group-hover:opacity-100">
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
                            className="flex w-full items-center gap-2 cursor-pointer rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <User className="size-4" />
                            Profile
                        </button>

                        <button
                            type="button"
                            onClick={onLogout}
                            className="flex w-full items-center gap-2 cursor-pointer rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
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

function UkFlag() {
    return (
        <svg
            viewBox="0 0 60 60"
            className="size-full"
            aria-hidden="true"
            focusable="false"
        >
            <defs>
                <clipPath id="uk-flag-circle">
                    <circle cx="30" cy="30" r="30"/>
                </clipPath>
            </defs>

            <g clipPath="url(#uk-flag-circle)">
                <rect width="60" height="60" fill="#012169"/>

                <path d="M0 0L60 60M60 0L0 60" stroke="#FFFFFF" strokeWidth="12"/>
                <path d="M0 0L60 60M60 0L0 60" stroke="#C8102E" strokeWidth="6"/>

                <path d="M30 0V60M0 30H60" stroke="#FFFFFF" strokeWidth="20"/>
                <path d="M30 0V60M0 30H60" stroke="#C8102E" strokeWidth="10"/>
            </g>
        </svg>
    );
}

function CzFlag() {
    return (
        <svg
            viewBox="0 0 60 60"
            className="size-full"
            aria-hidden="true"
            focusable="false"
        >
            <defs>
                <clipPath id="cz-flag-circle">
                    <circle cx="30" cy="30" r="30"/>
                </clipPath>
            </defs>

            <g clipPath="url(#cz-flag-circle)">
                <rect width="60" height="30" y="0" fill="#FFFFFF"/>
                <rect width="60" height="30" y="30" fill="#D7141A"/>
                <path d="M0 0L36 30L0 60Z" fill="#11457E"/>
            </g>
        </svg>
    );
}