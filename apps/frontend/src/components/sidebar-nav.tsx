"use client";

import Link from "next/link";
import {usePathname} from "next/navigation";
import {
    CalendarDays,
    BookOpenText,
    TriangleAlert,
    Car,
    Users,
    Settings,
    House,
    type LucideIcon,
} from "lucide-react";
import {cn} from "@/lib/utils";
import type {Role} from "@/lib/types";

interface NavItem {
    href: string;
    label: string;
    icon: LucideIcon;
    roles: Role[];
}

interface NavSection {
    title: string;
    items: NavItem[];
}

const sections: NavSection[] = [
    {
        title: "Workspace",
        items: [
            {
                href: "/dashboard",
                label: "Dashboard",
                icon: House,
                roles: ["MEMBER", "VEHICLE_MANAGER", "ADMIN"],
            },
            {
                href: "/reservations",
                label: "Reservations",
                icon: CalendarDays,
                roles: ["MEMBER", "VEHICLE_MANAGER", "ADMIN"],
            },
            {
                href: "/trip-logs",
                label: "Trip logs",
                icon: BookOpenText,
                roles: ["MEMBER", "VEHICLE_MANAGER", "ADMIN"],
            },
        ],
    },
    {
        title: "Vehicle management",
        items: [
            {
                href: "/manage/vehicles",
                label: "Managed vehicles",
                icon: Car,
                roles: ["VEHICLE_MANAGER", "ADMIN"],
            },
            {
                href: "/issues",
                label: "Issues",
                icon: TriangleAlert,
                roles: ["VEHICLE_MANAGER", "ADMIN"],
            },
        ],
    },
    {
        title: "Administration",
        items: [
            {
                href: "/admin/vehicles",
                label: "All vehicles",
                icon: Car,
                roles: ["ADMIN"],
            },
            {
                href: "/admin/reservations",
                label: "All reservations",
                icon: CalendarDays,
                roles: ["ADMIN"],
            },
            {
                href: "/admin/trip-logs",
                label: "All trip logs",
                icon: BookOpenText,
                roles: ["ADMIN"],
            },
            {
                href: "/admin/issues",
                label: "All issues",
                icon: TriangleAlert,
                roles: ["ADMIN"],
            },
            {
                href: "/admin/users",
                label: "Members",
                icon: Users,
                roles: ["ADMIN"],
            },
            {
                href: "/admin/settings",
                label: "Organization settings",
                icon: Settings,
                roles: ["ADMIN"],
            },
        ],
    },
];

export function SidebarNav({
                               role,
                               organizationName,
                               onNavigate,
                           }: {
    role: Role;
    organizationName?: string;
    onNavigate?: () => void;
}) {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === "/dashboard") {
            return pathname === "/dashboard";
        }

        if (href === "/reservations") {
            return pathname === "/reservations";
        }

        return pathname === href || pathname.startsWith(`${href}/`);
    };

    return (
        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-4">
            {sections.map((section) => {
                const visible = section.items.filter((item) =>
                    item.roles.includes(role),
                );

                if (visible.length === 0) {
                    return null;
                }

                return (
                    <div key={section.title} className="flex flex-col gap-1">
                        <p className="px-3 pb-1 text-[0.68rem] font-medium uppercase tracking-wider text-sidebar-foreground/50">
                            {section.title}
                        </p>

                        {visible.map((item) => {
                            const active = isActive(item.href);
                            const Icon = item.icon;

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={onNavigate}
                                    className={cn(
                                        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                                        active
                                            ? "bg-sidebar-primary font-medium text-sidebar-primary-foreground"
                                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                    )}
                                >
                                    <Icon className="size-4 shrink-0"/>
                                    <span className="truncate">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                );
            })}
        </nav>
    );
}