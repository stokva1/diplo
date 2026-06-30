"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { AppShell } from "@/components/app-shell";
import type { Role } from "@/lib/types";
import type { MeResponse } from "@/types/api";
import {LoadingState} from "@/components/LoadingState";
import {clearAuthTokens} from "@/lib/auth";

export default function ProtectedAppLayout({
                                               children,
                                           }: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    const [me, setMe] = useState<MeResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadMe() {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                setIsLoading(false);
                router.replace("/login");
                return;
            }

            try {
                const meResponse = await apiRequest<MeResponse>("/me", {
                    token,
                });

                setMe(meResponse);
            } catch {
                clearAuthTokens();
                router.replace("/login");
            } finally {
                setIsLoading(false);
            }
        }

        loadMe();
    }, [router]);

    if (isLoading) {
        return <LoadingState fullScreen />;
    }

    if (!me) {
        return null;
    }

    function handleLogout() {
        clearAuthTokens();
        router.replace("/login");
    }

    return (
        <AppShell
            role={getSidebarRole(me.member)}
            organizationName={me.organization.name}
            userName={me.user.name}
            userEmail={me.user.email}
            onLogout={handleLogout}
        >
            {children}
        </AppShell>
    );
}

function getSidebarRole(member: {
    role: "ADMIN" | "MEMBER";
    managedVehicleIds: string[];
}): Role {
    if (member.role === "ADMIN") {
        return "ADMIN";
    }

    if (member.managedVehicleIds.length > 0) {
        return "VEHICLE_MANAGER";
    }

    return "MEMBER";
}

