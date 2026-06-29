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
    Pencil,
    TriangleAlert,
    User,
    XCircle,
} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {EmptyState} from "@/components/EmptyState";
import {Alert} from "@/components/Alert";
import {LoadingState} from "@/components/LoadingState";
import {PageHeader} from "@/components/PageHeader";
import {StatusBadge} from "@/components/StatusBadge";
import {formatDateTime, formatDateTimeRange} from "@/lib/date";
import {formatKm} from "@/lib/format";

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

const reservationStatusLabels: Record<ReservationStatus, string> = {
    ACTIVE: "Active",
    FINISHED: "Finished",
    CANCELLED: "Cancelled",
};

const reservationStatusVariants: Record<
    ReservationStatus,
    "info" | "success" | "muted"
> = {
    ACTIVE: "info",
    FINISHED: "success",
    CANCELLED: "muted",
};

export default function ReservationDetailPage() {
    const params = useParams<{ reservationId: string }>();
    const router = useRouter();

    const reservationId = params.reservationId;

    const [reservation, setReservation] = useState<ReservationDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
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

            setShowCancelConfirm(false);
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
        return <LoadingState label="Loading reservation..."/>;
    }

    if (error && !reservation) {
        return (
            <div className="mx-auto max-w-7xl">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4"/>
                    Back
                </button>

                <Alert variant="error">
                    {error}
                </Alert>
            </div>
        );
    }

    if (!reservation) {
        return null;
    }

    const canCancel = canCancelReservation(reservation);
    const canEdit = canCancelReservation(reservation);
    const canReportIssue = reservation.status !== "CANCELLED";

    return (
        <div className="mx-auto max-w-7xl">
            <button
                type="button"
                onClick={() => router.back()}
                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
                <ArrowLeft className="size-4"/>
                Back
            </button>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <PageHeader
                    title="Reservation detail"
                    description={`${reservation.vehicle.name} · ${reservation.vehicle.licensePlate}`}
                />

                <div className="flex shrink-0 items-center gap-2 sm:pt-8">
                    <StatusBadge
                        size="md"
                        variant={reservationStatusVariants[reservation.status]}
                    >
                        {reservationStatusLabels[reservation.status]}
                    </StatusBadge>

                    {canEdit ? (
                        <Link
                            href={`/reservations/${reservation.id}/edit`}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                        >
                            <Pencil className="size-4"/>
                            Edit
                        </Link>
                    ) : null}
                </div>
            </div>

            {error ? (
                <Alert variant="error" className="mb-4">
                    {error}
                </Alert>
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
                                value={formatDateTimeRange(reservation.startAt, reservation.endAt)}
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
                                        onClick={() => setShowCancelConfirm(true)}
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
                <section
                    className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
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
                                        Completed {formatDateTime(reservation.tripLog.completedAt)}
                                    </p>

                                    {reservation.tripLog.distanceKm != null ? (
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Distance: {formatKm(reservation.tripLog.distanceKm)}
                                        </p>
                                    ) : null}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-1 items-center justify-center p-5">
                                <EmptyState
                                    title="No trip log yet"
                                    description="The trip log can be completed after the reservation ends."
                                    action={
                                        reservation.status === "FINISHED" ? (
                                            <Link
                                                href={`/reservations/${reservation.id}/trip-log`}
                                                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
                                            >
                                                <FileText className="size-4"/>
                                                Complete trip log
                                            </Link>
                                        ) : undefined
                                    }
                                />
                            </div>
                        )}
                    </div>
                </section>

                <section
                    className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
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
                            <span
                                className="inline-flex items-center rounded-full border border-warning/40 bg-warning/15 px-2.5 py-0.5 text-xs font-medium text-warning-foreground">
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
                                            <StatusBadge variant={issue.status === "OPEN" ? "warning" : "success"}>
                                                {issue.status === "OPEN" ? "Open" : "Resolved"}
                                            </StatusBadge>
                                        </div>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {formatDateTime(issue.createdAt)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-1 items-center justify-center p-5">
                                <EmptyState
                                    title="No issues reported"
                                    description="Any vehicle problems connected to this trip will appear here."
                                />
                            </div>
                        )}
                    </div>
                </section>
            </div>
            {showCancelConfirm ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="cancel-reservation-title"
                >
                    <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
                        <div className="flex items-start gap-3">
                            <div
                                className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                                <XCircle className="size-5 text-destructive"/>
                            </div>

                            <div>
                                <h2
                                    id="cancel-reservation-title"
                                    className="text-base font-semibold text-card-foreground"
                                >
                                    Cancel reservation?
                                </h2>

                                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                                    This reservation for {reservation.vehicle.name} will be
                                    cancelled and the vehicle will become available again.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowCancelConfirm(false)}
                                disabled={isCancelling}
                                className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Keep reservation
                            </button>

                            <button
                                type="button"
                                onClick={handleCancelReservation}
                                disabled={isCancelling}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <XCircle className="size-4"/>
                                {isCancelling ? "Cancelling..." : "Cancel reservation"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
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

function canCancelReservation(reservation: ReservationDetail) {
    if (reservation.status !== "ACTIVE") {
        return false;
    }

    return new Date(reservation.startAt).getTime() > Date.now();
}