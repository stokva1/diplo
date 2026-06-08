"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {
    ArrowRight,
    BookOpenText,
    BriefcaseBusiness,
    CalendarDays,
    Car,
    CheckCircle2,
    MapPin,
    Route,
    TriangleAlert,
} from "lucide-react";
import {apiRequest} from "@/lib/api";
import type {DashboardResponse} from "@/types/api";

export default function DashboardPage() {
    const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadDashboard() {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await apiRequest<DashboardResponse>("/me/dashboard", {
                    token,
                });

                setDashboard(response);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Dashboard could not be loaded.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadDashboard();
    }, []);

    if (isLoading) {
        return (
            <div className="rounded-lg border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
                Loading dashboard...
            </div>
        );
    }

    if (error) {
        return (
            <div
                className="rounded-lg border border-destructive/25 bg-destructive/10 px-5 py-4 text-sm text-destructive">
                {error}
            </div>
        );
    }

    const upcomingReservation = dashboard?.upcomingReservations[0] ?? null;
    const missingTripLog = dashboard?.missingTripLogs[0] ?? null;
    const recentTrips = dashboard?.recentTrips ?? [];

    return (
        <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-7xl flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        Dashboard
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Overview of your reservations, trip logs and recent fleet activity.
                    </p>
                </div>
            </div>

            {missingTripLog ? (
                <div
                    className="flex items-center gap-3 rounded-lg border border-destructive/25 bg-destructive/10 px-3.5 py-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md text-destructive">
                        <TriangleAlert className="size-5"/>
                    </div>

                    <div className="min-w-0 flex-1">
                        <h2 className="text-sm font-semibold text-destructive">
                            Missing trip log
                        </h2>
                        <p className="mt-0 text-xs text-muted-foreground">
                            One reservation is waiting for trip log completion.
                        </p>
                    </div>

                    <Link
                        href={`/reservations/${missingTripLog.reservationId}/trip-log`}
                        className="hidden rounded-md px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10 sm:inline"
                    >
                        Complete
                    </Link>
                </div>
            ) : null}

            <div className="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-12">
                <div className="flex h-full flex-col gap-5 lg:col-span-8">
                    <section
                        className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                        <div className="px-5 pt-5">
                            <h2 className="text-lg font-semibold tracking-tight text-card-foreground">
                                Your nearest upcoming reservation
                            </h2>
                        </div>

                        {upcomingReservation ? (
                            <div className="grid gap-5 px-5 pb-5 pt-5 md:grid-cols-[240px_1fr]">
                                <div>
                                    <div
                                        className="flex aspect-video items-center justify-center rounded-lg border border-border bg-muted">
                                        <Car className="size-6 text-muted-foreground"/>
                                    </div>

                                    <h3 className="mt-4 text-xl font-semibold tracking-tight text-card-foreground">
                                        {upcomingReservation.vehicleName}
                                    </h3>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        License plate: {upcomingReservation.licensePlate}
                                    </p>
                                </div>

                                <div className="flex min-w-0 flex-col gap-5">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <InfoBlock
                                            label="When"
                                            icon={CalendarDays}
                                            value={`${formatDate(upcomingReservation.startAt)}, ${formatTime(
                                                upcomingReservation.startAt,
                                            )}–${formatTime(upcomingReservation.endAt)}`}
                                        />

                                        <InfoBlock
                                            label="Purpose"
                                            icon={BriefcaseBusiness}
                                            value={upcomingReservation.purpose}
                                        />

                                        <div className="sm:col-span-2">
                                            <p className="mb-1.5 text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground">
                                                Route
                                            </p>

                                            <div
                                                className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm text-card-foreground">
                                                <Route className="size-4 text-muted-foreground"/>
                                                <span>{upcomingReservation.origin}</span>
                                                <ArrowRight className="size-4 text-muted-foreground"/>
                                                <MapPin className="size-4 text-muted-foreground"/>
                                                <span>{upcomingReservation.destination}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto flex flex-wrap gap-2 pt-2">
                                        <Link
                                            href={`/reservations/${upcomingReservation.id}`}
                                            className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                                        >
                                            View detail
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <EmptyCard
                                title="No upcoming reservation"
                                description="Create a new reservation when you need a company vehicle."
                                actionHref="/reservations/new"
                                actionLabel="Create reservation"
                            />
                        )}
                    </section>

                    <section
                        className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-4">
                            <div>
                                <h2 className="text-base font-semibold text-card-foreground">
                                    Reservation waiting for completion
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Finished reservations that still need a trip log.
                                </p>
                            </div>

                            {missingTripLog ? (
                                <span
                                    className="inline-flex items-center rounded-full border border-warning/40 bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning-foreground">
                                    Requires action
                                </span>
                            ) : null}
                        </div>

                        {missingTripLog ? (
                            <Link
                                href={`/reservations/${missingTripLog.reservationId}/trip-log`}
                                className="flex flex-col gap-4 p-5 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className="flex size-14 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                                        <BookOpenText className="size-6 text-muted-foreground"/>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-semibold text-card-foreground">
                                            {missingTripLog.vehicleName}
                                        </h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {formatSimpleDate(missingTripLog.date)} ·{" "}
                                            {missingTripLog.origin} → {missingTripLog.destination}
                                        </p>
                                    </div>
                                </div>

                                <span
                                    className="inline-flex h-9 items-center justify-center rounded-lg border border-primary px-3 text-sm font-medium text-primary transition-colors hover:bg-muted">
                                    Complete trip log
                                </span>
                            </Link>
                        ) : (
                            <EmptyCard
                                title="Everything is complete"
                                description="There are no reservations waiting for trip log completion."
                            />
                        )}
                    </section>
                </div>

                <aside className="flex h-full flex-col lg:col-span-4">
                    <section
                        className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                        <div className="px-5 pt-4 pb-4 border-b border-border bg-muted/30">
                            <h2 className="text-lg font-semibold tracking-tight text-card-foreground">
                                Recent trips
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Latest completed trip log records.
                            </p>
                        </div>

                        <div className="flex flex-1 flex-col">
                            {recentTrips.length > 0 ? (
                                <div className="divide-y divide-border">
                                    {recentTrips.map((trip) => (
                                        <Link
                                            key={trip.tripLogId}
                                            href={`/trip-logs/${trip.tripLogId}`}
                                            className="block p-4 transition-colors hover:bg-muted/40"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-card-foreground">
                                                        {trip.vehicleName}
                                                    </p>
                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        {trip.origin} → {trip.destination}
                                                    </p>
                                                </div>

                                                <p className="shrink-0 text-xs text-muted-foreground">
                                                    {formatSimpleDate(trip.date)}
                                                </p>
                                            </div>

                                            <div
                                                className="mt-3 flex items-center gap-2 text-xs font-medium text-success">
                                                <CheckCircle2 className="size-4"/>
                                                Trip log completed · {trip.distanceKm} km
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-1 items-center justify-center">
                                    <EmptyCard
                                        title="No recent trips"
                                        description="Completed trip logs will appear here."
                                    />
                                </div>
                            )}

                            <div className="mt-auto p-5 pt-3">
                                <Link
                                    href="/trip-logs"
                                    className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
                                >
                                    View all
                                </Link>
                            </div>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
}

function InfoBlock({
                       label,
                       value,
                       icon:
                           Icon,
                   }: {
    label: string;
    value: string;
    icon: typeof CalendarDays;
}) {
    return (
        <div>
            <p className="mb-1.5 text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground">
                {label}
            </p>
            <div className="flex items-center gap-2 text-sm text-card-foreground">
                <Icon className="size-4 shrink-0 text-muted-foreground"/>
                <span className="min-w-0 truncate">{value}</span>
            </div>
        </div>
    );
}

function EmptyCard({
                       title,
                       description,
                       actionHref,
                       actionLabel,
                   }: {
    title: string;
    description: string;
    actionHref?: string;
    actionLabel?: string;
}) {
    return (
        <div className="p-5">
            <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center">
                <p className="text-sm font-medium text-card-foreground">{title}</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                    {description}
                </p>

                {actionHref && actionLabel ? (
                    <Link
                        href={actionHref}
                        className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
                    >
                        {actionLabel}
                    </Link>
                ) : null}
            </div>
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

function formatSimpleDate(value: string) {
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
}