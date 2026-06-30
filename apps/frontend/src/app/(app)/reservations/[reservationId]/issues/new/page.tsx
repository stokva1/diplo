"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    Car,
    Check,
    MapPin,
    TriangleAlert,
} from "lucide-react";
import {apiRequest, uploadFile} from "@/lib/api";
import {Alert} from "@/components/Alert";
import {LoadingState} from "@/components/LoadingState";
import {PageHeader} from "@/components/PageHeader";
import {formatDateTimeRange} from "@/lib/date";
import {PhotoPicker} from "@/components/PhotoPicker";

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
    status: "ACTIVE" | "FINISHED" | "CANCELLED";
};

type CreateIssueResponse = {
    id: string;
};

export default function NewReservationIssuePage() {
    const params = useParams<{reservationId: string}>();
    const router = useRouter();

    const reservationId = params.reservationId;

    const [reservation, setReservation] =
        useState<ReservationDetail | null>(null);

    const [description, setDescription] = useState("");
    const [photoFiles, setPhotoFiles] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadReservation() {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                setIsLoading(false);
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

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedDescription = description.trim();

        if (!trimmedDescription) {
            setError("Describe the issue before submitting it.");
            return;
        }

        const token = localStorage.getItem("accessToken");

        if (!token) {
            router.replace("/login");
            return;
        }

        setError(null);
        setIsSubmitting(true);

        try {
            const uploadedPhotos = await Promise.all(
                photoFiles.map((file) => uploadFile(file, "ISSUE_PHOTO", token)),
            );

            await apiRequest<CreateIssueResponse>(
                `/reservations/${reservationId}/issues`,
                {
                    method: "POST",
                    token,
                    body: {
                        description: trimmedDescription,
                        ...(uploadedPhotos.length > 0
                            ? {photoFileIds: uploadedPhotos.map((photo) => photo.id)}
                            : {}),
                    },
                },
            );

            router.push(`/reservations/${reservationId}`);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Issue could not be reported.",
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
                    title="Report issue"
                    description="Report a problem connected to this reservation."
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

            <form
                onSubmit={handleSubmit}
                className="rounded-xl border border-border bg-card shadow-sm"
            >
                <div className="border-b border-border px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-warning/10">
                            <TriangleAlert className="size-5 text-warning"/>
                        </div>

                        <div>
                            <h2 className="text-base font-semibold text-card-foreground">
                                Issue details
                            </h2>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                Describe what happened or what needs attention.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-5">
                    <div>
                        <label
                            htmlFor="description"
                            className="mb-1.5 block text-sm font-medium text-card-foreground"
                        >
                            Description
                        </label>

                        <textarea
                            rows={6}
                            maxLength={2000}
                            value={description}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                            placeholder="Describe the issue..."
                            className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/10"
                        />

                        <span className="mt-1.5 block text-right text-xs text-muted-foreground">
                            {description.length}/1000
                        </span>

                        <div className="mt-5">
                            <PhotoPicker
                                files={photoFiles}
                                onChange={setPhotoFiles}
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-border px-5 py-4">
                    <Link
                        href={`/reservations/${reservation.id}`}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        disabled={isSubmitting || !description.trim()}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Check className="size-4"/>
                        {isSubmitting ? "Reporting..." : "Report issue"}
                    </button>
                </div>
            </form>
        </div>
    );
}