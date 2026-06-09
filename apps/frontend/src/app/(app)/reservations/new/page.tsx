"use client";

import {useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import Link from "next/link";
import {
    Calendar,
    Car,
    Check,
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    Clock,
    MapPin,
} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {cn} from "@/lib/utils";

type AvailableVehicle = {
    id: string;
    name: string;
    licensePlate: string;
    brand?: string;
    model?: string;
};

type AvailableVehiclesResponse = {
    data: AvailableVehicle[];
};

type CreateReservationResponse = {
    id: string;
};

const steps = [
    {id: 1, label: "Date & time", icon: Calendar},
    {id: 2, label: "Vehicle", icon: Car},
    {id: 3, label: "Trip details", icon: MapPin},
    {id: 4, label: "Confirm", icon: Check},
];

const MAX_ORIGIN_LENGTH = 255;
const MAX_DESTINATION_LENGTH = 255;
const MAX_PURPOSE_LENGTH = 255;

export default function NewReservationPage() {
    const router = useRouter();

    const [step, setStep] = useState(1);
    const [vehicles, setVehicles] = useState<AvailableVehicle[]>([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

    const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        startDate: "",
        startTime: "08:00",
        endDate: "",
        endTime: "16:00",
        origin: "Praha",
        destination: "",
        purpose: "",
    });

    const startAt = useMemo(
        () => buildDateTime(form.startDate, form.startTime),
        [form.startDate, form.startTime],
    );

    const endAt = useMemo(
        () => buildDateTime(form.endDate || form.startDate, form.endTime),
        [form.endDate, form.startDate, form.endTime],
    );

    const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId);

    const canContinue =
        (step === 1 && Boolean(startAt && endAt && new Date(endAt) > new Date(startAt))) ||
        (step === 2 && Boolean(selectedVehicleId)) ||
        (step === 3 && Boolean(form.origin && form.destination && form.purpose)) ||
        step === 4;

    async function loadAvailableVehicles() {
        if (!startAt || !endAt) {
            return;
        }

        const token = localStorage.getItem("accessToken");

        if (!token) {
            router.replace("/login");
            return;
        }

        setError(null);
        setIsLoadingVehicles(true);

        try {
            const params = new URLSearchParams({
                startAt,
                endAt,
            });

            const response = await apiRequest<AvailableVehiclesResponse>(
                `/vehicles/available?${params.toString()}`,
                {token},
            );

            setVehicles(response.data);
            setSelectedVehicleId(null);
            setStep(2);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Available vehicles could not be loaded.",
            );
        } finally {
            setIsLoadingVehicles(false);
        }
    }

    async function handleNext() {
        if (step === 1) {
            await loadAvailableVehicles();
            return;
        }

        if (step < 4) {
            setStep(step + 1);
        }
    }

    function handleBack() {
        setError(null);

        if (step > 1) {
            setStep(step - 1);
        }
    }

    function handleDateTimeChange(nextForm: typeof form) {
        setForm(nextForm);
        setSelectedVehicleId(null);
        setVehicles([]);
    }

    async function handleSubmit() {
        if (!startAt || !endAt || !selectedVehicleId) {
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
            const response = await apiRequest<CreateReservationResponse>("/reservations", {
                method: "POST",
                token,
                body: {
                    vehicleId: selectedVehicleId,
                    startAt,
                    endAt,
                    origin: form.origin,
                    destination: form.destination,
                    purpose: form.purpose,
                },
            });

            router.push(`/reservations`);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Reservation could not be created.",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="mx-auto max-w-3xl">
            <div className="mb-6">
                <Link
                    href="/reservations"
                    className="mb-3 inline-flex text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    Back to reservations
                </Link>

                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    New reservation
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Choose a time window first, then select an available vehicle.
                </p>
            </div>

            <div className="mb-8 flex items-center">
                {steps.map((item, index) => {
                    const done = step > item.id;
                    const active = step === item.id;
                    const Icon = item.icon;

                    return (
                        <div key={item.id} className="flex flex-1 items-center last:flex-none">
                            <div className="flex flex-col items-center gap-1.5">
                                <div
                                    className={cn(
                                        "flex size-9 items-center justify-center rounded-full border transition-colors",
                                        done && "border-foreground bg-foreground text-background",
                                        active && "border-foreground bg-background text-foreground",
                                        !done && !active && "border-border bg-muted text-muted-foreground",
                                    )}
                                >
                                    {done ? <Check className="size-4"/> : <Icon className="size-4"/>}
                                </div>

                                <span
                                    className={cn(
                                        "whitespace-nowrap text-xs",
                                        active
                                            ? "font-medium text-foreground"
                                            : "text-muted-foreground",
                                    )}
                                >
                                    {item.label}
                                </span>
                            </div>

                            {index < steps.length - 1 ? (
                                <div
                                    className={cn(
                                        "mx-2 mb-5 h-px flex-1 transition-colors",
                                        step > item.id ? "bg-foreground" : "bg-border",
                                    )}
                                />
                            ) : null}
                        </div>
                    );
                })}
            </div>

            {error ? (
                <div className="mb-5 rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                </div>
            ) : null}

            {step === 1 ? (
                <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                            <Clock className="size-5 text-muted-foreground"/>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight text-card-foreground">
                                Select date and time
                            </h2>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                Vehicles will be filtered by availability in this time window.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Start date">
                            <input
                                type="date"
                                value={form.startDate}
                                onChange={(event) =>
                                    handleDateTimeChange({
                                        ...form,
                                        startDate: event.target.value,
                                        endDate: form.endDate || event.target.value,
                                    })
                                }
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/10"
                            />
                        </Field>

                        <Field label="Start time">
                            <input
                                type="time"
                                value={form.startTime}
                                onChange={(event) =>
                                    handleDateTimeChange({
                                        ...form,
                                        startTime: event.target.value,
                                    })
                                }
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/10"
                            />
                        </Field>

                        <Field label="End date">
                            <input
                                type="date"
                                value={form.endDate || form.startDate}
                                onChange={(event) =>
                                    handleDateTimeChange({
                                        ...form,
                                        endDate: event.target.value,
                                    })
                                }
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/10"
                            />
                        </Field>

                        <Field label="End time">
                            <input
                                type="time"
                                value={form.endTime}
                                onChange={(event) =>
                                    handleDateTimeChange({
                                        ...form,
                                        endTime: event.target.value,
                                    })
                                }
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/10"
                            />
                        </Field>
                    </div>

                    {startAt && endAt && new Date(endAt) <= new Date(startAt) ? (
                        <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/10 p-3 text-sm text-destructive">
                            <CircleAlert className="mt-0.5 size-4 shrink-0"/>
                            End date and time must be after start date and time.
                        </div>
                    ) : (
                        <div className="mt-4 flex items-start gap-2 rounded-lg border border-info/25 bg-info/10 p-3 text-sm text-info">
                            <CircleAlert className="mt-0.5 size-4 shrink-0"/>
                            After continuing, only vehicles available in this time window will be shown.
                        </div>
                    )}
                </section>
            ) : null}

            {step === 2 ? (
                <section>
                    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-sm">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight text-card-foreground">
                                Select vehicle
                            </h2>
                            <p className="mt-0.5 text-sm text-muted-foreground">
                                Available for {formatReservationRange(startAt, endAt)}.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="inline-flex h-8 items-center justify-center rounded-md px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            Change time
                        </button>
                    </div>

                    {isLoadingVehicles ? (
                        <div className="rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground shadow-sm">
                            Loading available vehicles...
                        </div>
                    ) : vehicles.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {vehicles.map((vehicle) => {
                                const selected = selectedVehicleId === vehicle.id;

                                return (
                                    <button
                                        key={vehicle.id}
                                        type="button"
                                        onClick={() => setSelectedVehicleId(vehicle.id)}
                                        className={cn(
                                            "group rounded-xl border bg-card p-4 text-left shadow-sm transition-all hover:border-ring/40 hover:bg-muted/40 hover:shadow-sm",
                                            selected &&
                                            "border-foreground bg-muted/50 ring-1 ring-foreground",
                                            !selected && "border-border",
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
                                                <Car className="size-6 text-muted-foreground"/>
                                            </div>

                                            {selected ? (
                                                <span className="flex size-5 items-center justify-center rounded-full bg-foreground text-background">
                                                    <Check className="size-3"/>
                                                </span>
                                            ) : null}
                                        </div>

                                        <div className="mt-4">
                                            <p className="text-base font-semibold tracking-tight text-card-foreground">
                                                {vehicle.name}
                                            </p>
                                            <p className="mt-0.5 text-sm text-muted-foreground">
                                                {vehicle.licensePlate}
                                            </p>
                                        </div>

                                        <p className="mt-3 text-xs text-muted-foreground">
                                            {[vehicle.brand, vehicle.model].filter(Boolean).join(" ") || "Available vehicle"}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-xl border border-border bg-card px-5 py-12 text-center shadow-sm">
                            <p className="text-sm font-medium text-card-foreground">
                                No vehicles available
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Try a different date or time window.
                            </p>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
                            >
                                Change time
                            </button>
                        </div>
                    )}
                </section>
            ) : null}

            {step === 3 ? (
                <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <h2 className="text-lg font-semibold tracking-tight text-card-foreground">
                        Trip details
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Add the route and purpose of the reservation.
                    </p>

                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <Field label="Origin">
                            <input
                                value={form.origin}
                                maxLength={MAX_ORIGIN_LENGTH}
                                onChange={(event) =>
                                    setForm({...form, origin: event.target.value})
                                }
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/10"
                            />
                        </Field>

                        <Field label="Destination">
                            <input
                                value={form.destination}
                                maxLength={MAX_DESTINATION_LENGTH}
                                onChange={(event) =>
                                    setForm({...form, destination: event.target.value})
                                }
                                placeholder="e.g. Brno"
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/10"
                            />
                        </Field>
                    </div>

                    <div className="mt-4">
                        <Field label="Purpose of trip">
                            <textarea
                                rows={3}
                                value={form.purpose}
                                maxLength={MAX_PURPOSE_LENGTH}
                                onChange={(event) =>
                                    setForm({...form, purpose: event.target.value})
                                }
                                placeholder="Describe the reason for this trip..."
                                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/10"
                            />
                        </Field>
                        <p className="mt-1 text-right text-xs text-muted-foreground">
                            {form.purpose.length}/{MAX_PURPOSE_LENGTH}
                        </p>
                    </div>
                </section>
            ) : null}

            {step === 4 ? (
                <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <h2 className="text-lg font-semibold tracking-tight text-card-foreground">
                        Confirm reservation
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Review the details before creating the reservation.
                    </p>

                    <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-11 items-center justify-center rounded-lg bg-background">
                                <Car className="size-5 text-muted-foreground"/>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-card-foreground">
                                    {selectedVehicle?.name}
                                </p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {selectedVehicle?.licensePlate}
                                </p>
                            </div>
                        </div>
                    </div>

                    <dl className="mt-4 divide-y divide-border">
                        <SummaryRow label="Date & time" value={formatReservationRange(startAt, endAt)}/>
                        <SummaryRow label="Origin" value={form.origin}/>
                        <SummaryRow label="Destination" value={form.destination}/>
                        <SummaryRow label="Purpose" value={form.purpose}/>
                    </dl>
                </section>
            ) : null}

            <div className="mt-6 flex items-center justify-between">
                <button
                    type="button"
                    onClick={handleBack}
                    disabled={step === 1}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <ChevronLeft className="size-4"/>
                    Back
                </button>

                {step < 4 ? (
                    <button
                        type="button"
                        onClick={handleNext}
                        disabled={!canContinue || isLoadingVehicles}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {step === 1 && isLoadingVehicles ? "Checking..." : "Continue"}
                        <ChevronRight className="size-4"/>
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Check className="size-4"/>
                        {isSubmitting ? "Creating..." : "Confirm reservation"}
                    </button>
                )}
            </div>
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

function SummaryRow({label, value}: { label: string; value?: string | null }) {
    return (
        <div className="flex justify-between gap-4 py-3 text-sm">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="text-right font-medium text-card-foreground">{value || "—"}</dd>
        </div>
    );
}

function buildDateTime(date: string, time: string) {
    if (!date || !time) {
        return "";
    }

    return new Date(`${date}T${time}`).toISOString();
}

function formatReservationRange(startValue?: string, endValue?: string) {
    if (!startValue || !endValue) {
        return "selected time window";
    }

    if (isSameCalendarDay(startValue, endValue)) {
        return `${formatShortDate(startValue)}, ${formatTime(startValue)}–${formatTime(endValue)}`;
    }

    return `${formatShortDateTime(startValue)} – ${formatShortDateTime(endValue)}`;
}

function formatShortDate(value: string) {
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

function formatShortDateTime(value: string) {
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
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