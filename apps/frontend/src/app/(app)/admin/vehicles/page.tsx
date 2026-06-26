"use client";

import Link from "next/link";
import {useEffect, useMemo, useState} from "react";
import {
    ArrowDownAZ,
    ArrowUpAZ,
    Car,
    Check,
    ChevronDown,
    Gauge,
    Search,
    User,
    Wrench,
} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {cn} from "@/lib/utils";
import {PageHeader} from "@/components/PageHeader";
import {EmptyState} from "@/components/EmptyState";
import {Alert} from "@/components/Alert";
import {FilterBar} from "@/components/FilterBar";
import {LoadingState} from "@/components/LoadingState";
import {StatCard} from "@/components/StatCard";
import {StatusBadge} from "@/components/StatusBadge";
import {formatKm} from "@/lib/format";

type VehicleStatus = "ACTIVE" | "UNAVAILABLE" | "ARCHIVED";
type StatusFilter = "ALL" | VehicleStatus;

type FuelType =
    | "PETROL"
    | "DIESEL"
    | "ELECTRIC"
    | "HYBRID"
    | "LPG"
    | "CNG"
    | "OTHER";

type VehicleListItem = {
    id: string;
    name: string;
    licensePlate: string;
    brand?: string | null;
    model?: string | null;
    fuelType: FuelType;
    currentOdometerKm: number;
    status: VehicleStatus;
    manager?: {
        id: string;
        name: string;
    } | null;
};

