"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {
    ArrowLeft,
    CalendarDays,
    Car,
    FileText,
    Fuel,
    Gauge,
    Hash,
    TriangleAlert,
    User,
    Wrench,
} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {cn} from "@/lib/utils";

type VehicleStatus = "ACTIVE" | "UNAVAILABLE" | "ARCHIVED";

type FuelType =
    | "PETROL"
    | "DIESEL"
    | "ELECTRIC"
    | "HYBRID"
    | "LPG"
    | "CNG"
    | "OTHER";

type VehicleDetail = {
    id: string;
    name: string;
    licensePlate: string;
    brand?: string | null;
    model?: string | null;
    vin?: string | null;
    fuelType: FuelType;
    currentOdometerKm: number;
    status: VehicleStatus;
    note?: string | null;
    manager?: {
        id: string;
        name: string;
    } | null;
    createdAt: string;
    updatedAt: string;
    imageUrl?: string | null;
};

type ServiceEventListItem = {
    id: string;
    title: string;
    description?: string | null;
    startAt: string;
    endAt: string;
    cost?: number | null;
    invoiceFile?: {
        id: string;
        fileName: string;
    } | null;
};

type ServiceEventsResponse = {
    data: ServiceEventListItem[];
};

type VehicleIssueListItem = {
    id: string;
    description: string;
    status: "OPEN" | "RESOLVED";
    createdAt: string;
    reportedBy?: {
        id: string;
        name: string;
    };
};

type IssuesResponse = {
    data: VehicleIssueListItem[];
};

type ReservationListItem = {
    id: string;
    member?: {
        id: string;
        name: string;
    };
    startAt: string;
    endAt: string;
    origin: string;
    destination: string;
    status: "ACTIVE" | "FINISHED" | "CANCELLED";
    hasTripLog?: boolean;
};

type ReservationsResponse = {
    data: ReservationListItem[];
};

