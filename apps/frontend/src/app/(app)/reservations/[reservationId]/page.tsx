"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {
    ArrowLeft,
    CalendarDays,
    Car,
    FileText,
    MapPin,
    TriangleAlert,
    User,
    XCircle,
} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {cn} from "@/lib/utils";

type ReservationStatus = "ACTIVE" | "CANCELLED" | "FINISHED";

type TripLogSummary = {
    id: string;
    completedAt: string;
    distanceKm?: number;
} | null;

type IssueSummary = {
    id: string;
    description: string;
    status: "OPEN" | "RESOLVED";
    createdAt: string;
};

type ReservationDetail = {
    id: string;
    vehicle: {
        id: string;
        name: string;
        licensePlate: string;
    };
    member: {
        id: string;
        name: string;
    };
    startAt: string;
    endAt: string;
    origin: string;
    destination: string;
    purpose: string;
    status: ReservationStatus;
    tripLog: TripLogSummary;
    issues: IssueSummary[];
};

type CancelReservationResponse = {
    id: string;
    status: "CANCELLED";
    cancelledAt: string;
};

export default function ReservationDetailPage() {
    const params = useParams<{ reservationId: string }>();
    const router = useRouter();

    const reservationId = params.reservationId;

    const [reservation, setReservation] = useState<ReservationDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadReservation() {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const response = await apiRequest<ReservationDetail>(
                    `/reservations/${reservationId}`,
                    {token},
                );

                setReservation(response);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Reservation could not be loaded.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadReservation();
    }, [reservationId]);

    async function handleCancelReservation() {
        if (!reservation) {
            return;
        }

        const confirmed = window.confirm(
            "Are you sure you want to cancel this reservation?",
        );

        if (!confirmed) {
            return;
        }

        const token = localStorage.getItem("accessToken");

        if (!token) {
            setError("You need to be signed in to cancel a reservation.");
            return;
        }

        setIsCancelling(true);
        setError(null);

        try {
            await apiRequest<CancelReservationResponse>(
                `/reservations/${reservation.id}/cancel`,
                {
                    token,
                    method: "POST",
                },
            );

            setReservation({
                ...reservation,
                status: "CANCELLED",
            });
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Reservation could not be cancelled.",
            );
        } finally {
            setIsCancelling(false);
        }
    }

    if (isLoading) {
        return (
            <div className="mx-auto max-w-5xl">
                <div className="rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground shadow-sm">
                    Loading reservation...
                </div>
            </div>
        );
    }

    if (error && !reservation) {
        return (
            <div className="mx-auto max-w-5xl">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4"/>
                    Back
                </button>

                <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-5 py-4 text-sm text-destructive">
                    {error}
                </div>
            </div>
        );
    }

    if (!reservation) {
        return null;
    }

    const canCancel = canCancelReservation(reservation);
    const canReportIssue = reservation.status !== "CANCELLED";

    return (
        <div className="mx-auto max-w-5xl">
            <button
                type="button"
                onClick={() => router.back()}
                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
                <ArrowLeft className="size-4"/>
                Back
            </button>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        Reservation detail
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        {reservation.vehicle.name} · {reservation.vehicle.licensePlate}
                    </p>
                </div>

                <div className="sm:pt-8">
                    <StatusBadge status={reservation.status}/>
                </div>
            </div>

            {error ? (
                <div className="mb-4 rounded-xl border border-destructive/25 bg-destructive/10 px-5 py-4 text-sm text-destructive">
                    {error}
                </div>
            ) : null}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <section className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-card-foreground">
                            Trip details
                        </h2>
                    </div>

                    <div className="p-5">
                        <dl className="grid min-w-0 grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                            <Detail
                                icon={CalendarDays}
                                label="When"
                                value={formatDateRange(reservation.startAt, reservation.endAt)}
                                description={formatTimeRange(reservation.startAt, reservation.endAt)}
                            />

                            <Detail
                                icon={User}
                                label="Booked by"
                                value={reservation.member.name}
                            />

                            <Detail
                                icon={MapPin}
                                label="Origin"
                                value={reservation.origin}
                            />

                            <Detail
                                icon={MapPin}
                                label="Destination"
                                value={reservation.destination}
                            />

                            <div className="min-w-0 sm:col-span-2">
                                <Detail
                                    icon={FileText}
                                    label="Purpose"
                                    value={reservation.purpose}
                                />
                            </div>
                        </dl>
                    </div>
                </section>

                <section className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-card-foreground">
                            Vehicle
                        </h2>
                    </div>

                    <div className="p-5">
                        <Link
                            href={`/vehicles/${reservation.vehicle.id}`}
                            className="flex min-w-0 items-center gap-3 rounded-lg transition-colors hover:bg-muted/40"
                        >
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-muted">
                                <Car className="size-5 text-muted-foreground"/>
                            </div>

                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-card-foreground">
                                    {reservation.vehicle.name}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                    {reservation.vehicle.licensePlate}
                                </p>
                            </div>
                        </Link>

                        {(canReportIssue || canCancel) ? (
                            <div className="mt-5 flex flex-col gap-2 border-t border-border pt-4">
                                {canReportIssue ? (
                                    <Link
                                        href={`/reservations/${reservation.id}/issues/new`}
                                        className="inline-flex h-9 w-full items-center justify-start gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/15"
                                    >
                                        <TriangleAlert className="size-4"/>
                                        Report issue
                                    </Link>
                                ) : null}

                                {canCancel ? (
                                    <button
                                        type="button"
                                        onClick={handleCancelReservation}
                                        disabled={isCancelling}
                                        className="inline-flex h-9 w-full items-center justify-start gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <XCircle className="size-4"/>
                                        {isCancelling ? "Cancelling..." : "Cancel reservation"}
                                    </button>
                                ) : null}
                            </div>
                        ) : null}
                    </div>
                </section>
            </div>

            <div className="mt-6 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[1.1fr_0.9fr]">
                <section className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <div className="flex items-center justify-between border-b border-border px-5 py-4">
                        <div>
                            <h2 className="text-base font-semibold text-card-foreground">
                                Trip log
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Mileage and refueling details after the trip.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-1 flex-col">
                        {reservation.tripLog ? (
                            <div className="p-5">
                                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                                    <p className="text-sm font-medium text-card-foreground">
                                        Completed {formatSimpleDateTime(reservation.tripLog.completedAt)}
                                    </p>

                                    {reservation.tripLog.distanceKm != null ? (
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Distance: {formatKm(reservation.tripLog.distanceKm)}
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-1 p-5">
                                <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center">
                                    <p className="text-sm font-medium text-card-foreground">
                                        No trip log yet
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        The trip log can be completed after the reservation ends.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <section className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <div className="flex items-center justify-between border-b border-border px-5 py-4">
                        <div>
                            <h2 className="text-base font-semibold text-card-foreground">
                                Reported issues
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Problems connected to this reservation.
                            </p>
                        </div>

                        {reservation.issues.length > 0 ? (
                            <span className="inline-flex items-center rounded-full border border-warning/40 bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning-foreground">
                    {reservation.issues.length}
                </span>
                        ) : null}
                    </div>

                    <div className="flex flex-1 flex-col">
                        {reservation.issues.length > 0 ? (
                            <div className="divide-y divide-border">
                                {reservation.issues.map((issue) => (
                                    <div key={issue.id} className="px-5 py-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="line-clamp-2 break-words text-sm font-medium text-card-foreground">
                                                {issue.description}
                                            </p>
                                            <IssueStatusBadge status={issue.status}/>
                                        </div>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {formatSimpleDateTime(issue.createdAt)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-1 p-5">
                                <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background px-4 py-6 text-center">
                                    <p className="text-sm font-medium text-card-foreground">
                                        No issues reported
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Any vehicle problems connected to this trip will appear here.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

function Detail({
                    icon: Icon,
                    label,
                    value,
                    description,
                }: {
    icon: React.ElementType;
    label: string;
    value: string;
    description?: string;
}) {
    return (
        <div className="flex min-w-0 items-start gap-2.5">
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground"/>

            <div className="min-w-0">
                <dt className="text-xs text-muted-foreground">
                    {label}
                </dt>
                <dd className="mt-0.5 break-words text-sm font-medium text-card-foreground">
                    {value}
                </dd>

                {description ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {description}
                    </p>
                ) : null}
            </div>
        </div>
    );
}

function StatusBadge({status,}: { status: ReservationStatus; }) {
    const labelByStatus: Record<ReservationStatus, string> = {
        ACTIVE: "Active",
        FINISHED: "Finished",
        CANCELLED: "Cancelled",
    };

    return (
        <span
            className={cn(
                "inline-flex w-fit items-center rounded-full border px-3 py-1 text-sm font-medium ",
                status === "ACTIVE" && "border-info/25 bg-info/10 text-info",
                status === "FINISHED" && "border-success/25 bg-success/10 text-success",
                status === "CANCELLED" &&
                "border-muted bg-muted text-muted-foreground",
            )}
        >
            {labelByStatus[status]}
        </span>
    );
}

function IssueStatusBadge({status}: { status: "OPEN" | "RESOLVED" }) {
    return (
        <span
            className={cn(
                "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                status === "OPEN" && "border-warning/40 bg-warning/15 text-warning-foreground",
                status === "RESOLVED" && "border-success/25 bg-success/10 text-success",
            )}
        >
            {status === "OPEN" ? "Open" : "Resolved"}
        </span>
    );
}

function canCancelReservation(reservation: ReservationDetail) {
    if (reservation.status !== "ACTIVE") {
        return false;
    }

    return new Date(reservation.startAt).getTime() > Date.now();
}

function formatDateRange(startValue: string, endValue: string) {
    if (isSameCalendarDay(startValue, endValue)) {
        return formatSimpleDate(startValue);
    }

    return `${formatSimpleDate(startValue)} – ${formatSimpleDate(endValue)}`;
}

function formatTimeRange(startValue: string, endValue: string) {
    if (isSameCalendarDay(startValue, endValue)) {
        return `${formatTime(startValue)}–${formatTime(endValue)}`;
    }

    return `${formatShortDateTime(startValue)} – ${formatShortDateTime(endValue)}`;
}

function formatSimpleDate(value: string) {
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
}

function formatSimpleDateTime(value: string) {
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function formatShortDateTime(value: string) {
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function formatTime(value: string) {
    return new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function formatKm(value: number) {
    return `${new Intl.NumberFormat("en-GB").format(value)} km`;
}

function isSameCalendarDay(startValue: string, endValue: string) {
    const start = new Date(startValue);
    const end = new Date(endValue);

    return (
        start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth() &&
        start.getDate() === end.getDate()
    );
}