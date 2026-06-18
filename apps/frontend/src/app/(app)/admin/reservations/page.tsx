"use client";

import Link from "next/link";
import {useEffect, useMemo, useState} from "react";
import {
    ArrowDownAZ,
    ArrowUpAZ,
    CalendarDays,
    Car,
    Check,
    CheckCircle2,
    ChevronDown,
    ClipboardList,
    Search,
    TriangleAlert,
    User,
    XCircle,
} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {cn} from "@/lib/utils";
import {PageHeader} from "@/components/PageHeader";
import {EmptyState} from "@/components/EmptyState";
import {Alert} from "@/components/Alert";
import {FilterBar, FilterField} from "@/components/FilterBar";
import {LoadingState} from "@/components/LoadingState";
import {StatCard} from "@/components/StatCard";
import {StatusBadge} from "@/components/StatusBadge";
import {formatDate, formatTime} from "@/lib/date";

type ReservationStatus = "ACTIVE" | "FINISHED" | "CANCELLED";
type StatusFilter = "ALL" | ReservationStatus;
type MissingTripLogFilter = "ALL" | "true" | "false";

type ReservationListItem = {
    id: string;
    vehicle: {
        id: string;
        name: string;
        licensePlate: string;
    };
    member: {
        id: string;
        name: string;
    };
    startAt: string;
    endAt: string;
    origin: string;
    destination: string;
    purpose: string;
    status: ReservationStatus;
    hasTripLog: boolean;
};