type VehiclesResponse = {
    data: VehicleListItem[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

type SortField = "name" | "licensePlate" | "currentOdometerKm";
type SortDirection = "asc" | "desc";

const sortFieldLabels: Record<SortField, string> = {
    name: "Vehicle name",
    licensePlate: "License plate",
    currentOdometerKm: "Odometer",
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

export default function AdminVehiclesPage() {
    const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [statusOpen, setStatusOpen] = useState(false);

    const [sortOpen, setSortOpen] = useState(false);
    const [sortField, setSortField] = useState<SortField>("name");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    const sort = sortDirection === "desc" ? `-${sortField}` : sortField;

    useEffect(() => {
        async function loadVehicles() {
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

                if (search.trim()) {
                    params.set("search", search.trim());
                }

                if (statusFilter !== "ALL") {
                    params.set("status", statusFilter);
                }

                if (statusFilter === "ARCHIVED") {
                    params.set("includeArchived", "true");
                }

                const response = await apiRequest<VehiclesResponse>(
                    `/vehicles?${params.toString()}`,
                    {token},
                );

                setVehicles(response.data);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Vehicles could not be loaded.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadVehicles();
    }, [search, statusFilter, sort]);

    const activeVehiclesCount = useMemo(
        () => vehicles.filter((vehicle) => vehicle.status === "ACTIVE").length,
        [vehicles],
    );

    const unavailableVehiclesCount = useMemo(
        () => vehicles.filter((vehicle) => vehicle.status === "UNAVAILABLE").length,
        [vehicles],
    );

    const archivedVehiclesCount = useMemo(
        () => vehicles.filter((vehicle) => vehicle.status === "ARCHIVED").length,
        [vehicles],
    );

    const filteredVehicles = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        if (normalizedSearch.length === 0) {
            return vehicles;
        }

        return vehicles.filter((vehicle) => {
            return (
                vehicle.name.toLowerCase().includes(normalizedSearch) ||
                vehicle.licensePlate.toLowerCase().includes(normalizedSearch) ||
                vehicle.brand?.toLowerCase().includes(normalizedSearch) ||
                vehicle.model?.toLowerCase().includes(normalizedSearch) ||
                vehicle.manager?.name.toLowerCase().includes(normalizedSearch)
            );
        });
    }, [vehicles, search]);

    return (
        <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <PageHeader
                    title="Vehicles"
                    description="All vehicles in the organization with their current status and manager."
                />

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[40rem]">
                    <StatCard
                        label="All vehicles"
                        value={vehicles.length}
                        icon={Car}
                    />
                    <StatCard
                        label="Active"
                        value={activeVehiclesCount}
                        icon={Car}
                    />
                    <StatCard
                        label="Unavailable"
                        value={unavailableVehiclesCount}
                        icon={Wrench}
                        tone={unavailableVehiclesCount > 0 ? "warning" : "neutral"}
                    />
                    <StatCard
                        label="Archived"
                        value={archivedVehiclesCount}
                        icon={Car}
                    />
                </div>
            </div>

            <section className="relative rounded-xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-5">
                    <FilterBar
                        variant="embedded"
                        gridClassName="lg:grid-cols-[1fr_auto] lg:items-center"
                    >
                        <div className="relative min-w-0">
                            <Search
                                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search by vehicle, plate, brand, model or manager..."
                                className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
                            />
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setStatusOpen((value) => !value)}
                                    className="inline-flex h-10 min-w-44 items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                                >
                                    {getStatusFilterLabel(statusFilter)}
                                    <ChevronDown className="size-4 text-muted-foreground"/>
                                </button>

                                {statusOpen ? (
                                    <div
                                        className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                                        {(["ALL", "ACTIVE", "UNAVAILABLE", "ARCHIVED"] as StatusFilter[]).map((status) => (
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
                                            {(["name", "licensePlate", "currentOdometerKm"] as SortField[]).map((field) => (
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
                        label="Loading vehicles..."
                        variant="inline"
                    />
                ) : error ? (
                    <Alert variant="error" className="m-5">
                        {error}
                    </Alert>
                ) : filteredVehicles.length > 0 ? (
                    <div className="overflow-hidden">
                        <div
                            className="hidden gap-3 border-b border-border bg-muted/40 px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:grid md:grid-cols-[1.4fr_1fr_1fr_1fr_130px_130px]">
                            <div>Vehicle</div>
                            <div>Brand / model</div>
                            <div>Manager</div>
                            <div>Fuel</div>
                            <div className="text-right">Odometer</div>
                            <div className="text-right">Status</div>
                        </div>

                        <div className="divide-y divide-border">
                            {filteredVehicles.map((vehicle) => (
                                <Link
                                    key={vehicle.id}
                                    href={`/vehicles/${vehicle.id}`}
                                    className="group grid gap-3 px-5 py-4 transition-colors hover:bg-muted/40 md:grid-cols-[1.4fr_1fr_1fr_1fr_130px_130px] md:items-center"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div
                                            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                            <Car className="size-5 text-muted-foreground"/>
                                        </div>

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-card-foreground">
                                                {vehicle.name}
                                            </p>
                                            <p className="mt-0.5 font-mono text-xs tracking-wide text-muted-foreground">
                                                {vehicle.licensePlate}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="min-w-0">
                                        <p className="truncate text-sm text-card-foreground">
                                            {[vehicle.brand, vehicle.model].filter(Boolean).join(" ") || "—"}
                                        </p>
                                    </div>

                                    <div className="min-w-0">
                                        <p className="inline-flex max-w-full items-center gap-1.5 truncate text-sm text-muted-foreground">
                                            <User className="size-3.5 shrink-0"/>
                                            <span className="truncate">
                                                {vehicle.manager?.name ?? "Unassigned"}
                                            </span>
                                        </p>
                                    </div>

                                    <div className="text-sm text-muted-foreground">
                                        {fuelTypeLabels[vehicle.fuelType]}
                                    </div>

                                    <div
                                        className="inline-flex items-center gap-1.5 text-sm font-medium text-card-foreground md:justify-end md:text-right">
                                        <Gauge className="size-3.5 text-muted-foreground md:hidden"/>
                                        {formatKm(vehicle.currentOdometerKm)}
                                    </div>

                                    <div className="md:flex md:justify-end">
                                        <StatusBadge variant={vehicleStatusVariants[vehicle.status]}>
                                            {vehicleStatusLabels[vehicle.status]}
                                        </StatusBadge>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="p-5">
                        <EmptyState
                            title="No vehicles found"
                            description="Try changing the search or status filter."
                        />
                    </div>
                )}
            </section>
        </div>
    );
}

function getStatusFilterLabel(status: StatusFilter) {
    const labels: Record<StatusFilter, string> = {
        ALL: "All statuses",
        ACTIVE: "Active",
        UNAVAILABLE: "Unavailable",
        ARCHIVED: "Archived",
    };

    return labels[status];
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
