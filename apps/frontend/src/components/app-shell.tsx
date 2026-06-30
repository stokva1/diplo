"use client";

import {useState, type ReactNode} from "react";
import {X} from "lucide-react";
import {Logo} from "@/components/logo";
import {SidebarNav} from "@/components/sidebar-nav";
import {Topbar} from "@/components/topbar";
import type {Role} from "@/lib/types";

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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    function closeMobileMenu() {
        setIsMobileMenuOpen(false);
    }

    return (
        <div className="flex min-h-screen bg-background">
            <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex">
                <div className="flex h-16 items-center border-b border-sidebar-border px-5">
                    <Logo/>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <SidebarNav role={role}/>
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

            {isMobileMenuOpen ? (
                <div className="fixed inset-0 z-40 md:hidden">
                    <button
                        type="button"
                        aria-label="Close menu"
                        onClick={closeMobileMenu}
                        className="absolute inset-0 bg-black/45"
                    />

                    <aside className="relative flex h-full w-72 flex-col border-r border-sidebar-border bg-sidebar shadow-xl">
                        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
                            <Logo/>

                            <button
                                type="button"
                                onClick={closeMobileMenu}
                                className="flex size-9 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                aria-label="Close menu"
                            >
                                <X className="size-5"/>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <SidebarNav
                                role={role}
                                onNavigate={closeMobileMenu}
                            />
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
                </div>
            ) : null}

            <div className="flex min-w-0 flex-1 flex-col md:pl-64">
                <Topbar
                    userName={userName}
                    userEmail={userEmail}
                    role={role}
                    onLogout={onLogout}
                    onMenuClick={() => setIsMobileMenuOpen(true)}
                />

                <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
                    {children}
                </main>
            </div>
        </div>
    );
}