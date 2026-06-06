"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { DashboardResponse, MeResponse } from "@/types/api";

export default function DashboardPage() {
    const router = useRouter();

    const [me, setMe] = useState<MeResponse | null>(null);
    const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadDashboard() {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                router.replace("/login");
                return;
            }

            try {
                const [meResponse, dashboardResponse] = await Promise.all([
                    apiRequest<MeResponse>("/me", {
                        token,
                    }),
                    apiRequest<DashboardResponse>("/me/dashboard", {
                        token,
                    }),
                ]);

                setMe(meResponse);
                setDashboard(dashboardResponse);
            } catch (error) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");

                setError(
                    error instanceof Error
                        ? error.message
                        : "Dashboard could not be loaded.",
                );

                router.replace("/login");
            } finally {
                setIsLoading(false);
            }
        }

        loadDashboard();
    }, [router]);

    function handleLogout() {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        router.replace("/login");
    }

    if (isLoading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-background">
                <div className="rounded-lg border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
                    Loading...
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-background">
                <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-5 py-4 text-sm text-destructive">
                    {error}
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background">
            <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
                <header className="mb-6 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">
                            {me?.organization.name}
                        </p>
                        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                            Dashboard
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Welcome back, {me?.user.name}.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                        Sign out
                    </button>
                </header>

                <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <DashboardStatCard
                        label="Upcoming reservations"
                        value={dashboard?.upcomingReservations.length ?? 0}
                        description="Active and upcoming trips"
                    />
                    <DashboardStatCard
                        label="Missing trip logs"
                        value={dashboard?.missingTripLogs.length ?? 0}
                        description="Reservations waiting for completion"
                    />
                    <DashboardStatCard
                        label="Recent trips"
                        value={dashboard?.recentTrips.length ?? 0}
                        description="Recently completed trip logs"
                    />
                </section>

                <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="rounded-lg border border-border bg-card lg:col-span-2">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-card-foreground">
                                Upcoming reservations
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Your planned vehicle reservations.
                            </p>
                        </div>

                        <div className="p-3">
                            {dashboard?.upcomingReservations.length ? (
                                <div className="space-y-1">
                                    {dashboard.upcomingReservations.map((reservation) => (
                                        <div
                                            key={reservation.id}
                                            className="rounded-md px-3 py-3 transition-colors hover:bg-muted/60"
                                        >
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-card-foreground">
                                                        {reservation.vehicleName}
                                                    </p>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {reservation.licensePlate} · {reservation.origin} →{" "}
                                                        {reservation.destination}
                                                    </p>
                                                </div>

                                                <div className="text-xs text-muted-foreground sm:text-right">
                                                    <p>{formatDate(reservation.startAt)}</p>
                                                    <p>
                                                        {formatTime(reservation.startAt)}–
                                                        {formatTime(reservation.endAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState text="No upcoming reservations." />
                            )}
                        </div>
                    </div>

                    <div className="rounded-lg border border-border bg-card">
                        <div className="border-b border-border px-5 py-4">
                            <h2 className="text-base font-semibold text-card-foreground">
                                Missing trip logs
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Trips that need to be completed.
                            </p>
                        </div>

                        <div className="p-3">
                            {dashboard?.missingTripLogs.length ? (
                                <div className="space-y-1">
                                    {dashboard.missingTripLogs.map((tripLog) => (
                                        <div
                                            key={tripLog.reservationId}
                                            className="rounded-md px-3 py-3 transition-colors hover:bg-muted/60"
                                        >
                                            <p className="text-sm font-medium text-card-foreground">
                                                {tripLog.vehicleName}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {tripLog.date} · {tripLog.origin} →{" "}
                                                {tripLog.destination}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState text="No missing trip logs." />
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}

function DashboardStatCard(props: {
    label: string;
    value: number;
    description: string;
}) {
    return (
        <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground">{props.label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-card-foreground">
                {props.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
                {props.description}
            </p>
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            {text}
        </div>
    );
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
}

function formatTime(value: string) {
    return new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}