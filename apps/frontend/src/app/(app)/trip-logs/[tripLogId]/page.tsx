"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {
    ArrowLeft,
    CalendarDays,
    Car,
    CheckCircle2,
    FileText,
    Fuel,
    Gauge,
    MapPin, Pencil,
} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {Alert} from "@/components/Alert";
import {LoadingState} from "@/components/LoadingState";
import {PageHeader} from "@/components/PageHeader";
import {formatDateTime, formatDateTimeRange} from "@/lib/date";
import {formatCurrency, formatKm} from "@/lib/format";
import {MeResponse} from "@/types/api";
import {FileDownloadButton} from "@/components/FileDownloadButton";

type TripLogDetail = {
    id: string;
    reservationId: string;
    vehicle: {
        id: string;
        name: string;
        licensePlate: string;
    };
    member: {
        id: string;
        name: string;
        email?: string;
    };
    completedBy: {
        id: string;
        name: string;
        email?: string;
    };
    startAt: string;
    endAt: string;
    origin: string;
    destination: string;
    purpose: string;
    odometerStartKm: number;
    odometerEndKm: number;
    distanceKm: number;
    refueled: boolean;
    refuelingCost?: number | null;
    refuelingReceiptFile?: {
        id: string;
        fileName: string;
    } | null;
    note?: string | null;
    completedAt: string;
    updatedAt: string;
};

