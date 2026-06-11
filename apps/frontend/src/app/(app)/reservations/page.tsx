"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {
    ArrowDownAZ,
    ArrowUpAZ,
    CalendarPlus,
    Car, Check, ChevronDown,
    MapPin,
    TriangleAlert,
} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {cn} from "@/lib/utils";

type ReservationStatus = "ACTIVE" | "CANCELLED" | "FINISHED";

type SortField = "startAt" | "endAt" | "createdAt";
type SortDirection = "asc" | "desc";

const sortFieldLabels: Record<SortField, string> = {
    startAt: "Start date",
    endAt: "End date",
    createdAt: "Created date",
};

type ReservationListItem = {
    id: string;
    vehicle: {
        id: string;
        name: string;
        licensePlate: string;
    };
    startAt: string;
    endAt: string;
    createdAt?: string;
    origin: string;
    destination: string;
    purpose: string;
    status: ReservationStatus;
    hasTripLog?: boolean;
};

type ReservationsResponse =
    | ReservationListItem[]
    | {
    data: ReservationListItem[];
};

const filters: { key: "ALL" | ReservationStatus; label: string }[] = [
    {key: "ALL", label: "All"},
    {key: "ACTIVE", label: "Active"},
    {key: "FINISHED", label: "Finished"},
    {key: "CANCELLED", label: "Cancelled"},
];



export default function ReservationsPage() {
    const [reservations, setReservations] = useState<ReservationListItem[]>([]);
    const [filter, setFilter] = useState<"ALL" | ReservationStatus>("ALL");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sortOpen, setSortOpen] = useState(false);
    const [sortField, setSortField] = useState<SortField>("startAt");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    useEffect(() => {
        async function loadReservations() {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await apiRequest<ReservationsResponse>("/reservations", {
                    token,
                });

                setReservations(Array.isArray(response) ? response : response.data);
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
    }, []);

    const filteredReservations =
        filter === "ALL"
            ? reservations
            : reservations.filter((reservation) => reservation.status === filter);

    const list = [...filteredReservations].sort((a, b) => {
        const aValue = getSortValue(a, sortField);
        const bValue = getSortValue(b, sortField);

        if (sortDirection === "asc") {
            return aValue - bValue;
        }

        return bValue - aValue;
    });

    return (
        <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        Reservations
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Every vehicle booking you have made.
                    </p>
                </div>

                <Link
                    href="/reservations/new"
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
                >
                    <CalendarPlus className="size-4"/>
                    New reservation
                </Link>
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex-1 rounded-lg border border-border bg-muted/40 p-1">
                    <div className="relative grid grid-cols-4">
                        <div
                            className={cn(
                                "absolute inset-y-0 left-0 w-1/4 rounded-md bg-background shadow-sm transition-transform duration-300 ease-out",
                                filter === "ALL" && "translate-x-0",
                                filter === "ACTIVE" && "translate-x-full",
                                filter === "FINISHED" && "translate-x-[200%]",
                                filter === "CANCELLED" && "translate-x-[300%]",
                            )}
                        />

                        {filters.map((item) => {
                            const count =
                                item.key === "ALL"
                                    ? reservations.length
                                    : reservations.filter((reservation) => reservation.status === item.key)
                                        .length;

                            return (
                                <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => setFilter(item.key)}
                                    className={cn(
                                        "relative z-10 flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-200",
                                        filter === item.key
                                            ? "text-foreground"
                                            : "text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    {item.label}
                                    <span
                                        className={cn(
                                            "text-xs transition-colors duration-200",
                                            filter === item.key
                                                ? "text-muted-foreground"
                                                : "text-muted-foreground/80",
                                        )}
                                    >
                            {count}
                        </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setSortOpen((value) => !value)}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted sm:w-auto"
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
                        <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-border bg-popover p-2 text-sm text-popover-foreground shadow-lg">
                            <div className="px-2 pb-2 pt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                Sort by
                            </div>

                            <div className="space-y-1">
                                {(["startAt", "endAt", "createdAt"] as SortField[]).map((field) => (
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

                            <div className="px-2 pb-2 pt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
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

            {isLoading ? (
                <div className="rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground shadow-sm">
                    Loading reservations...
                </div>
            ) : error ? (
                <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-5 py-4 text-sm text-destructive">
                    {error}
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {list.map((reservation) => (
                        <Link
                            key={reservation.id}
                            href={`/reservations/${reservation.id}`}
                            className="group rounded-xl border border-border bg-card shadow-sm transition-all hover:border-ring/40 hover:bg-muted/40 hover:shadow-sm"
                        >
                            <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center">
                                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                                    <Car className="size-5 text-muted-foreground"/>
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="truncate text-sm font-semibold text-card-foreground">
                                            {reservation.vehicle.name}
                                        </p>
                                        <StatusBadge status={reservation.status}/>

                                        {reservation.status === "FINISHED" && reservation.hasTripLog === false ? (
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/25 bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                                                <TriangleAlert className="size-3.5"/>
                                                Trip log needed
                                            </span>
                                        ) : null}
                                    </div>

                                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                                        <MapPin className="size-3.5 shrink-0"/>
                                        <span className="truncate">
                                            {reservation.origin} → {reservation.destination}
                                        </span>
                                    </p>

                                    <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                                        {reservation.purpose}
                                    </p>
                                </div>

                                <div className="flex shrink-0 items-start justify-between gap-4 sm:w-64 sm:flex-col sm:items-end">
                                    <div className="text-left sm:text-right">
                                        <p className="text-sm font-medium text-card-foreground">
                                            {formatRelativeDate(reservation.startAt)}
                                        </p>
                                        <p className="mt-0.5 whitespace-nowrap text-xs leading-5 text-muted-foreground">
                                            {formatReservationRange(
                                                reservation.startAt,
                                                reservation.endAt,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}

                    {list.length === 0 ? (
                        <div className="rounded-xl border border-border bg-card px-5 py-12 text-center text-sm text-muted-foreground shadow-sm">
                            No reservations in this category.
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}

function StatusBadge({status}: { status: ReservationStatus }) {
    const labelByStatus: Record<ReservationStatus, string> = {
        ACTIVE: "Active",
        FINISHED: "Finished",
        CANCELLED: "Cancelled",
    };

    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                status === "ACTIVE" &&
                "border-info/25 bg-info/10 text-info",
                status === "FINISHED" &&
                "border-success/25 bg-success/10 text-success",
                status === "CANCELLED" &&
                "border-muted bg-muted text-muted-foreground",
            )}
        >
            {labelByStatus[status]}
        </span>
    );
}

function formatRelativeDate(value: string) {
    const date = new Date(value);
    const today = new Date();

    const dateOnly = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
    );
    const todayOnly = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
    );

    const diffDays = Math.round(
        (dateOnly.getTime() - todayOnly.getTime()) / 86_400_000,
    );

    if (diffDays === 0) {
        return "Today";
    }

    if (diffDays === 1) {
        return "Tomorrow";
    }

    if (diffDays === -1) {
        return "Yesterday";
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

function formatReservationRange(startValue: string, endValue: string) {
    if (isSameCalendarDay(startValue, endValue)) {
        return `${formatTime(startValue)}–${formatTime(endValue)}`;
    }

    return `${formatShortDateTime(startValue)} – ${formatShortDateTime(endValue)}`;
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

function getSortValue(reservation: ReservationListItem, field: SortField) {
    if (field === "createdAt") {
        return new Date(reservation.createdAt ?? reservation.startAt).getTime();
    }

    return new Date(reservation[field]).getTime();
}