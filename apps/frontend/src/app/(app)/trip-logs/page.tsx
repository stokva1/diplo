"use client";

import Link from "next/link";
import {useEffect, useMemo, useState} from "react";
import {
    ArrowDownAZ,
    ArrowUpAZ,
    BookOpenText,
    Check,
    ChevronDown,
    Download,
    Fuel,
    Gauge,
} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {cn} from "@/lib/utils";
import {PageHeader} from "@/components/PageHeader";
import {EmptyState} from "@/components/EmptyState";
import {Alert} from "@/components/Alert";
import {FilterBar, FilterField} from "@/components/FilterBar";
import {LoadingState} from "@/components/LoadingState";
import {StatCard} from "@/components/StatCard";
import {formatDate, formatTime} from "@/lib/date";

type TripLogListItem = {
    id: string;
    reservationId: string;
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
    distanceKm: number;
    refueled: boolean;
    refuelingCost?: number | null;
    completedAt: string;
};

type TripLogsResponse = {
    data: TripLogListItem[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

type SortField = "completedAt" | "startAt";
type SortDirection = "asc" | "desc";
type RefueledFilter = "ALL" | "true" | "false";

const sortFieldLabels: Record<SortField, string> = {
    completedAt: "Completed date",
    startAt: "Reservation start",
};

export default function TripLogsPage() {
    const [logs, setLogs] = useState<TripLogListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [sortOpen, setSortOpen] = useState(false);
    const [sortField, setSortField] = useState<SortField>("completedAt");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [refueledOpen, setRefueledOpen] = useState(false);

    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [refueled, setRefueled] = useState<RefueledFilter>("ALL");

    const sort = sortDirection === "desc" ? `-${sortField}` : sortField;

    useEffect(() => {
        async function loadTripLogs() {
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
                    scope: "mine",
                    sort,
                });

                if (from) {
                    params.set("from", from);
                }

                if (to) {
                    params.set("to", to);
                }

                if (refueled !== "ALL") {
                    params.set("refueled", refueled);
                }

                const response = await apiRequest<TripLogsResponse>(
                    `/trip-logs?${params.toString()}`,
                    {token},
                );

                setLogs(response.data);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Trip logs could not be loaded.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadTripLogs();
    }, [sort, from, to, refueled]);

    const totalDistanceKm = useMemo(
        () => logs.reduce((sum, log) => sum + Number(log.distanceKm ?? 0), 0),
        [logs],
    );

    const totalRefuelingCost = useMemo(
        () =>
            logs.reduce((sum, log) => {
                if (!log.refueled || log.refuelingCost == null) {
                    return sum;
                }

                return sum + Number(log.refuelingCost);
            }, 0),
        [logs],
    );

    async function handleExport() {
        const token = localStorage.getItem("accessToken");

        if (!token) {
            setError("You need to be signed in to export trip logs.");
            return;
        }

        const params = new URLSearchParams({
            format: "xlsx",
        });

        if (from) {
            params.set("from", from);
        }

        if (to) {
            params.set("to", to);
        }

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/exports/trip-logs?${params.toString()}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (!response.ok) {
                throw new Error("Export could not be created.");
            }

            const blob = await response.blob();

            const contentDisposition = response.headers.get("Content-Disposition");
            const fileName =
                getFileNameFromContentDisposition(contentDisposition) ??
                "trip-logs.xlsx";

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();

            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Export could not be created.",
            );
        }
    }

    return (
        <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <PageHeader
                    title="Trip logs"
                    description="Completed trips with recorded mileage and refueling."
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-[30rem]">
                    <StatCard
                        label="Trips logged"
                        value={String(logs.length)}
                        icon={BookOpenText}
                    />
                    <StatCard
                        label="Total distance"
                        value={formatKm(totalDistanceKm)}
                        icon={Gauge}
                    />
                    <StatCard
                        label="Fuel expenses"
                        value={formatCurrency(totalRefuelingCost)}
                        icon={Fuel}
                    />
                </div>
            </div>

            <section className="rounded-xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-4">
                    <FilterBar
                        variant="embedded"
                        gridClassName="md:grid-cols-[1fr_1fr_180px_100px_120px] md:items-end"
                    >
                        <FilterField label="From">
                            <input
                                type="date"
                                value={from}
                                onChange={(event) => setFrom(event.target.value)}
                                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/10"
                            />
                        </FilterField>

                        <FilterField label="To">
                            <input
                                type="date"
                                value={to}
                                min={from || undefined}
                                onChange={(event) => setTo(event.target.value)}
                                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/10"
                            />
                        </FilterField>

                        <div className="relative">
                            <FilterField label="Refueling">
                                <button
                                    type="button"
                                    onClick={() => setRefueledOpen((value) => !value)}
                                    className="inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                                >
            <span>
              {refueled === "ALL"
                  ? "All"
                  : refueled === "true"
                      ? "Refueled"
                      : "Not refueled"}
            </span>
                                    <ChevronDown className="size-4 text-muted-foreground"/>
                                </button>
                            </FilterField>

                            {refueledOpen ? (
                                <div
                                    className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-border bg-popover p-2 text-sm text-popover-foreground shadow-lg">
                                    {[
                                        {value: "ALL", label: "All"},
                                        {value: "true", label: "Refueled"},
                                        {value: "false", label: "Not refueled"},
                                    ].map((item) => (
                                        <button
                                            key={item.value}
                                            type="button"
                                            onClick={() => {
                                                setRefueled(item.value as RefueledFilter);
                                                setRefueledOpen(false);
                                            }}
                                            className={cn(
                                                "flex w-full items-center justify-between rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted",
                                                refueled === item.value
                                                    ? "text-foreground"
                                                    : "text-muted-foreground",
                                            )}
                                        >
                                            {item.label}
                                            {refueled === item.value ? <Check className="size-4"/> : null}
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setSortOpen((value) => !value)}
                                className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted md:w-[100px]"
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
                                        {(["completedAt", "startAt"] as SortField[]).map((field) => (
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

                        <button
                            type="button"
                            onClick={handleExport}
                            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 md:w-[120px]"
                        >
                            <Download className="size-4"/>
                            Export
                        </button>
                    </FilterBar>
                </div>

                {isLoading ? (
                    <LoadingState
                        variant="inline"
                        label="Loading trip logs..."
                    />
                ) : error ? (
                    <div className="p-5">
                        <Alert variant="error">{error}</Alert>
                    </div>
                ) : (
                    <>
                        <div
                            className="hidden gap-3 border-b border-border bg-muted/40 px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:grid md:grid-cols-[150px_1.1fr_1.5fr_120px_130px]">
                            <div>Date</div>
                            <div>Vehicle</div>
                            <div>Route</div>
                            <div className="text-right">Distance</div>
                            <div className="text-right">Refueling</div>
                        </div>

                        <div className="divide-y divide-border">
                            {logs.map((log) => (
                                <Link
                                    key={log.id}
                                    href={`/reservations/${log.reservationId}`}
                                    className="group grid gap-3 px-5 py-4 transition-colors hover:bg-muted/40 md:grid-cols-[150px_1.1fr_1.5fr_120px_130px] md:items-center"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted md:hidden">
                                            <BookOpenText className="size-5 text-muted-foreground"/>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-card-foreground">
                                                {formatDate(log.startAt)}
                                            </p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {formatTripTimeRange(log.startAt, log.endAt)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-card-foreground">
                                            {log.vehicle.name}
                                        </p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {log.vehicle.licensePlate}
                                        </p>
                                    </div>

                                    <div className="min-w-0 text-sm text-muted-foreground">
                                    <span className="block truncate">
                                        {log.origin} → {log.destination}
                                    </span>
                                    </div>

                                    <div className="text-sm font-medium text-card-foreground md:text-right">
                                        {formatKm(log.distanceKm)}
                                    </div>

                                    <div className="text-sm md:text-right">
                                        {log.refueled ? (
                                            <span className="font-medium text-card-foreground">
                                            {formatCurrency(Number(log.refuelingCost ?? 0))}
                                        </span>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </div>
                                </Link>
                            ))}

                            {logs.length === 0 ? (
                                <div className="p-5">
                                    <EmptyState
                                        title="No trip logs"
                                        description="No trip logs found for the selected filters."
                                    />
                                </div>
                            ) : null}
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}

function formatKm(value: number) {
    return `${new Intl.NumberFormat("en-GB").format(value)} km`;
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: "CZK",
        maximumFractionDigits: 0,
    }).format(value);
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

function formatTripTimeRange(startValue?: string | null, endValue?: string | null) {
    if (!startValue || !endValue) {
        return "—";
    }

    if (isSameCalendarDay(startValue, endValue)) {
        return `${formatTime(startValue)}–${formatTime(endValue)}`;
    }

    return `${formatShortDateTime(startValue)} – ${formatShortDateTime(endValue)}`;
}

function getFileNameFromContentDisposition(value: string | null) {
    if (!value) {
        return null;
    }

    const match = value.match(/filename="([^"]+)"/);

    return match?.[1] ?? null;
}