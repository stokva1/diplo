"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {
    ArrowLeft,
    CalendarDays,
    Car,
    Pencil, TriangleAlert,
    Wrench,
} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {Alert} from "@/components/Alert";
import {LoadingState} from "@/components/LoadingState";
import {PageHeader} from "@/components/PageHeader";
import {formatDateTime, formatDateTimeRange} from "@/lib/date";
import {formatCurrency} from "@/lib/format";

type ServiceEventDetail = {
    id: string;
    status: "ACTIVE" | "CANCELLED";
    vehicle: {
        id: string;
        name: string;
        licensePlate: string;
    };
    title: string;
    description?: string | null;
    startAt: string;
    endAt: string;
    cost?: number | null;
    invoiceFile?: {
        id: string;
        fileName: string;
    } | null;
    createdBy?: {
        id: string;
        name: string;
    } | null;
    createdAt: string;
};

export default function ServiceEventDetailPage() {
    const params = useParams<{
        vehicleId: string;
        serviceEventId: string;
    }>();
    const router = useRouter();

    const vehicleId = params.vehicleId;
    const serviceEventId = params.serviceEventId;

    const [serviceEvent, setServiceEvent] =
        useState<ServiceEventDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        async function loadServiceEvent() {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                setIsLoading(false);
                router.replace("/login");
                return;
            }

            try {
                const response = await apiRequest<ServiceEventDetail>(
                    `/service-events/${serviceEventId}`,
                    {token},
                );

                setServiceEvent(response);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Service event could not be loaded.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadServiceEvent();
    }, [router, serviceEventId]);

    async function handleCancel() {
        if (!serviceEvent) {
            return;
        }

        const token = localStorage.getItem("accessToken");

        if (!token) {
            router.replace("/login");
            return;
        }

        setError(null);
        setIsCancelling(true);

        try {
            await apiRequest(
                `/service-events/${serviceEvent.id}/cancel`,
                {
                    method: "POST",
                    token,
                },
            );

            router.push(`/vehicles/${vehicleId}`);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Service event could not be cancelled.",
            );
        } finally {
            setIsCancelling(false);
        }
    }

    if (isLoading) {
        return <LoadingState label="Loading service event..."/>;
    }

    if (error && !serviceEvent) {
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

    if (!serviceEvent) {
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
                    title={serviceEvent.title}
                    description="Service event details and planned vehicle unavailability."
                />

                {serviceEvent.status === "ACTIVE" ? (
                    <div className="flex shrink-0 items-center gap-2">
                        <Link
                            href={`/vehicles/${vehicleId}/service-events/${serviceEvent.id}/edit`}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                        >
                            <Pencil className="size-4"/>
                            Edit
                        </Link>

                        <button
                            type="button"
                            onClick={() => setShowCancelConfirm(true)}
                            className="inline-flex h-9 items-center justify-center rounded-lg border border-destructive/25 bg-destructive/10 px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/15"
                        >
                            Cancel event
                        </button>
                    </div>
                ) : null}
            </div>

            {error ? (
                <Alert variant="error" className="mb-5">
                    {error}
                </Alert>
            ) : null}

            {serviceEvent.status === "ACTIVE" && showCancelConfirm ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="cancel-service-event-title"
                >
                    <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                                <TriangleAlert className="size-5 text-destructive"/>
                            </div>

                            <div className="min-w-0">
                                <h2
                                    id="cancel-service-event-title"
                                    className="text-base font-semibold text-card-foreground"
                                >
                                    Cancel this service event?
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    The vehicle will no longer be blocked for this service window.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowCancelConfirm(false)}
                                disabled={isCancelling}
                                className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Keep event
                            </button>

                            <button
                                type="button"
                                onClick={handleCancel}
                                disabled={isCancelling}
                                className="inline-flex h-9 items-center justify-center rounded-lg bg-destructive px-3 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isCancelling ? "Cancelling..." : "Cancel event"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            <section className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Car className="size-5 text-muted-foreground"/>
                    </div>

                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-card-foreground">
                            {serviceEvent.vehicle.name}
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {serviceEvent.vehicle.licensePlate}
                        </p>
                    </div>
                </div>
            </section>

            <div className="space-y-6">
                <section className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                                <Wrench className="size-5 text-muted-foreground"/>
                            </div>

                            <div>
                                <h2 className="text-base font-semibold text-card-foreground">
                                    Service details
                                </h2>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    Planned maintenance or repair information.
                                </p>
                            </div>
                        </div>
                    </div>

                    <dl className="divide-y divide-border px-5">
                        <DetailRow label="Title" value={serviceEvent.title}/>

                        <DetailRow
                            label="Description"
                            value={serviceEvent.description || "—"}
                            multiline
                        />

                        <DetailRow
                            label="Cost"
                            value={formatCurrency(serviceEvent.cost)}
                        />

                        <DetailRow
                            label="Invoice"
                            value={serviceEvent.invoiceFile?.fileName || "—"}
                        />
                    </dl>
                </section>

                <section className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                                <CalendarDays className="size-5 text-muted-foreground"/>
                            </div>

                            <div>
                                <h2 className="text-base font-semibold text-card-foreground">
                                    Schedule
                                </h2>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    The vehicle is unavailable during this period.
                                </p>
                            </div>
                        </div>
                    </div>

                    <dl className="divide-y divide-border px-5">
                        <DetailRow
                            label="Time window"
                            value={formatDateTimeRange(
                                serviceEvent.startAt,
                                serviceEvent.endAt,
                            )}
                        />

                        <DetailRow
                            label="Created"
                            value={formatDateTime(serviceEvent.createdAt)}
                        />

                        <DetailRow
                            label="Created by"
                            value={serviceEvent.createdBy?.name || "—"}
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
                       multiline = false,
                   }: {
    label: string;
    value: string;
    multiline?: boolean;
}) {
    return (
        <div className="grid gap-1 py-3 text-sm sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4">
            <dt className="text-muted-foreground">{label}</dt>
            <dd
                className={
                    multiline
                        ? "whitespace-pre-wrap break-words font-medium text-card-foreground sm:text-right"
                        : "min-w-0 break-words font-medium text-card-foreground sm:text-right"
                }
            >
                {value}
            </dd>
        </div>
    );
}