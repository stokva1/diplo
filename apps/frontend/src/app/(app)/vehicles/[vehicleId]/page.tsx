"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {
    Archive,
    ArrowLeft,
    CalendarDays,
    Car,
    FileText,
    Fuel,
    Gauge,
    Hash, Pencil,
    TriangleAlert,
    User,
    Wrench,
} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {cn} from "@/lib/utils";
import {EmptyState} from "@/components/EmptyState";
import {Alert} from "@/components/Alert";
import {LoadingState} from "@/components/LoadingState";
import {PageHeader} from "@/components/PageHeader";
import {StatusBadge} from "@/components/StatusBadge";
import {formatDateTime, formatDateTimeRange} from "@/lib/date";
import {formatKm} from "@/lib/format";
import {MeResponse} from "@/types/api";

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
    status: "ACTIVE" | "CANCELLED";
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

const vehicleStatusLabels: Record<VehicleStatus, string> = {
    ACTIVE: "Active",
    UNAVAILABLE: "Unavailable",
    ARCHIVED: "Archived",
};

const vehicleStatusVariants: Record<
    VehicleStatus,
    "success" | "warning" | "muted"
> = {
    ACTIVE: "success",
    UNAVAILABLE: "warning",
    ARCHIVED: "muted",
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

    const [isAdmin, setIsAdmin] = useState(false);
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);

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
                const [
                    vehicleResponse,
                    serviceEventsResponse,
                    issuesResponse,
                    reservationsResponse,
                    meResponse,
                ] = await Promise.all([
                        apiRequest<VehicleDetail>(`/vehicles/${vehicleId}`, {token}),
                        apiRequest<ServiceEventsResponse>(
                            `/vehicles/${vehicleId}/service-events?page=1&limit=100`,
                            {token},
                        ),
                        apiRequest<IssuesResponse>(
                            `/issues?scope=managed&vehicleId=${vehicleId}&page=1&limit=100`,
                            {token},
                        ),
                        apiRequest<ReservationsResponse>(
                            `/reservations?scope=managed&vehicleId=${vehicleId}&page=1&limit=100&sort=-startAt`,
                            {token},
                        ),
                        apiRequest<MeResponse>("/me", {token}),
                    ]);

                setVehicle(vehicleResponse);
                setIsAdmin(meResponse.member.role === "ADMIN");
                setServiceEvents(
                    serviceEventsResponse.data.filter(
                        (serviceEvent) => serviceEvent.status === "ACTIVE",
                    ),
                );
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

    async function handleArchive() {
        const token = localStorage.getItem("accessToken");

        if (!token || !vehicle) {
            router.replace("/login");
            return;
        }

        setError(null);
        setIsArchiving(true);

        try {
            await apiRequest(`/vehicles/${vehicle.id}/archive`, {
                method: "POST",
                token,
            });

            setVehicle({
                ...vehicle,
                status: "ARCHIVED",
            });

            setShowArchiveConfirm(false);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Vehicle could not be archived.",
            );
        } finally {
            setIsArchiving(false);
        }
    }

    if (isLoading) {
        return <LoadingState label="Loading vehicle detail..." />;
    }

    if (error && !vehicle) {
        return (
            <div className="mx-auto max-w-6xl">
                <BackButton onClick={() => router.back()}/>

                <Alert variant="error">
                    {error}
                </Alert>
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
                <PageHeader
                    title={vehicle.name}
                    description={`${vehicle.brand} ${vehicle.model} · ${vehicle.licensePlate}`}
                />
                <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge
                        size="md"
                        variant={vehicleStatusVariants[vehicle.status]}
                    >
                        {vehicleStatusLabels[vehicle.status]}
                    </StatusBadge>

                    {isAdmin && vehicle.status !== "ARCHIVED" ? (
                        <div className="flex justify-between gap-2">
                            <Link
                                href={`/vehicles/${vehicle.id}/edit`}
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                            >
                                <Pencil className="size-4"/>
                                Edit
                            </Link>
                            <button
                                type="button"
                                onClick={() => setShowArchiveConfirm(true)}
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                            >
                                <Archive className="size-4"/>
                                Archive
                            </button>
                        </div>
                    ) : null}
                </div>

            </div>

            {error ? (
                <Alert variant="error" className="mb-5">
                    {error}
                </Alert>
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
                >
                    {issues.length > 0 ? (
                        <div className="divide-y divide-border">
                            {issues.map((issue) => (
                                <Link
                                    key={issue.id}
                                    href={`/manage/issues/${issue.id}`}
                                    className="block px-5 py-4 border-b transition-colors hover:bg-muted/40"
                                >
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
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="p-5">
                            <EmptyState
                                description="No reported issues yet."
                            />
                        </div>
                    )}
                </Panel>

                <Panel
                    title="Service events"
                    description="Latest service records and planned maintenance."
                    count={serviceEvents.length}
                >
                    {serviceEvents.length > 0 ? (
                        <div className="divide-y divide-border">
                            {serviceEvents.map((event) => (
                                <Link
                                    key={event.id}
                                    href={`/vehicles/${vehicle.id}/service-events/${event.id}`}
                                    className="block px-5 py-4 border-b transition-colors hover:bg-muted/40"
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
                                                {formatDateTimeRange(event.startAt, event.endAt)}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="p-5">
                            <EmptyState description="No service events recorded."/>
                        </div>
                    )}
                </Panel>

                <Panel
                    title="Reservations"
                    description="Latest reservations for this vehicle."
                    count={reservations.length}
                >
                    {reservations.length > 0 ? (
                        <div className="divide-y divide-border">
                            {reservations.map((reservation) => (
                                <Link
                                    key={reservation.id}
                                    href={`/reservations/${reservation.id}`}
                                    className="block px-5 py-4 border-b transition-colors hover:bg-muted/40"
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
                                                {formatDateTimeRange(reservation.startAt, reservation.endAt)}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="p-5">
                            <EmptyState description="No reservations for this vehicle."/>
                        </div>
                    )}
                </Panel>
            </div>
            {vehicle.status !== "ARCHIVED" && showArchiveConfirm ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="archive-vehicle-title"
                >
                    <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                                <Archive className="size-5 text-destructive"/>
                            </div>

                            <div>
                                <h2
                                    id="archive-vehicle-title"
                                    className="text-base font-semibold text-card-foreground"
                                >
                                    Archive vehicle?
                                </h2>

                                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                                    {vehicle.name} will no longer be available for new
                                    reservations. Any future reservations for this vehicle
                                    will be cancelled.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowArchiveConfirm(false)}
                                disabled={isArchiving}
                                className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleArchive}
                                disabled={isArchiving}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Archive className="size-4"/>
                                {isArchiving ? "Archiving..." : "Archive vehicle"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
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
                   children,
               }: {
    title: string;
    description: string;
    count: number;
    children: React.ReactNode;
}) {
    return (
        <section className="flex min-h-55 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b-2 border-border px-5 py-4">
                <div className="min-w-0">
                    <h2 className="text-base font-semibold text-card-foreground">
                        {title}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>
            </div>

            <div className="max-h-[22rem] flex-1 overflow-y-auto">
                {children}
            </div>
        </section>
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