export default function VehicleDetailPage() {
    const params = useParams<{ vehicleId: string }>();
    const router = useRouter();

    const vehicleId = params.vehicleId;

    const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
    const [serviceEvents, setServiceEvents] = useState<ServiceEventListItem[]>([]);
    const [issues, setIssues] = useState<VehicleIssueListItem[]>([]);
    const [reservations, setReservations] = useState<ReservationListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadVehicleDetail() {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const [vehicleResponse, serviceEventsResponse, issuesResponse, reservationsResponse] =
                    await Promise.all([
                        apiRequest<VehicleDetail>(`/vehicles/${vehicleId}`, {token}),
                        apiRequest<ServiceEventsResponse>(
                            `/vehicles/${vehicleId}/service-events?page=1&limit=5`,
                            {token},
                        ),
                        apiRequest<IssuesResponse>(
                            `/issues?scope=managed&vehicleId=${vehicleId}&page=1&limit=5`,
                            {token},
                        ),
                        apiRequest<ReservationsResponse>(
                            `/reservations?scope=managed&vehicleId=${vehicleId}&page=1&limit=5&sort=-startAt`,
                            {token},
                        ),
                    ]);

                setVehicle(vehicleResponse);
                setServiceEvents(serviceEventsResponse.data);
                setIssues(issuesResponse.data);
                setReservations(reservationsResponse.data);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Vehicle detail could not be loaded.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadVehicleDetail();
    }, [vehicleId]);

    if (isLoading) {
        return (
            <div className="mx-auto max-w-6xl">
                <div className="rounded-lg border border-border bg-card px-5 py-4 text-sm text-muted-foreground shadow-sm">
                    Loading vehicle detail...
                </div>
            </div>
        );
    }

    if (error && !vehicle) {
        return (
            <div className="mx-auto max-w-6xl">
                <BackButton onClick={() => router.back()}/>

                <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-5 py-4 text-sm text-destructive">
                    {error}
                </div>
            </div>
        );
    }

    if (!vehicle) {
        return null;
    }

    const openIssuesCount = issues.filter((issue) => issue.status === "OPEN").length;

    return (
        <div className="mx-auto max-w-6xl">
            <BackButton onClick={() => router.back()}/>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                    <h1 className="truncate text-3xl font-semibold tracking-tight text-foreground">
                        {vehicle.name}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {[vehicle.brand, vehicle.model].filter(Boolean).join(" ") || "Vehicle detail"} ·{" "}
                        <span className="font-mono">{vehicle.licensePlate}</span>
                    </p>
                </div>
                <StatusBadge status={vehicle.status}/>

            </div>

            {error ? (
                <div className="mb-5 rounded-xl border border-destructive/25 bg-destructive/10 px-5 py-4 text-sm text-destructive">
                    {error}
                </div>
            ) : null}

            <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
                    <div className="min-w-0">
                        <VehicleHero vehicle={vehicle}/>

                        <div className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
                            <Spec
                                icon={Gauge}
                                label="Odometer"
                                value={formatKm(vehicle.currentOdometerKm)}
                            />
                            <Spec
                                icon={Fuel}
                                label="Fuel"
                                value={fuelTypeLabels[vehicle.fuelType]}
                            />
                            <Spec
                                icon={Hash}
                                label="VIN"
                                value={vehicle.vin || "—"}
                            />
                            <Spec
                                icon={User}
                                label="Manager"
                                value={vehicle.manager?.name || "Unassigned"}
                            />
                        </div>
                    </div>

                    <div className="flex min-w-0 flex-col border-t border-border lg:border-l lg:border-t-0">
                        <div className="border-b border-border px-5 py-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-base font-semibold text-card-foreground">
                                        Vehicle status
                                    </h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Current operational state and quick actions.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-1 flex-col gap-4 p-5">
                            <div className="grid grid-cols-2 gap-3">
                                <SmallStat
                                    label="Open issues"
                                    value={String(openIssuesCount)}
                                    tone={openIssuesCount > 0 ? "danger" : "neutral"}
                                />
                                <SmallStat
                                    label="Service events"
                                    value={String(serviceEvents.length)}
                                    tone="neutral"
                                />
                            </div>

                            {vehicle.note ? (
                                <div className="rounded-lg border border-border bg-background p-3">
                                    <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                        <FileText className="size-3.5"/>
                                        Note
                                    </p>
                                    <p className="mt-1 line-clamp-4 break-words text-sm text-card-foreground">
                                        {vehicle.note}
                                    </p>
                                </div>
                            ) : null}

                            <div className="mt-auto grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                                <Link
                                    href={`/vehicles/${vehicle.id}/service-events/new`}
                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
                                >
                                    <Wrench className="size-4"/>
                                    Create service event
                                </Link>

                                <Link
                                    href={`/vehicles/${vehicle.id}/issues/new`}
                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/15"
                                >
                                    <TriangleAlert className="size-4"/>
                                    Report issue
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Panel
                    title="Reported issues"
                    description="Latest issues connected to this vehicle."
                    count={issues.length}
                    href={`/issues?vehicleId=${vehicle.id}`}
                >
                    {issues.length > 0 ? (
                        <div className="divide-y divide-border">
                            {issues.map((issue) => (
                                <Link
                                    key={issue.id}
                                    href={`/issues/${issue.id}`}
                                    className="block px-5 py-4 transition-colors hover:bg-muted/40"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="line-clamp-2 break-words text-sm font-medium text-card-foreground">
                                            {issue.description}
                                        </p>
                                        <IssueBadge status={issue.status}/>
                                    </div>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {formatDateTime(issue.createdAt)}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <EmptyState text="No issues reported for this vehicle."/>
                    )}
                </Panel>

                <Panel
                    title="Service events"
                    description="Latest service records and planned maintenance."
                    count={serviceEvents.length}
                    href={`/vehicles/${vehicle.id}/service-events`}
                >
                    {serviceEvents.length > 0 ? (
                        <div className="divide-y divide-border">
                            {serviceEvents.map((event) => (
                                <Link
                                    key={event.id}
                                    href={`/service-events/${event.id}`}
                                    className="block px-5 py-4 transition-colors hover:bg-muted/40"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                            <Wrench className="size-4 text-muted-foreground"/>
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-card-foreground">
                                                {event.title}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {formatDateRange(event.startAt, event.endAt)}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <EmptyState text="No service events recorded."/>
                    )}
                </Panel>

                <Panel
                    title="Reservations"
                    description="Recent and upcoming reservations for this vehicle."
                    count={reservations.length}
                    href={`/reservations?vehicleId=${vehicle.id}`}
                >
                    {reservations.length > 0 ? (
                        <div className="divide-y divide-border">
                            {reservations.map((reservation) => (
                                <Link
                                    key={reservation.id}
                                    href={`/reservations/${reservation.id}`}
                                    className="block px-5 py-4 transition-colors hover:bg-muted/40"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                            <CalendarDays className="size-4 text-muted-foreground"/>
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-card-foreground">
                                                {reservation.origin} → {reservation.destination}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {formatDateRange(reservation.startAt, reservation.endAt)}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <EmptyState text="No reservations for this vehicle."/>
                    )}
                </Panel>
            </div>
        </div>
    );
}

function BackButton({onClick}: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
            <ArrowLeft className="size-4"/>
            Back
        </button>
    );
}

function VehicleHero({vehicle}: { vehicle: VehicleDetail }) {
    return (
        <div className="relative min-h-56 overflow-hidden bg-muted">
            {vehicle.imageUrl ? (
                <img
                    src={vehicle.imageUrl}
                    alt={vehicle.name}
                    className="absolute inset-0 h-full w-full object-cover"
                />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/70">
                    <div className="flex size-24 items-center justify-center rounded-3xl border border-border bg-background shadow-sm">
                        <Car className="size-12 text-muted-foreground"/>
                    </div>
                </div>
            )}

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-5">
                <p className="text-sm font-medium text-white/75">
                    {vehicle.brand || "Vehicle"}
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
                    {vehicle.name}
                </h2>
                <p className="mt-1 font-mono text-sm tracking-wide text-white/80">
                    {vehicle.licensePlate}
                </p>
            </div>
        </div>
    );
}

function Spec({
                  icon: Icon,
                  label,
                  value,
              }: {
    icon: React.ElementType;
    label: string;
    value: string;
}) {
    return (
        <div className="min-w-0 bg-card p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <Icon className="size-3.5 shrink-0"/>
                <span className="truncate">{label}</span>
            </div>
            <p className="mt-1 truncate text-sm font-semibold text-card-foreground">
                {value}
            </p>
        </div>
    );
}

function SmallStat({
                       label,
                       value,
                       tone,
                   }: {
    label: string;
    value: string;
    tone: "neutral" | "danger";
}) {
    return (
        <div
            className={cn(
                "rounded-lg border px-3 py-2.5",
                tone === "neutral" && "border-border bg-background",
                tone === "danger" && "border-destructive/25 bg-destructive/10",
            )}
        >
            <p className="text-xs text-muted-foreground">
                {label}
            </p>
            <p
                className={cn(
                    "mt-1 text-lg font-semibold",
                    tone === "neutral" && "text-card-foreground",
                    tone === "danger" && "text-destructive",
                )}
            >
                {value}
            </p>
        </div>
    );
}

function Panel({
                   title,
                   description,
                   count,
                   href,
                   children,
               }: {
    title: string;
    description: string;
    count: number;
    href: string;
    children: React.ReactNode;
}) {
    return (
        <section className="flex min-h-80 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
                <div className="min-w-0">
                    <h2 className="text-base font-semibold text-card-foreground">
                        {title}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>

                <Link
                    href={href}
                    className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                    View all
                </Link>
            </div>

            <div className="flex flex-1 flex-col">
                {children}
            </div>
        </section>
    );
}

function EmptyState({text}: { text: string }) {
    return (
        <div className="flex flex-1 p-5">
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground">
                    {text}
                </p>
            </div>
        </div>
    );
}

function StatusBadge({status}: { status: VehicleStatus }) {
    const labelByStatus: Record<VehicleStatus, string> = {
        ACTIVE: "Active",
        UNAVAILABLE: "Unavailable",
        ARCHIVED: "Archived",
    };

    return (
        <span
            className={cn(
                "inline-flex w-fit items-center rounded-full border px-3 py-1 text-sm font-medium",
                status === "ACTIVE" && "border-success/25 bg-success/10 text-success",
                status === "UNAVAILABLE" && "border-warning/40 bg-warning/15 text-warning-foreground",
                status === "ARCHIVED" && "border-border bg-muted text-muted-foreground",
            )}
        >
            {labelByStatus[status]}
        </span>
    );
}

function IssueBadge({status}: { status: "OPEN" | "RESOLVED" }) {
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

const fuelTypeLabels: Record<FuelType, string> = {
    PETROL: "Petrol",
    DIESEL: "Diesel",
    ELECTRIC: "Electric",
    HYBRID: "Hybrid",
    LPG: "LPG",
    CNG: "CNG",
    OTHER: "Other",
};

function formatKm(value: number) {
    return `${new Intl.NumberFormat("en-GB").format(value)} km`;
}

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function formatDateRange(startValue: string, endValue: string) {
    if (isSameCalendarDay(startValue, endValue)) {
        return `${formatSimpleDate(startValue)}, ${formatTime(startValue)}–${formatTime(endValue)}`;
    }

    return `${formatDateTime(startValue)} – ${formatDateTime(endValue)}`;
}

function formatSimpleDate(value: string) {
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

function isSameCalendarDay(startValue: string, endValue: string) {
    const start = new Date(startValue);
    const end = new Date(endValue);

    return (
        start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth() &&
        start.getDate() === end.getDate()
    );
}