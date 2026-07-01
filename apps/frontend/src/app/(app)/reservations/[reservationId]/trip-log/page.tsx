"use client";

import Link from "next/link";
import {useEffect, useMemo, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {
    ArrowLeft, ArrowRight,
    Car,
    Check,
    CircleAlert,
    Fuel,
    Gauge,
    MapPin,
    TriangleAlert,
} from "lucide-react";
import {apiRequest, uploadFile} from "@/lib/api";
import {Alert} from "@/components/Alert";
import {LoadingState} from "@/components/LoadingState";
import {PageHeader} from "@/components/PageHeader";
import {formatDateTimeRange} from "@/lib/date";
import {formatKm} from "@/lib/format";
import {FilePicker} from "@/components/FilePicker";
import {PhotoPicker} from "@/components/PhotoPicker";

type ReservationStatus = "ACTIVE" | "CANCELLED" | "FINISHED";

type ReservationDetail = {
    id: string;
    vehicle: {
        id: string;
        name: string;
        licensePlate: string;
    };
    startAt: string;
    endAt: string;
    origin: string;
    destination: string;
    purpose: string;
    status: ReservationStatus;
    tripLog: {
        id: string;
    } | null;
};

type CreateTripLogResponse = {
    id: string;
    reservationId: string;
    odometerStartKm: number;
    odometerEndKm: number;
    distanceKm: number;
    refueled: boolean;
    refuelingCost?: number | null;
    note?: string | null;
    completedAt: string;
};

export default function CompleteTripLogPage() {
    const params = useParams<{ reservationId: string }>();
    const router = useRouter();

    const reservationId = params.reservationId;
    const [reservation, setReservation] = useState<ReservationDetail | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [issuePhotoFiles, setIssuePhotoFiles] = useState<File[]>([]);

    const [form, setForm] = useState({
        odometerStartKm: "",
        odometerEndKm: "",
        refueled: false,
        refuelingCost: "",
        note: "",
        issueDescription: "",
    });

    useEffect(() => {
        async function loadReservation() {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                router.replace("/login");
                return;
            }

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
    }, [reservationId, router]);

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
        (Number.isNaN(odometerStartKm) ||
            Number.isNaN(odometerEndKm) ||
            odometerEndKm < odometerStartKm);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!reservation) {
            return;
        }

        if (
            !form.odometerStartKm ||
            !form.odometerEndKm ||
            Number.isNaN(odometerStartKm) ||
            Number.isNaN(odometerEndKm) ||
            odometerStartKm < 0 ||
            odometerEndKm < odometerStartKm
        ) {
            setError("Enter valid odometer readings.");
            return;
        }

        let refuelingCost: number | undefined;

        if (form.refuelingCost) {
            const parsedRefuelingCost = Number(form.refuelingCost);

            if (Number.isNaN(parsedRefuelingCost) || parsedRefuelingCost < 0) {
                setError("Enter a valid fuel cost.");
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
            const uploadedReceipt = form.refueled && receiptFile
                ? await uploadFile(receiptFile, "FUEL_RECEIPT", token)
                : null;

            const uploadedIssuePhotos = form.issueDescription.trim()
                ? await Promise.all(
                    issuePhotoFiles.map((file) =>
                        uploadFile(file, "ISSUE_PHOTO", token),
                    ),
                )
                : [];

            await apiRequest<CreateTripLogResponse>(
                `/reservations/${reservation.id}/trip-log`,
                {
                    method: "POST",
                    token,
                    body: {
                        odometerStartKm,
                        odometerEndKm,
                        refueled: form.refueled,
                        ...(form.refueled && refuelingCost !== undefined
                            ? {refuelingCost}
                            : {}),
                        ...(uploadedReceipt
                            ? {refuelingReceiptFileId: uploadedReceipt.id}
                            : {}),
                        ...(form.note.trim()
                            ? {note: form.note.trim()}
                            : {}),
                        ...(form.issueDescription.trim()
                            ? {
                                issue: {
                                    description: form.issueDescription.trim(),
                                    ...(uploadedIssuePhotos.length > 0
                                        ? {
                                            photoFileIds: uploadedIssuePhotos.map((photo) => photo.id),
                                        }
                                        : {}),
                                },
                            }
                            : {}),
                    },
                },
            );

            router.push(`/reservations/${reservation.id}`);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Trip log could not be completed.",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return <LoadingState label="Loading reservation..."/>;
    }

    if (error && !reservation) {
        return (
            <div className="mx-auto max-w-3xl">
                <Link
                    href="/reservations"
                    className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4"/>
                    Back to reservations
                </Link>

                <Alert variant="error">{error}</Alert>
            </div>
        );
    }

    if (!reservation) {
        return null;
    }

    if (reservation.tripLog) {
        return (
            <div className="mx-auto max-w-3xl">
                <Link
                    href={`/reservations/${reservation.id}`}
                    className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4"/>
                    Back to reservation
                </Link>

                <Alert variant="info">
                    This reservation already has a completed trip log.
                </Alert>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl">
            <Link
                href={`/reservations/${reservation.id}`}
                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
                <ArrowLeft className="size-4"/>
                Back to reservation
            </Link>

            <div className="mb-6">
                <PageHeader
                    title="Complete trip log"
                    description="Record the mileage and refueling details for this completed trip."
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
                            {reservation.vehicle.name}
                        </p>

                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {reservation.vehicle.licensePlate}
                        </p>

                        <div className="mt-2 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="size-3.5 shrink-0"/>

                            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5">
                                <span
                                    title={reservation.origin}
                                    className="truncate"
                                >
                                    {reservation.origin}
                                </span>

                                <ArrowRight className="size-3.5 shrink-0"/>

                                <span
                                    title={reservation.destination}
                                    className="truncate text-right"
                                >
                                    {reservation.destination}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="shrink-0 text-left sm:w-64 sm:text-right">
                        <p className="text-sm font-medium text-card-foreground">
                            {formatDateTimeRange(
                                reservation.startAt,
                                reservation.endAt,
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
                            Enter the odometer readings before and after the trip.
                        </p>
                    </div>

                    <div className="p-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Starting odometer (km)">
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    inputMode="numeric"
                                    value={form.odometerStartKm}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            odometerStartKm: event.target.value,
                                        })
                                    }
                                    placeholder="e.g. 84250"
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/10"
                                />
                            </Field>

                            <Field label="Ending odometer (km)">
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    inputMode="numeric"
                                    value={form.odometerEndKm}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            odometerEndKm: event.target.value,
                                        })
                                    }
                                    placeholder="e.g. 84384"
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
                            Record fuel expenses from this trip.
                        </p>
                    </div>

                    <div className="p-5 space-y-4">
                        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/40">
                            <input
                                type="checkbox"
                                checked={form.refueled}
                                onChange={(event) => {
                                    const refueled = event.target.checked;

                                    setForm({
                                        ...form,
                                        refueled,
                                        refuelingCost: refueled ? form.refuelingCost : "",
                                    });

                                    if (!refueled) {
                                        setReceiptFile(null);
                                    }
                                }}
                                className="size-4 rounded border-input"
                            />

                            <Fuel className="size-4 text-muted-foreground"/>

                            <span className="text-sm font-medium text-card-foreground">
                                I refueled this vehicle
                            </span>
                        </label>

                        {form.refueled ? (
                            <div className="space-y-4">
                                <div className="max-w-xs">
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

                                <FilePicker
                                    file={receiptFile}
                                    onChange={setReceiptFile}
                                    disabled={isSubmitting}
                                />
                            </div>
                        ) : null}
                    </div>
                </section>

                <section className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-card-foreground">
                            Notes and issues
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Add an optional note or report a problem noticed during the trip.
                        </p>
                    </div>

                    <div className="space-y-4 p-5">
                        <Field label="Trip note (optional)">
                            <textarea
                                rows={3}
                                value={form.note}
                                onChange={(event) =>
                                    setForm({...form, note: event.target.value})
                                }
                                placeholder="e.g. Parking receipt handed to the office."
                                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/10"
                            />
                        </Field>

                        <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                            <div className="flex items-start gap-3">
                                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning-foreground"/>

                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-card-foreground">
                                        Report an issue
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Leave this empty when there was no problem with the vehicle.
                                    </p>

                                    <textarea
                                        rows={3}
                                        value={form.issueDescription}
                                        onChange={(event) =>
                                            setForm({
                                                ...form,
                                                issueDescription: event.target.value,
                                            })
                                        }
                                        placeholder="Describe the problem..."
                                        className="mt-3 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/10"
                                    />
                                    <PhotoPicker
                                        files={issuePhotoFiles}
                                        onChange={setIssuePhotoFiles}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {error ? (
                    <Alert variant="error">
                        {error}
                    </Alert>
                ) : null}

                <div className="flex items-center justify-end gap-3">
                    <Link
                        href={`/reservations/${reservation.id}`}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        disabled={isSubmitting || distanceKm === null}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Check className="size-4"/>
                        {isSubmitting ? "Saving..." : "Complete trip log"}
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