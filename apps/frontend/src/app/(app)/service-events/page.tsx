"use client";

import Link from "next/link";
import {useEffect, useMemo, useState} from "react";
import {
    CalendarDays,
    Check,
    ChevronDown,
    Search,
    Wrench,
    XCircle,
} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {cn} from "@/lib/utils";
import {EmptyState} from "@/components/EmptyState";
import {Alert} from "@/components/Alert";
import {FilterBar} from "@/components/FilterBar";
import {LoadingState} from "@/components/LoadingState";
import {PageHeader} from "@/components/PageHeader";
import {StatCard} from "@/components/StatCard";
import {formatDateTimeRange} from "@/lib/date";
import {formatCurrency} from "@/lib/format";

type ServiceEventStatus = "ACTIVE" | "CANCELLED";
type StatusFilter = "ALL" | ServiceEventStatus;

type ServiceEventListItem = {
    id: string;
    status: ServiceEventStatus;
    vehicle: {
        id: string;
        name: string;
        licensePlate: string;
    };
    title: string;
    startAt: string;
    endAt: string;
    cost?: number | null;
    createdBy?: {
        id: string;
        name: string;
    } | null;
};

type ServiceEventsResponse = {
    data: ServiceEventListItem[];
};

export default function ServiceEventsPage() {
    const [serviceEvents, setServiceEvents] = useState<ServiceEventListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [statusMenuOpen, setStatusMenuOpen] = useState(false);

    useEffect(() => {
        async function loadServiceEvents() {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const response = await apiRequest<ServiceEventsResponse>(
                    "/service-events?scope=managed&page=1&limit=100",
                    {token},
                );

                setServiceEvents(response.data);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Service events could not be loaded.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadServiceEvents();
    }, []);

    const filteredServiceEvents = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return serviceEvents.filter((serviceEvent) => {
            const matchesStatus =
                statusFilter === "ALL" ||
                serviceEvent.status === statusFilter;

            const matchesSearch =
                normalizedSearch.length === 0 ||
                serviceEvent.title.toLowerCase().includes(normalizedSearch) ||
                serviceEvent.vehicle.name.toLowerCase().includes(normalizedSearch) ||
                serviceEvent.vehicle.licensePlate.toLowerCase().includes(normalizedSearch) ||
                serviceEvent.createdBy?.name.toLowerCase().includes(normalizedSearch);

            return matchesStatus && matchesSearch;
        });
    }, [search, serviceEvents, statusFilter]);

    const activeCount = serviceEvents.filter(
        (serviceEvent) => serviceEvent.status === "ACTIVE",
    ).length;

    const cancelledCount = serviceEvents.filter(
        (serviceEvent) => serviceEvent.status === "CANCELLED",
    ).length;

    if (isLoading) {
        return <LoadingState label="Loading service events..."/>;
    }

    return (
        <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <PageHeader
                    title="Service events"
                    description="Maintenance and repair records for vehicles under your management."
                />

                <div className="grid grid-cols-3 gap-3 lg:w-[30rem]">
                    <StatCard
                        label="All events"
                        value={serviceEvents.length}
                        icon={Wrench}
                    />
                    <StatCard
                        label="Active"
                        value={activeCount}
                        icon={CalendarDays}
                    />
                    <StatCard
                        label="Cancelled"
                        value={cancelledCount}
                        icon={XCircle}
                    />
                </div>
            </div>

            {error ? (
                <Alert variant="error" className="mb-5">
                    {error}
                </Alert>
            ) : null}

            <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-5">
                    <FilterBar
                        variant="embedded"
                        gridClassName="lg:grid-cols-[1fr_auto] lg:items-center"
                    >
                        <div className="relative min-w-0">
                            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>

                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search by vehicle, plate, title or creator..."
                                className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
                            />
                        </div>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setStatusMenuOpen((value) => !value)}
                                className="inline-flex h-10 min-w-44 items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                            >
                                {getStatusFilterLabel(statusFilter)}
                                <ChevronDown className="size-4 text-muted-foreground"/>
                            </button>

                            {statusMenuOpen ? (
                                <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                                    {(["ALL", "ACTIVE", "CANCELLED"] as StatusFilter[]).map(
                                        (status) => (
                                            <button
                                                key={status}
                                                type="button"
                                                onClick={() => {
                                                    setStatusFilter(status);
                                                    setStatusMenuOpen(false);
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
                                        ),
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </FilterBar>
                </div>

                {filteredServiceEvents.length > 0 ? (
                    <div className="divide-y divide-border">
                        {filteredServiceEvents.map((serviceEvent) => (
                            <Link
                                key={serviceEvent.id}
                                href={`/vehicles/${serviceEvent.vehicle.id}/service-events/${serviceEvent.id}`}
                                className={cn(
                                    "block border-l-4 border-transparent px-5 py-4 transition-colors hover:bg-muted/40",
                                    serviceEvent.status === "CANCELLED" &&
                                    "border-l-destructive bg-destructive/5 opacity-80",
                                )}
                            >
                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
                                    <div className="flex min-w-0 items-start gap-3">
                                        <div
                                            className={cn(
                                                "flex size-10 shrink-0 items-center justify-center rounded-lg border",
                                                serviceEvent.status === "CANCELLED"
                                                    ? "border-border bg-muted text-muted-foreground"
                                                    : "border-primary/20 bg-primary/10 text-primary",
                                            )}
                                        >
                                            {serviceEvent.status === "CANCELLED" ? (
                                                <XCircle className="size-5 text-destructive"/>
                                            ) : (
                                                <Wrench className="size-5"/>
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <p
                                                className={cn(
                                                    "line-clamp-2 break-words text-sm font-medium text-card-foreground",
                                                    serviceEvent.status === "CANCELLED" &&
                                                    "text-muted-foreground line-through",
                                                )}
                                            >
                                                {serviceEvent.title}
                                            </p>

                                            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <CalendarDays className="size-3.5"/>
                                                    {formatDateTimeRange(
                                                        serviceEvent.startAt,
                                                        serviceEvent.endAt,
                                                    )}
                                                </span>

                                                {serviceEvent.cost != null ? (
                                                    <span>
                                                        {formatCurrency(serviceEvent.cost)}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex min-w-0 items-start gap-3 lg:justify-end">
                                        <div className="min-w-0 lg:text-right">
                                            <p className="truncate text-sm font-semibold text-card-foreground">
                                                {serviceEvent.vehicle.name}
                                            </p>

                                            <p className="mt-0.5 font-mono text-xs tracking-wide text-muted-foreground">
                                                {serviceEvent.vehicle.licensePlate}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="p-5">
                        <EmptyState
                            title="No service events found"
                            description={
                                search || statusFilter !== "ALL"
                                    ? "Try changing the search or status filter."
                                    : "No service events have been created yet."
                            }
                        />
                    </div>
                )}
            </section>
        </div>
    );
}

function getStatusFilterLabel(status: StatusFilter) {
    if (status === "ACTIVE") {
        return "Active";
    }

    if (status === "CANCELLED") {
        return "Cancelled";
    }

    return "All statuses";
}