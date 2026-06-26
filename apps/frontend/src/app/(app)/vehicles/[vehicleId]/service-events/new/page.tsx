"use client";

import Link from "next/link";
import {useEffect, useMemo, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {
    ArrowLeft,
    CalendarDays,
    Car,
    Check,
    CircleAlert,
    Wrench,
} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {Alert} from "@/components/Alert";
import {LoadingState} from "@/components/LoadingState";
import {PageHeader} from "@/components/PageHeader";

type VehicleDetail = {
    id: string;
    name: string;
    licensePlate: string;
    brand?: string | null;
    model?: string | null;
};

function getLocalDateValue() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function buildDateTime(date: string, time: string) {
    if (!date || !time) {
        return "";
    }

    return new Date(`${date}T${time}`).toISOString();
}

export default function NewServiceEventPage() {
    const params = useParams<{ vehicleId: string }>();
    const router = useRouter();

    const vehicleId = params.vehicleId;
    const today = getLocalDateValue();

    const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        title: "",
        description: "",
        startDate: today,
        startTime: "08:00",
        endDate: today,
        endTime: "09:00",
        cost: "",
    });

    const startAt = useMemo(
        () => buildDateTime(form.startDate, form.startTime),
        [form.startDate, form.startTime],
    );

    const endAt = useMemo(
        () => buildDateTime(form.endDate, form.endTime),
        [form.endDate, form.endTime],
    );

    const hasInvalidTimeRange = Boolean(startAt && endAt) &&
        new Date(endAt) <= new Date(startAt);

    useEffect(() => {
        async function loadVehicle() {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                router.replace("/login");
                return;
            }

            try {
                const response = await apiRequest<VehicleDetail>(
                    `/vehicles/${vehicleId}`,
                    {token},
                );

                setVehicle(response);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Vehicle could not be loaded.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadVehicle();
    }, [router, vehicleId]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const title = form.title.trim();

        if (!title) {
            setError("Enter a service event title.");
            return;
        }

        if (!startAt || !endAt || hasInvalidTimeRange) {
            setError("End date and time must be after the start.");
            return;
        }

        let cost: number | undefined;

        if (form.cost) {
            const parsedCost = Number(form.cost);

            if (
                Number.isNaN(parsedCost) ||
                !Number.isInteger(parsedCost) ||
                parsedCost < 0
            ) {
                setError("Enter a valid whole-number cost.");
                return;
            }

            cost = parsedCost;
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
                `/vehicles/${vehicleId}/service-events`,
                {
                    method: "POST",
                    token,
                    body: {
                        title,
                        ...(form.description.trim()
                            ? {description: form.description.trim()}
                            : {}),
                        startAt,
                        endAt,
                        ...(cost !== undefined ? {cost} : {}),
                    },
                },
            );

            router.push(`/vehicles/${vehicleId}`);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Service event could not be created.",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return <LoadingState label="Loading vehicle..."/>;
    }

    if (error && !vehicle) {
        return (
            <div className="mx-auto max-w-3xl">
                <Link
                    href={`/vehicles/${vehicleId}`}
                    className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4"/>
                    Back to vehicle
                </Link>

                <Alert variant="error">{error}</Alert>
            </div>
        );
    }

    if (!vehicle) {
        return null;
    }

    return (
        <div className="mx-auto max-w-3xl">
            <Link
                href={`/vehicles/${vehicle.id}`}
                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
                <ArrowLeft className="size-4"/>
                Back to vehicle
            </Link>

            <div className="mb-6">
                <PageHeader
                    title="Create service event"
                    description="Block this vehicle for planned maintenance or repair."
                />
            </div>

            <section className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Car className="size-5 text-muted-foreground"/>
                    </div>

                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-card-foreground">
                            {vehicle.name}
                        </p>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {vehicle.licensePlate}
                        </p>
                    </div>
                </div>
            </section>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                                    This time window will block new vehicle reservations.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 p-5">
                        <Field label="Title">
                            <input
                                value={form.title}
                                maxLength={255}
                                onChange={(event) =>
                                    setForm({...form, title: event.target.value})
                                }
                                placeholder="e.g. Annual inspection"
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/10"
                            />
                        </Field>

                        <Field label="Description (optional)">
                            <textarea
                                rows={3}
                                value={form.description}
                                maxLength={2000}
                                onChange={(event) =>
                                    setForm({...form, description: event.target.value})
                                }
                                placeholder="Describe the planned work..."
                                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/10"
                            />
                        </Field>
                    </div>
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
                                    Set when the vehicle will be unavailable.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 p-5 sm:grid-cols-2">
                        <Field label="Start date">
                            <input
                                type="date"
                                min={today}
                                value={form.startDate}
                                onChange={(event) =>
                                    setForm({...form, startDate: event.target.value})
                                }
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/10"
                            />
                        </Field>

                        <Field label="Start time">
                            <input
                                type="time"
                                value={form.startTime}
                                onChange={(event) =>
                                    setForm({...form, startTime: event.target.value})
                                }
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/10"
                            />
                        </Field>

                        <Field label="End date">
                            <input
                                type="date"
                                min={form.startDate || today}
                                value={form.endDate}
                                onChange={(event) =>
                                    setForm({...form, endDate: event.target.value})
                                }
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/10"
                            />
                        </Field>

                        <Field label="End time">
                            <input
                                type="time"
                                value={form.endTime}
                                onChange={(event) =>
                                    setForm({...form, endTime: event.target.value})
                                }
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/10"
                            />
                        </Field>

                        {hasInvalidTimeRange ? (
                            <div className="sm:col-span-2">
                                <Alert variant="error">
                                    <CircleAlert className="size-4"/>
                                    End date and time must be after the start.
                                </Alert>
                            </div>
                        ) : null}
                    </div>
                </section>

                <section className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <h2 className="text-base font-semibold text-card-foreground">
                            Cost
                        </h2>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                            Optional service cost in CZK.
                        </p>
                    </div>

                    <div className="p-5">
                        <div className="max-w-xs">
                            <Field label="Cost (CZK, optional)">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={form.cost}
                                    onChange={(event) =>
                                        setForm({
                                            ...form,
                                            cost: event.target.value.replace(/\D/g, ""),
                                        })
                                    }
                                    placeholder="e.g. 2500"
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/10"
                                />
                            </Field>
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
                        href={`/vehicles/${vehicle.id}`}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        disabled={isSubmitting || hasInvalidTimeRange}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Check className="size-4"/>
                        {isSubmitting ? "Creating..." : "Create service event"}
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