type ReservationsResponse = {
    data: ReservationListItem[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

type SortField = "startAt" | "endAt";
type SortDirection = "asc" | "desc";

const sortFieldLabels: Record<SortField, string> = {
    startAt: "Reservation start",
    endAt: "Reservation end",
};

const reservationStatusLabels: Record<ReservationStatus, string> = {
    ACTIVE: "Active",
    FINISHED: "Finished",
    CANCELLED: "Cancelled",
};

const reservationStatusVariants: Record<
    ReservationStatus,
    "info" | "success" | "muted"
> = {
    ACTIVE: "info",
    FINISHED: "success",
    CANCELLED: "muted",
};

export default function AdminReservationsPage() {
    const [reservations, setReservations] = useState<ReservationListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [statusOpen, setStatusOpen] = useState(false);

    const [missingTripLog, setMissingTripLog] =
        useState<MissingTripLogFilter>("ALL");
    const [missingTripLogOpen, setMissingTripLogOpen] = useState(false);

    const [sortOpen, setSortOpen] = useState(false);
    const [sortField, setSortField] = useState<SortField>("startAt");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    const sort = sortDirection === "desc" ? `-${sortField}` : sortField;

    useEffect(() => {
        async function loadReservations() {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const params = new URLSearchParams({
                    page: "1",
                    limit: "50",
                    scope: "all",
                    sort,
                });

                if (statusFilter !== "ALL") {
                    params.set("status", statusFilter);
                }

                if (from) {
                    params.set("from", from);
                }

                if (to) {
                    params.set("to", to);
                }

                if (missingTripLog !== "ALL") {
                    params.set("missingTripLog", missingTripLog);
                }

                const response = await apiRequest<ReservationsResponse>(
                    `/reservations?${params.toString()}`,
                    {token},
                );

                setReservations(response.data);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Reservations could not be loaded.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadReservations();
    }, [statusFilter, from, to, missingTripLog, sort]);

    const filteredReservations = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        if (normalizedSearch.length === 0) {
            return reservations;
        }

        return reservations.filter((reservation) => {
            return (
                reservation.vehicle.name.toLowerCase().includes(normalizedSearch) ||
                reservation.vehicle.licensePlate.toLowerCase().includes(normalizedSearch) ||
                reservation.member.name.toLowerCase().includes(normalizedSearch) ||
                reservation.origin.toLowerCase().includes(normalizedSearch) ||
                reservation.destination.toLowerCase().includes(normalizedSearch) ||
                reservation.purpose.toLowerCase().includes(normalizedSearch)
            );
        });
    }, [reservations, search]);

    const activeReservationsCount = useMemo(
        () => reservations.filter((reservation) => reservation.status === "ACTIVE").length,
        [reservations],
    );

    const finishedReservationsCount = useMemo(
        () => reservations.filter((reservation) => reservation.status === "FINISHED").length,
        [reservations],
    );

    const cancelledReservationsCount = useMemo(
        () => reservations.filter((reservation) => reservation.status === "CANCELLED").length,
        [reservations],
    );

    const missingTripLogsCount = useMemo(
        () =>
            reservations.filter(
                (reservation) =>
                    reservation.status === "FINISHED" && !reservation.hasTripLog,
            ).length,
        [reservations],
    );

    return (
        <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <PageHeader
                    title="Reservations"
                    description="All organization reservations with vehicle, member and trip log status."
                />

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[40rem]">
                    <StatCard
                        label="Active"
                        value={activeReservationsCount}
                        icon={CalendarDays}
                    />
                    <StatCard
                        label="Finished"
                        value={finishedReservationsCount}
                        icon={CheckCircle2}
                    />
                    <StatCard
                        label="Cancelled"
                        value={cancelledReservationsCount}
                        icon={XCircle}
                    />
                    <StatCard
                        label="Missing logs"
                        value={missingTripLogsCount}
                        icon={TriangleAlert}
                        tone={missingTripLogsCount > 0 ? "warning" : "neutral"}
                    />
                </div>
            </div>

            <section className="relative rounded-xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-5">
                    <FilterBar
                        variant="embedded"
                        gridClassName="xl:grid-cols-[1fr_auto] xl:items-end"
                    >
                        <div className="grid gap-3 lg:grid-cols-[1fr_150px_150px] lg:items-end">
                            <div className="relative min-w-0">
                                <Search
                                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search by vehicle, plate, member, route or purpose..."
                                    className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
                                />
                            </div>

                            <FilterField label="From">
                                <input
                                    type="date"
                                    value={from}
                                    onChange={(event) => setFrom(event.target.value)}
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring"
                                />
                            </FilterField>

                            <FilterField label="To">
                                <input
                                    type="date"
                                    value={to}
                                    min={from || undefined}
                                    onChange={(event) => setTo(event.target.value)}
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring"
                                />
                            </FilterField>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setStatusOpen((value) => !value)}
                                    className="inline-flex h-10 min-w-40 items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                                >
                                    {getStatusFilterLabel(statusFilter)}
                                    <ChevronDown className="size-4 text-muted-foreground"/>
                                </button>

                                {statusOpen ? (
                                    <div
                                        className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                                        {(["ALL", "ACTIVE", "FINISHED", "CANCELLED"] as StatusFilter[]).map((status) => (
                                            <button
                                                key={status}
                                                type="button"
                                                onClick={() => {
                                                    setStatusFilter(status);
                                                    setStatusOpen(false);
                                                }}
                                                className={cn(
                                                    "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                                                    statusFilter === status
                                                        ? "font-medium text-foreground"
                                                        : "text-muted-foreground",
                                                )}
                                            >
                                                {getStatusFilterLabel(status)}

                                                {statusFilter === status ? (
                                                    <Check className="size-4"/>
                                                ) : null}
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                            </div>

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setMissingTripLogOpen((value) => !value)}
                                    className="inline-flex h-10 min-w-44 items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                                >
                                    {getMissingTripLogFilterLabel(missingTripLog)}
                                    <ChevronDown className="size-4 text-muted-foreground"/>
                                </button>

                                {missingTripLogOpen ? (
                                    <div
                                        className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                                        {(["ALL", "true", "false"] as MissingTripLogFilter[]).map((value) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => {
                                                    setMissingTripLog(value);
                                                    setMissingTripLogOpen(false);
                                                }}
                                                className={cn(
                                                    "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                                                    missingTripLog === value
                                                        ? "font-medium text-foreground"
                                                        : "text-muted-foreground",
                                                )}
                                            >
                                                {getMissingTripLogFilterLabel(value)}

                                                {missingTripLog === value ? (
                                                    <Check className="size-4"/>
                                                ) : null}
                                            </button>
                                        ))}
                                    </div>
                                ) : null}
                            </div>

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setSortOpen((value) => !value)}
                                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:w-auto"
                                >
                                    {sortDirection === "asc" ? (
                                        <ArrowUpAZ className="size-4 text-muted-foreground"/>
                                    ) : (
                                        <ArrowDownAZ className="size-4 text-muted-foreground"/>
                                    )}
                                    Sort
                                    <ChevronDown className="size-4 text-muted-foreground"/>
                                </button>

                                {sortOpen ? (
                                    <div
                                        className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-border bg-popover p-2 text-sm text-popover-foreground shadow-lg">
                                        <div
                                            className="px-2 pb-2 pt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                            Sort by
                                        </div>

                                        <div className="space-y-1">
                                            {(["startAt", "endAt"] as SortField[]).map((field) => (
                                                <button
                                                    key={field}
                                                    type="button"
                                                    onClick={() => setSortField(field)}
                                                    className={cn(
                                                        "flex w-full items-center justify-between rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted",
                                                        sortField === field
                                                            ? "text-foreground"
                                                            : "text-muted-foreground",
                                                    )}
                                                >
                                                    {sortFieldLabels[field]}
                                                    {sortField === field ? <Check className="size-4"/> : null}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="my-2 h-px bg-border"/>

                                        <div
                                            className="px-2 pb-2 pt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                            Direction
                                        </div>

                                        <div className="space-y-1">
                                            <button
                                                type="button"
                                                onClick={() => setSortDirection("asc")}
                                                className={cn(
                                                    "flex w-full items-center justify-between rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted",
                                                    sortDirection === "asc"
                                                        ? "text-foreground"
                                                        : "text-muted-foreground",
                                                )}
                                            >
                                                Ascending
                                                {sortDirection === "asc" ? <Check className="size-4"/> : null}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setSortDirection("desc")}
                                                className={cn(
                                                    "flex w-full items-center justify-between rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted",
                                                    sortDirection === "desc"
                                                        ? "text-foreground"
                                                        : "text-muted-foreground",
                                                )}
                                            >
                                                Descending
                                                {sortDirection === "desc" ? <Check className="size-4"/> : null}
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </FilterBar>
                </div>

                {isLoading ? (
                    <LoadingState
                        variant="inline"
                        label="Loading reservations..."
                    />
                ) : error ? (
                    <Alert variant="error" className="m-5">
                        {error}
                    </Alert>
                ) : filteredReservations.length > 0 ? (
                    <div className="overflow-hidden">
                        <div
                            className="hidden gap-3 border-b border-border bg-muted/40 px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:grid md:grid-cols-[150px_1.15fr_1fr_1.2fr_1fr_130px]">
                            <div>Date</div>
                            <div>Vehicle</div>
                            <div>Member</div>
                            <div>Route</div>
                            <div>Trip log</div>
                            <div className="text-right">Status</div>
                        </div>

                        <div className="divide-y divide-border">
                            {filteredReservations.map((reservation) => (
                                <Link
                                    key={reservation.id}
                                    href={`/reservations/${reservation.id}`}
                                    className="group grid gap-3 px-5 py-4 transition-colors hover:bg-muted/40 md:grid-cols-[150px_1.15fr_1fr_1.2fr_1fr_130px] md:items-center"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-card-foreground">
                                            {formatDate(reservation.startAt)}
                                        </p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {formatReservationTimeRange(
                                                reservation.startAt,
                                                reservation.endAt,
                                            )}
                                        </p>
                                    </div>

                                    <div className="flex min-w-0 items-center gap-3">
                                        <div
                                            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted md:hidden">
                                            <Car className="size-5 text-muted-foreground"/>
                                        </div>

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-card-foreground">
                                                {reservation.vehicle.name}
                                            </p>
                                            <p className="mt-0.5 font-mono text-xs tracking-wide text-muted-foreground">
                                                {reservation.vehicle.licensePlate}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="min-w-0">
                                        <p className="inline-flex max-w-full items-center gap-1.5 truncate text-sm text-muted-foreground">
                                            <User className="size-3.5 shrink-0"/>
                                            <span className="truncate">
                                                {reservation.member.name}
                                            </span>
                                        </p>
                                    </div>

                                    <div className="min-w-0">
                                        <p className="truncate text-sm text-card-foreground">
                                            {reservation.origin} → {reservation.destination}
                                        </p>
                                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                            {reservation.purpose}
                                        </p>
                                    </div>

                                    <div>
                                        <TripLogBadge reservation={reservation}/>
                                    </div>

                                    <div className="md:flex md:justify-end">
                                        <StatusBadge variant={reservationStatusVariants[reservation.status]}>
                                            {reservationStatusLabels[reservation.status]}
                                        </StatusBadge>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="p-5">
                        <EmptyState
                            title="No reservations found"
                            description="Try changing the search, date range or status filter."
                        />
                    </div>
                )}
            </section>
        </div>
    );
}

function TripLogBadge({reservation}: { reservation: ReservationListItem }) {
    if (reservation.hasTripLog) {
        return (
            <StatusBadge variant="success">
                <ClipboardList className="size-3.5"/>
                Completed
            </StatusBadge>
        );
    }

    if (reservation.status === "FINISHED") {
        return (
            <StatusBadge variant="warning">
                <TriangleAlert className="size-3.5"/>
                Missing
            </StatusBadge>
        );
    }

    return (
        <span className="text-sm text-muted-foreground">
            —
        </span>
    );
}

function getStatusFilterLabel(status: StatusFilter) {
    const labels: Record<StatusFilter, string> = {
        ALL: "All statuses",
        ACTIVE: "Active",
        FINISHED: "Finished",
        CANCELLED: "Cancelled",
    };

    return labels[status];
}

function getMissingTripLogFilterLabel(value: MissingTripLogFilter) {
    const labels: Record<MissingTripLogFilter, string> = {
        ALL: "All trip logs",
        true: "Missing trip log",
        false: "Has trip log",
    };

    return labels[value];
}

function formatShortDateTime(value?: string | null) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
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

function formatReservationTimeRange(
    startValue?: string | null,
    endValue?: string | null,
) {
    if (!startValue || !endValue) {
        return "—";
    }

    if (isSameCalendarDay(startValue, endValue)) {
        return `${formatTime(startValue)}–${formatTime(endValue)}`;
    }

    return `${formatShortDateTime(startValue)} – ${formatShortDateTime(endValue)}`;
}