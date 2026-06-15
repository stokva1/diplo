"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {
    CalendarDays,
    Car,
    CheckCircle2,
    TriangleAlert,
    Wrench,
} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {cn} from "@/lib/utils";
import {PageHeader} from "@/components/PageHeader";
import {EmptyState} from "@/components/EmptyState";

type DashboardVehicle = {
    id: string;
    name: string;
    licensePlate: string;
    brand?: string | null;
    model?: string | null;
    currentOdometerKm?: number | null;
    nextReservationAt: string | null;
    nextServiceAt: string | null;
    openIssuesCount: number;
    missingTripLogsCount: number;
    imageUrl?: string | null;
};

type ManagedVehiclesDashboardResponse = {
    vehicles: DashboardVehicle[];
};

export default function ManagedVehiclesPage() {
    const [vehicles, setVehicles] = useState<DashboardVehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                const response = await apiRequest<ManagedVehiclesDashboardResponse>(
                    "/me/dashboard/vehicles",
                    {token},
                );

                setVehicles(response.vehicles);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Managed vehicles could not be loaded.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadVehicles();
    }, []);

    if (isLoading) {
        return (
            <div className="rounded-lg border border-border bg-card px-5 py-4 text-sm text-muted-foreground shadow-sm">
                Loading managed vehicles...
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-destructive/25 bg-destructive/10 px-5 py-4 text-sm text-destructive">
                {error}
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <PageHeader
                        title="Managed vehicles"
                        description="Overview of vehicles assigned to your management."
                    />
                </div>
            </div>

            {vehicles.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
                    {vehicles.map((vehicle) => (
                        <VehicleCard key={vehicle.id} vehicle={vehicle}/>
                    ))}
                </div>
            ) : (
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                    <div className="rounded-lg border border-dashed border-border px-4 py-10 text-center">
                        <EmptyState
                            title="No managed vehicles"
                            description="Vehicles assigned to your management will appear here."
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function VehicleCard({vehicle}: { vehicle: DashboardVehicle }) {
    const openIssuesCount = vehicle.openIssuesCount;
    const missingTripLogsCount = vehicle.missingTripLogsCount;

    return (
        <Link
            href={`/vehicles/${vehicle.id}`}
            className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:border-ring/40 hover:bg-muted/30 hover:shadow-md"
        >
            <VehicleImage vehicle={vehicle}/>

            <div className="flex flex-1 flex-col p-5">
                <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold tracking-tight text-card-foreground">
                        {vehicle.name}
                    </h2>

                    <p className="mt-1 font-mono text-sm tracking-wide text-muted-foreground">
                        {vehicle.licensePlate}
                    </p>

                    {(vehicle.brand || vehicle.model) ? (
                        <p className="mt-1 truncate text-sm text-muted-foreground">
                            {[vehicle.brand, vehicle.model].filter(Boolean).join(" ")}
                        </p>
                    ) : null}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4">
                    <VehicleInfo
                        icon={CalendarDays}
                        label="Next reservation"
                        value={
                            vehicle.nextReservationAt
                                ? formatDateTime(vehicle.nextReservationAt)
                                : "Not planned"
                        }
                        muted={!vehicle.nextReservationAt}
                    />

                    <VehicleInfo
                        icon={Wrench}
                        label="Next service"
                        value={
                            vehicle.nextServiceAt
                                ? formatSimpleDate(vehicle.nextServiceAt)
                                : "Not planned"
                        }
                        muted={!vehicle.nextServiceAt}
                    />
                </div>

                <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <VehicleAlert
                        type={openIssuesCount > 0 ? "danger" : "neutral"}
                        icon={openIssuesCount > 0 ? TriangleAlert : CheckCircle2}
                        text={
                            openIssuesCount > 0
                                ? `Open issues: ${openIssuesCount}`
                                : "No open issues"
                        }
                    />

                    <VehicleAlert
                        type={missingTripLogsCount > 0 ? "warning" : "neutral"}
                        icon={missingTripLogsCount > 0 ? CalendarDays : CheckCircle2}
                        text={
                            missingTripLogsCount > 0
                                ? `Missing logs: ${missingTripLogsCount}`
                                : "No missing logs"
                        }
                    />
                </div>
            </div>
        </Link>
    );
}

function VehicleImage({vehicle}: { vehicle: DashboardVehicle }) {
    if (vehicle.imageUrl) {
        return (
            <div className="h-32 overflow-hidden border-b border-border bg-muted">
                <img
                    src={vehicle.imageUrl}
                    alt={vehicle.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
            </div>
        );
    }

    return (
        <div className="flex h-32 items-center justify-center border-b border-border bg-muted/70">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
                <Car className="size-8 text-muted-foreground"/>
            </div>
        </div>
    );
}

function VehicleInfo({
                         icon: Icon,
                         label,
                         value,
                         muted,
                     }: {
    icon: React.ElementType;
    label: string;
    value: string;
    muted?: boolean;
}) {
    return (
        <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Icon className="size-3.5 shrink-0"/>
                <span className="truncate">{label}</span>
            </p>

            <p
                className={cn(
                    "mt-1 truncate text-sm font-medium",
                    muted
                        ? "italic text-muted-foreground"
                        : "text-card-foreground",
                )}
            >
                {value}
            </p>
        </div>
    );
}

function VehicleAlert({
                          type,
                          icon: Icon,
                          text,
                      }: {
    type: "neutral" | "danger" | "warning";
    icon: React.ElementType;
    text: string;
}) {
    return (
        <div
            className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2.5",
                type === "neutral" &&
                "border-border bg-background text-muted-foreground",
                type === "danger" &&
                "border-destructive/25 bg-destructive/10 text-destructive",
                type === "warning" &&
                "border-warning/40 bg-warning/15 text-warning-foreground",
            )}
        >
            <Icon className="size-4 shrink-0"/>

            <p className="min-w-0 truncate text-sm font-medium">
                {text}
            </p>
        </div>
    );
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

function formatSimpleDate(value: string) {
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date(value));
}