export default function TripLogDetailPage() {
    const params = useParams<{ tripLogId: string }>();
    const router = useRouter();

    const tripLogId = params.tripLogId;

    const [tripLog, setTripLog] = useState<TripLogDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        async function loadTripLog() {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                setIsLoading(false);
                router.replace("/login");
                return;
            }

            try {
                const [tripLogResponse, meResponse] = await Promise.all([
                    apiRequest<TripLogDetail>(
                        `/trip-logs/${tripLogId}`,
                        {token},
                    ),
                    apiRequest<MeResponse>("/me", {token}),
                ]);

                setTripLog(tripLogResponse);
                setIsAdmin(meResponse.member.role === "ADMIN");
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Trip log could not be loaded.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadTripLog();
    }, [router, tripLogId]);

    if (isLoading) {
        return <LoadingState label="Loading trip log..."/>;
    }

    if (error && !tripLog) {
        return (
            <div className="mx-auto max-w-3xl">
                <Link
                    href="/trip-logs"
                    className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4"/>
                    Back to trip logs
                </Link>

                <Alert variant="error">{error}</Alert>
            </div>
        );
    }

    if (!tripLog) {
        return null;
    }

    return (
        <div className="mx-auto max-w-3xl">
            <button
                type="button"
                onClick={() => router.back()}
                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
                <ArrowLeft className="size-4"/>
                Back
            </button>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <PageHeader
                    title="Trip log details"
                    description="Recorded mileage, refueling and trip information."
                />

                {isAdmin ? (
                    <Link
                        href={`/trip-logs/${tripLog.id}/edit`}
                        className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                        <Pencil className="size-4"/>
                        Edit
                    </Link>
                ) : null}
            </div>

            {error ? (
                <Alert variant="error" className="mb-5">
                    {error}
                </Alert>
            ) : null}

            <section className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Car className="size-5 text-muted-foreground"/>
                    </div>

                    <div className="min-w-0 flex-1">
                        <Link
                            href={`/vehicles/${tripLog.vehicle.id}`}
                            className="block truncate text-sm font-semibold text-card-foreground hover:underline"
                        >
                            {tripLog.vehicle.name}
                        </Link>

                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {tripLog.vehicle.licensePlate}
                        </p>

                        <div className="mt-2 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="size-3.5 shrink-0"/>

                            <div
                                className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5">
                                <span
                                    title={tripLog.origin}
                                    className="truncate"
                                >
                                    {tripLog.origin}
                                </span>

                                <span>→</span>

                                <span
                                    title={tripLog.destination}
                                    className="truncate text-right"
                                >
                                    {tripLog.destination}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 text-left sm:w-64 sm:text-right">
                        <p className="text-sm font-medium text-card-foreground">
                            {formatDateTimeRange(
                                tripLog.startAt,
                                tripLog.endAt,
                            )}
                        </p>
                    </div>
                </div>
            </section>

            <div className="space-y-6">
                <section className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                                <CalendarDays className="size-5 text-muted-foreground"/>
                            </div>

                            <div>
                                <h2 className="text-base font-semibold text-card-foreground">
                                    Trip details
                                </h2>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    Reservation and trip information.
                                </p>
                            </div>
                        </div>
                    </div>

                    <dl className="divide-y divide-border px-5">
                        <DetailRow
                            label="Purpose"
                            value={tripLog.purpose}
                        />

                        <DetailRow
                            label="Driver"
                            value={tripLog.member.name}
                        />

                        <DetailRow
                            label="Time window"
                            value={formatDateTimeRange(
                                tripLog.startAt,
                                tripLog.endAt,
                            )}
                        />
                    </dl>
                </section>

                <section className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                                <Gauge className="size-5 text-muted-foreground"/>
                            </div>

                            <div>
                                <h2 className="text-base font-semibold text-card-foreground">
                                    Mileage
                                </h2>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    Recorded odometer readings and calculated distance.
                                </p>
                            </div>
                        </div>
                    </div>

                    <dl className="divide-y divide-border px-5">
                        <DetailRow
                            label="Starting odometer"
                            value={formatKm(tripLog.odometerStartKm)}
                        />

                        <DetailRow
                            label="Ending odometer"
                            value={formatKm(tripLog.odometerEndKm)}
                        />

                        <DetailRow
                            label="Distance"
                            value={formatKm(tripLog.distanceKm)}
                            emphasized
                        />
                    </dl>
                </section>

                <section className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                                <Fuel className="size-5 text-muted-foreground"/>
                            </div>

                            <div>
                                <h2 className="text-base font-semibold text-card-foreground">
                                    Refueling
                                </h2>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    Fuel expenses recorded for this trip.
                                </p>
                            </div>
                        </div>
                    </div>

                    <dl className="divide-y divide-border px-5">
                        <DetailRow
                            label="Refueled"
                            value={tripLog.refueled ? "Yes" : "No"}
                        />

                        {tripLog.refueled ? (
                            <DetailRow
                                label="Fuel cost"
                                value={formatCurrency(tripLog.refuelingCost)}
                            />
                        ) : null}

                        {tripLog.refuelingReceiptFile ? (
                            <DetailRow
                                label="Receipt"
                                value={
                                    <div className="flex items-center gap-3 sm:justify-end">
                                        <span className="min-w-0 truncate">
                                            {tripLog.refuelingReceiptFile.fileName}
                                        </span>

                                        <FileDownloadButton
                                            fileId={tripLog.refuelingReceiptFile.id}
                                            fileName={tripLog.refuelingReceiptFile.fileName}
                                        />
                                    </div>
                                }
                            />
                        ) : null}
                    </dl>
                </section>

                {tripLog.note ? (
                    <section className="rounded-xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                                    <FileText className="size-5 text-muted-foreground"/>
                                </div>

                                <div>
                                    <h2 className="text-base font-semibold text-card-foreground">
                                        Note
                                    </h2>
                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                        Additional information recorded with the trip log.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <p className="whitespace-pre-wrap break-words px-5 py-4 text-sm text-card-foreground">
                            {tripLog.note}
                        </p>
                    </section>
                ) : null}

                <section className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-success/10">
                                <CheckCircle2 className="size-5 text-success"/>
                            </div>

                            <div>
                                <h2 className="text-base font-semibold text-card-foreground">
                                    Completion
                                </h2>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    Information about when this trip log was recorded.
                                </p>
                            </div>
                        </div>
                    </div>

                    <dl className="divide-y divide-border px-5">
                        <DetailRow
                            label="Completed by"
                            value={tripLog.completedBy.name}
                        />

                        <DetailRow
                            label="Completed"
                            value={formatDateTime(tripLog.completedAt)}
                        />

                        <DetailRow
                            label="Last updated"
                            value={formatDateTime(tripLog.updatedAt)}
                        />
                    </dl>
                </section>
            </div>
        </div>
    );
}

function DetailRow({
                       label,
                       value,
                       emphasized = false,
                   }: {
    label: string;
    value: React.ReactNode;
    emphasized?: boolean;
}) {
    return (
        <div className="grid gap-1 py-3 text-sm sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-4">
            <dt className="text-muted-foreground">{label}</dt>

            <dd
                className={
                    emphasized
                        ? "min-w-0 break-words font-semibold text-card-foreground sm:text-right"
                        : "min-w-0 break-words font-medium text-card-foreground sm:text-right"
                }
            >
                {value}
            </dd>
        </div>
    );
}