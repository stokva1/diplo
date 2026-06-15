"use client";

import Link from "next/link";
import {useEffect, useMemo, useState} from "react";
import {
    ArrowDownAZ,
    ArrowUpAZ,
    BookOpenText,
    Car,
    Check,
    ChevronDown,
    Download,
    Fuel,
    Gauge,
    Search,
    User,
} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {cn} from "@/lib/utils";
import {PageHeader} from "@/components/PageHeader";
import {EmptyState} from "@/components/EmptyState";

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
    startAt?: string;
    endAt?: string;
    date?: string;
    origin: string;
    destination: string;
    distanceKm: number;
    refueled: boolean;
    refuelingCost?: number | null;
    completedAt: string;
};

type TripLogsResponse = {
    data: TripLogListItem[];
    pagination?: {
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

export default function AdminTripLogsPage() {
    const [logs, setLogs] = useState<TripLogListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    const [refueled, setRefueled] = useState<RefueledFilter>("ALL");
    const [refueledOpen, setRefueledOpen] = useState(false);

    const [sortOpen, setSortOpen] = useState(false);
    const [sortField, setSortField] = useState<SortField>("completedAt");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

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
                    scope: "all",
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
    }, [from, to, refueled, sort]);

    const filteredLogs = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        if (normalizedSearch.length === 0) {
            return logs;
        }

        return logs.filter((log) => {
            return (
                log.vehicle.name.toLowerCase().includes(normalizedSearch) ||
                log.vehicle.licensePlate.toLowerCase().includes(normalizedSearch) ||
                log.member.name.toLowerCase().includes(normalizedSearch) ||
                log.origin.toLowerCase().includes(normalizedSearch) ||
                log.destination.toLowerCase().includes(normalizedSearch)
            );
        });
    }, [logs, search]);

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

    const refueledLogsCount = useMemo(
        () => logs.filter((log) => log.refueled).length,
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
                    description="All completed trips in the organization with mileage and refueling."
                />

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-[30rem]">
                    <SummaryCard
                        label="Trip logs"
                        value={logs.length}
                        icon={BookOpenText}
                    />
                    <SummaryCard
                        label="Distance"
                        value={formatKm(totalDistanceKm)}
                        icon={Gauge}
                    />
                    <SummaryCard
                        label="Fuel expenses"
                        value={formatCurrency(totalRefuelingCost)}
                        icon={Fuel}
                    />
                </div>
            </div>

            <section className="relative rounded-xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-5">
                    <div className="grid gap-3 xl:grid-cols-[1fr_auto] xl:items-end">
                        <div className="grid gap-3 lg:grid-cols-[1fr_150px_150px] lg:items-end">
                            <div className="relative min-w-0">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search by vehicle, plate, member or route..."
                                    className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
                                />
                            </div>

                            <Field label="From">
                                <input
                                    type="date"
                                    value={from}
                                    onChange={(event) => setFrom(event.target.value)}
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring"
                                />
                            </Field>

                            <Field label="To">
                                <input
                                    type="date"
                                    value={to}
                                    min={from || undefined}
                                    onChange={(event) => setTo(event.target.value)}
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring"
                                />
                            </Field>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setRefueledOpen((value) => !value)}
                                    className="inline-flex h-10 min-w-40 items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                                >
                                    {getRefueledFilterLabel(refueled)}
                                    <ChevronDown className="size-4 text-muted-foreground"/>
                                </button>

                                {refueledOpen ? (
                                    <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                                        {(["ALL", "true", "false"] as RefueledFilter[]).map((value) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => {
                                                    setRefueled(value);
                                                    setRefueledOpen(false);
                                                }}
                                                className={cn(
                                                    "flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                                                    refueled === value
                                                        ? "font-medium text-foreground"
                                                        : "text-muted-foreground",
                                                )}
                                            >
                                                {getRefueledFilterLabel(value)}

                                                {refueled === value ? (
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
                                    <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-border bg-popover p-2 text-sm text-popover-foreground shadow-lg">
                                        <div className="px-2 pb-2 pt-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
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

                            <button
                                type="button"
                                onClick={handleExport}
                                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 sm:w-auto"
                            >
                                <Download className="size-4"/>
                                Export
                            </button>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="px-5 py-4 text-sm text-muted-foreground">
                        Loading trip logs...
                    </div>
                ) : error ? (
                    <div className="m-5 rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {error}
                    </div>
                ) : filteredLogs.length > 0 ? (
                    <div className="overflow-hidden">
                        <div className="hidden gap-3 border-b border-border bg-muted/40 px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:grid md:grid-cols-[150px_1.1fr_1fr_1.4fr_120px_130px]">
                            <div>Date</div>
                            <div>Vehicle</div>
                            <div>Member</div>
                            <div>Route</div>
                            <div className="text-right">Distance</div>
                            <div className="text-right">Refueling</div>
                        </div>

                        <div className="divide-y divide-border">
                            {filteredLogs.map((log) => (
                                <Link
                                    key={log.id}
                                    href={`/reservations/${log.reservationId}`}
                                    className="group grid gap-3 px-5 py-4 transition-colors hover:bg-muted/40 md:grid-cols-[150px_1.1fr_1fr_1.4fr_120px_130px] md:items-center"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-card-foreground">
                                            {formatSimpleDate(log.startAt ?? log.date ?? log.completedAt)}
                                        </p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            {formatTripTimeRange(log.startAt, log.endAt)}
                                        </p>
                                    </div>

                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted md:hidden">
                                            <Car className="size-5 text-muted-foreground"/>
                                        </div>

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-card-foreground">
                                                {log.vehicle.name}
                                            </p>
                                            <p className="mt-0.5 font-mono text-xs tracking-wide text-muted-foreground">
                                                {log.vehicle.licensePlate}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="min-w-0">
                                        <p className="inline-flex max-w-full items-center gap-1.5 truncate text-sm text-muted-foreground">
                                            <User className="size-3.5 shrink-0"/>
                                            <span className="truncate">
                                                {log.member.name}
                                            </span>
                                        </p>
                                    </div>

                                    <div className="min-w-0">
                                        <p className="truncate text-sm text-card-foreground">
                                            {log.origin} → {log.destination}
                                        </p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">
                                            Completed {formatShortDateTime(log.completedAt)}
                                        </p>
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
                        </div>
                    </div>
                ) : (
                    <div className="p-5">
                        <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
                            <EmptyState
                                title="No trip logs found"
                                description="Try changing the search, date range or refueling filter."
                            />
                        </div>
                    </div>
                )}
            </section>
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
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
            </span>
            {children}
        </label>
    );
}

function SummaryCard({
                         label,
                         value,
                         icon: Icon,
                     }: {
    label: string;
    value: string | number;
    icon: React.ElementType;
}) {
    return (
        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-muted-foreground">
                    {label}
                </p>
                <Icon className="size-4 shrink-0 text-muted-foreground"/>
            </div>

            <p className="mt-1 truncate text-2xl font-semibold tracking-tight text-card-foreground">
                {value}
            </p>
        </div>
    );
}

function getRefueledFilterLabel(value: RefueledFilter) {
    const labels: Record<RefueledFilter, string> = {
        ALL: "All refueling",
        true: "Refueled",
        false: "Not refueled",
    };

    return labels[value];
}

function formatSimpleDate(value?: string | null) {
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
        year: "numeric",
    }).format(date);
}

function formatTime(value?: string | null) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
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

function getFileNameFromContentDisposition(value: string | null) {
    if (!value) {
        return null;
    }

    const match = value.match(/filename="([^"]+)"/);

    return match?.[1] ?? null;
}