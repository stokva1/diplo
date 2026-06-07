"use client";

import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { SidebarNav } from "@/components/sidebar-nav";
import { Topbar } from "@/components/topbar";
import type { Role } from "@/lib/types";

export function AppShell({
                             children,
                             role,
                             organizationName,
                             userName,
                             userEmail,
                             onLogout,
                         }: {
    children: ReactNode;
    role: Role;
    organizationName?: string;
    userName?: string;
    userEmail?: string;
    onLogout: () => void;
}) {
    return (
        <div className="flex min-h-screen bg-background">
            <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex">
                <div className="flex h-16 items-center border-b border-sidebar-border px-5">
                    <Logo />
                </div>

                <div className="flex-1 overflow-y-auto">
                    <SidebarNav role={role} />
                </div>

                <div className="border-t border-sidebar-border p-4">
                    <p className="truncate text-xs text-sidebar-foreground/50">
                        {organizationName}
                    </p>
                    <p className="text-[0.7rem] text-sidebar-foreground/35">
                        FleetCore workspace
                    </p>
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col md:pl-64">
                <Topbar
                    userName={userName}
                    userEmail={userEmail}
                    role={role}
                    onLogout={onLogout}
                />

                <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
                    {children}
                </main>
            </div>
        </div>
    );
}