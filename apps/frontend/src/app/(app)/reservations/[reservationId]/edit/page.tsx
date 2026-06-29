"use client";

import {useEffect, useMemo, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import Link from "next/link";
import {
    Calendar,
    Car,
    Check,
    ChevronLeft,
    ChevronRight,
    CircleAlert, CircleX,
    Clock,
    MapPin,
} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {cn} from "@/lib/utils";
import {EmptyState} from "@/components/EmptyState";
import {Alert} from "@/components/Alert";
import {LoadingState} from "@/components/LoadingState";
import {formatDateTimeRange} from "@/lib/date";

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

type ReservationDetail = {
    id: string;
    vehicle: AvailableVehicle;
    startAt: string;
    endAt: string;
    origin: string;
    destination: string;
    purpose: string;
    status: "ACTIVE" | "CANCELLED" | "FINISHED";
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

function getTodayDateValue() {
    return new Date().toISOString().slice(0, 10);
}

export default function EditReservationPage() {
    const params = useParams<{reservationId: string}>();
    const router = useRouter();

    const reservationId = params.reservationId;

    const [step, setStep] = useState(1);
    const [vehicles, setVehicles] = useState<AvailableVehicle[]>([]);
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

    const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoadingReservation, setIsLoadingReservation] = useState(true);

    const today = getTodayDateValue();

    const [form, setForm] = useState({
        startDate: today,
        startTime: "08:00",
        endDate: today,
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

    const startsInPast = Boolean(startAt && new Date(startAt) < new Date());

    const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId);

    const canContinue =
        (step === 1 &&
            Boolean(startAt && endAt && new Date(endAt) > new Date(startAt)) &&
            !startsInPast) ||
        (step === 2 && Boolean(selectedVehicleId)) ||
        (step === 3 && Boolean(form.origin && form.destination && form.purpose)) ||
        step === 4;

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

                const start = new Date(response.startAt);
                const end = new Date(response.endAt);

                setSelectedVehicleId(response.vehicle.id);
                setVehicles([response.vehicle]);

                setForm({
                    startDate: toDateInputValue(start),
                    startTime: toTimeInputValue(start),
                    endDate: toDateInputValue(end),
                    endTime: toTimeInputValue(end),
                    origin: response.origin,
                    destination: response.destination,
                    purpose: response.purpose,
                });
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Reservation could not be loaded.",
                );
            } finally {
                setIsLoadingReservation(false);
            }
        }

        loadReservation();
    }, [reservationId, router]);

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

    function handleStartDateChange(value: string) {
        handleDateTimeChange({
            ...form,
            startDate: value,
        });
    }

    function handleStartDateBlur() {
        const nextStartDate = normalizeDateValue(form.startDate, today);

        let nextEndDate = form.endDate || nextStartDate;
        let nextEndTime = form.endTime;

        if (isDateBefore(nextEndDate, nextStartDate)) {
            nextEndDate = nextStartDate;
        }

        if (
            nextEndDate === nextStartDate &&
            isTimeBeforeOrEqual(nextEndTime, form.startTime)
        ) {
            nextEndTime = getNextEndTime(form.startTime);
        }

        handleDateTimeChange({
            ...form,
            startDate: nextStartDate,
            endDate: nextEndDate,
            endTime: nextEndTime,
        });
    }

    function handleEndDateChange(value: string) {
        handleDateTimeChange({
            ...form,
            endDate: value,
        });
    }

    function handleEndDateBlur() {
        const normalizedDate = normalizeDateValue(form.endDate || form.startDate, today);

        const nextEndDate = isDateBefore(normalizedDate, form.startDate)
            ? form.startDate
            : normalizedDate;

        let nextEndTime = form.endTime;

        if (
            nextEndDate === form.startDate &&
            isTimeBeforeOrEqual(nextEndTime, form.startTime)
        ) {
            nextEndTime = getNextEndTime(form.startTime);
        }

        handleDateTimeChange({
            ...form,
            endDate: nextEndDate,
            endTime: nextEndTime,
        });
    }

    function handleStartTimeChange(value: string) {
        let nextEndTime = form.endTime;

        if (
            (form.endDate || form.startDate) === form.startDate &&
            isTimeBeforeOrEqual(nextEndTime, value)
        ) {
            nextEndTime = getNextEndTime(value);
        }

        handleDateTimeChange({
            ...form,
            startTime: value,
            endTime: nextEndTime,
        });
    }

    function handleEndTimeChange(value: string) {
        const nextEndTime =
            (form.endDate || form.startDate) === form.startDate &&
            isTimeBeforeOrEqual(value, form.startTime)
                ? getNextEndTime(form.startTime)
                : value;

        handleDateTimeChange({
            ...form,
            endTime: nextEndTime,
        });
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
            await apiRequest(`/reservations/${reservationId}`, {
                method: "PATCH",
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

            router.push(`/reservations/${reservationId}`);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Reservation could not be updated.",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoadingReservation) {
        return <LoadingState label="Loading reservation..."/>;
    }

    return (
        <div className="mx-auto max-w-3xl">
            <div className="mb-6">
                <Link
                    href={`/reservations/${reservationId}`}
                    className="mb-3 inline-flex text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    Back to reservation
                </Link>

                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    Edit reservation
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Update the trip details and vehicle before the reservation starts.
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
                <Alert variant="error" className="mb-5">
                    {error}
                </Alert>
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
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Start date">
                            <input
                                type="date"
                                min={today}
                                value={form.startDate}
                                onChange={(event) => handleStartDateChange(event.target.value)}
                                onBlur={handleStartDateBlur}
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/10"
                            />
                        </Field>

                        <Field label="Start time">
                            <input
                                type="time"
                                value={form.startTime}
                                onChange={(event) => handleStartTimeChange(event.target.value)}
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/10"
                            />
                        </Field>

                        <Field label="End date">
                            <input
                                type="date"
                                min={form.startDate || today}
                                value={form.endDate || form.startDate}
                                onChange={(event) => handleEndDateChange(event.target.value)}
                                onBlur={handleEndDateBlur}
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/10"
                            />
                        </Field>

                        <Field label="End time">
                            <input
                                type="time"
                                value={form.endTime}
                                onChange={(event) => handleEndTimeChange(event.target.value)}
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/10"
                            />
                        </Field>
                    </div>

                    {startsInPast ? (
                        <Alert variant="error" className="mt-4">
                            <CircleX className="size-4"/>
                            Reservation cannot start in the past.
                        </Alert>
                    ) : startAt && endAt && new Date(endAt) <= new Date(startAt) ? (
                        <Alert variant="error" className="mt-4">
                            <CircleX className="size-4"/>
                            End date and time must be after start date and time.
                        </Alert>
                    ) : (
                        <Alert variant="info" className="mt-4">
                            <CircleAlert className="size-4"/>
                            After continuing, only vehicles available in this time window will be shown.
                        </Alert>
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
                                Available for {formatDateTimeRange(startAt, endAt)}.
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
                        <LoadingState
                            variant="inline"
                            label="Loading available vehicles..."
                        />
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
                            <EmptyState
                                title="No vehicles available"
                                description="Try a different date or time window."
                            />
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
                        Update the route and purpose of the reservation.
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
                        Review changes
                    </h2>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        Review the details before saving your changes.
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
                        <SummaryRow label="Date & time" value={formatDateTimeRange(startAt, endAt)}/>
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
                        {isSubmitting ? "Saving..." : "Save changes"}
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
        <div className="grid gap-1 py-3 text-sm sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-4">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="min-w-0 break-words font-medium text-card-foreground sm:text-right">
                {value || "—"}
            </dd>
        </div>
    );
}

function toDateInputValue(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function toTimeInputValue(date: Date) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
}

function buildDateTime(date: string, time: string) {
    if (!date || !time) {
        return "";
    }

    return new Date(`${date}T${time}`).toISOString();
}

function normalizeDateValue(value: string, minDate: string) {
    if (!value) {
        return minDate;
    }

    return isDateBefore(value, minDate) ? minDate : value;
}

function isDateBefore(value: string, compareTo: string) {
    return value < compareTo;
}

function isTimeBeforeOrEqual(value: string, compareTo: string) {
    return value <= compareTo;
}

function getNextEndTime(startTime: string) {
    const [hours, minutes] = startTime.split(":").map(Number);

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        return "23:59";
    }

    const nextHour = hours + 1;

    if (nextHour >= 24) {
        return "23:59";
    }

    return `${String(nextHour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}