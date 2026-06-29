"use client";

import Link from "next/link";
import {useEffect, useMemo, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Car,
    Check,
    CircleAlert,
    Fuel,
    Gauge,
    MapPin,
} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {Alert} from "@/components/Alert";
import {LoadingState} from "@/components/LoadingState";
import {PageHeader} from "@/components/PageHeader";
import {formatDateTimeRange,} from "@/lib/date";
import {formatKm} from "@/lib/format";
import type {MeResponse} from "@/types/api";

type TripLogDetail = {
    id: string;
    reservationId: string;
    vehicle: {
        id: string;
        name: string;
        licensePlate: string;
    };
    startAt: string;
    endAt: string;
    origin: string;
    destination: string;
    odometerStartKm: number;
    odometerEndKm: number;
    distanceKm: number;
    refueled: boolean;
    refuelingCost?: number | null;
    note?: string | null;
};

export default function EditTripLogPage() {
    const params = useParams<{tripLogId: string}>();
    const router = useRouter();

    const tripLogId = params.tripLogId;

    const [tripLog, setTripLog] = useState<TripLogDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        odometerStartKm: "",
        odometerEndKm: "",
        refueled: false,
        refuelingCost: "",
        note: "",
    });

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

                if (meResponse.member.role !== "ADMIN") {
                    setError("Only administrators can edit trip logs.");
                    return;
                }

                setTripLog(tripLogResponse);

                setForm({
                    odometerStartKm: String(tripLogResponse.odometerStartKm),
                    odometerEndKm: String(tripLogResponse.odometerEndKm),
                    refueled: tripLogResponse.refueled,
                    refuelingCost:
                        tripLogResponse.refuelingCost?.toString() ?? "",
                    note: tripLogResponse.note ?? "",
                });
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

    const odometerStartKm = Number(form.odometerStartKm);
    const odometerEndKm = Number(form.odometerEndKm);

    const distanceKm = useMemo(() => {
        if (
            !form.odometerStartKm ||
            !form.odometerEndKm ||
            Number.isNaN(odometerStartKm) ||
            Number.isNaN(odometerEndKm) ||
            odometerEndKm < odometerStartKm
        ) {
            return null;
        }

        return odometerEndKm - odometerStartKm;
    }, [
        form.odometerStartKm,
        form.odometerEndKm,
        odometerStartKm,
        odometerEndKm,
    ]);

    const hasInvalidOdometer =
        Boolean(form.odometerStartKm && form.odometerEndKm) &&
        (
            Number.isNaN(odometerStartKm) ||
            Number.isNaN(odometerEndKm) ||
            odometerStartKm < 0 ||
            odometerEndKm < odometerStartKm
        );

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!tripLog) {
            return;
        }

        if (
            !form.odometerStartKm ||
            !form.odometerEndKm ||
            hasInvalidOdometer
        ) {
            setError("Enter valid odometer readings.");
            return;
        }

        let refuelingCost: number | undefined;

        if (form.refueled && form.refuelingCost) {
            const parsedRefuelingCost = Number(form.refuelingCost);

            if (
                Number.isNaN(parsedRefuelingCost) ||
                !Number.isInteger(parsedRefuelingCost) ||
                parsedRefuelingCost < 0
            ) {
                setError("Enter a valid whole-number fuel cost.");
                return;
            }

            refuelingCost = parsedRefuelingCost;
        }

        const token = localStorage.getItem("accessToken");

        if (!token) {
            router.replace("/login");
            return;
        }

        setError(null);
        setIsSubmitting(true);

        try {
            await apiRequest(
                `/reservations/${tripLog.reservationId}/trip-log`,
                {
                    method: "PATCH",
                    token,
                    body: {
                        odometerStartKm,
                        odometerEndKm,
                        refueled: form.refueled,
                        ...(form.refueled && refuelingCost !== undefined
                            ? {refuelingCost}
                            : {}),
                        ...(form.note.trim()
                            ? {note: form.note.trim()}
                            : {}),
                    },
                },
            );

            router.push(`/trip-logs/${tripLog.id}`);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Trip log could not be updated.",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return <LoadingState label="Loading trip log..."/>;
    }

    if (error && !tripLog) {
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

                <Alert variant="error">{error}</Alert>
            </div>
        );
    }

    if (!tripLog) {
        return null;
    }

    return (
        <div className="mx-auto max-w-3xl">
            <Link
                href={`/trip-logs/${tripLog.id}`}
                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
                <ArrowLeft className="size-4"/>
                Back to trip log
            </Link>

            <div className="mb-6">
                <PageHeader
                    title="Edit trip log"
                    description="Correct recorded mileage, refueling details or trip notes."
                />
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
                        <p className="truncate text-sm font-semibold text-card-foreground">
                            {tripLog.vehicle.name}
                        </p>

                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {tripLog.vehicle.licensePlate}
                        </p>

                        <div className="mt-2 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="size-3.5 shrink-0"/>

                            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5">
                                <span title={tripLog.origin} className="truncate">
                                    {tripLog.origin}
                                </span>

                                <ArrowRight className="size-3.5 shrink-0"/>

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

            <form onSubmit={handleSubmit} className="space-y-6">
                <section className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-card-foreground">
                            Mileage
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Correct the recorded odometer readings.
                        </p>
                    </div>

                    <div className="p-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Starting odometer (km)">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={form.odometerStartKm}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            odometerStartKm: event.target.value.replace(/\D/g, ""),
                                        })
                                    }
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/10"
                                />
                            </Field>

                            <Field label="Ending odometer (km)">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={form.odometerEndKm}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            odometerEndKm: event.target.value.replace(/\D/g, ""),
                                        })
                                    }
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/10"
                                />
                            </Field>
                        </div>

                        {hasInvalidOdometer ? (
                            <Alert variant="error" className="mt-4">
                                <CircleAlert className="size-4"/>
                                Ending odometer must be greater than or equal to the starting odometer.
                            </Alert>
                        ) : null}

                        {distanceKm !== null ? (
                            <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
                                <div className="flex size-9 items-center justify-center rounded-lg bg-background">
                                    <Gauge className="size-4 text-muted-foreground"/>
                                </div>

                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        Calculated distance
                                    </p>
                                    <p className="text-sm font-semibold text-card-foreground">
                                        {formatKm(distanceKm)}
                                    </p>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </section>

                <section className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-card-foreground">
                            Refueling
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Correct fuel information recorded for this trip.
                        </p>
                    </div>

                    <div className="p-5">
                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/40">
                            <input
                                type="checkbox"
                                checked={form.refueled}
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        refueled: event.target.checked,
                                        refuelingCost: event.target.checked
                                            ? form.refuelingCost
                                            : "",
                                    })
                                }
                                className="size-4 rounded border-input"
                            />

                            <Fuel className="size-4 text-muted-foreground"/>

                            <span className="text-sm font-medium text-card-foreground">
                                Vehicle was refueled
                            </span>
                        </label>

                        {form.refueled ? (
                            <div className="mt-4 max-w-xs">
                                <Field label="Fuel cost">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={form.refuelingCost}
                                        onChange={(event) =>
                                            setForm({
                                                ...form,
                                                refuelingCost: event.target.value.replace(/\D/g, ""),
                                            })
                                        }
                                        placeholder="e.g. 1200"
                                        className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/10"
                                    />
                                </Field>
                            </div>
                        ) : null}
                    </div>
                </section>

                <section className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-card-foreground">
                            Note
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Optional additional information about the trip.
                        </p>
                    </div>

                    <div className="p-5">
                        <textarea
                            rows={4}
                            maxLength={255}
                            value={form.note}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    note: event.target.value,
                                })
                            }
                            placeholder="Add a note..."
                            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/10"
                        />
                    </div>
                </section>

                <div className="flex justify-end gap-3">
                    <Link
                        href={`/trip-logs/${tripLog.id}`}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        disabled={isSubmitting || distanceKm === null}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Check className="size-4"/>
                        {isSubmitting ? "Saving..." : "Save changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}

function Field({
                   label,
                   children,
               }: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-card-foreground">
                {label}
            </span>
            {children}
        </label>
    );
}