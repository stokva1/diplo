"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {
    ArrowLeft,
    Car,
    Check,
    TriangleAlert,
} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {Alert} from "@/components/Alert";
import {LoadingState} from "@/components/LoadingState";
import {PageHeader} from "@/components/PageHeader";

type VehicleDetail = {
    id: string;
    name: string;
    licensePlate: string;
};

type CreateIssueResponse = {
    id: string;
    description: string;
    status: "OPEN";
};

export default function NewVehicleIssuePage() {
    const params = useParams<{vehicleId: string}>();
    const router = useRouter();

    const vehicleId = params.vehicleId;

    const [vehicle, setVehicle] = useState<VehicleDetail | null>(null);
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadVehicle() {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                setIsLoading(false);
                router.replace("/login");
                return;
            }

            try {
                const response = await apiRequest<VehicleDetail>(
                    `/vehicles/${vehicleId}`,
                    {token},
                );

                setVehicle(response);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Vehicle could not be loaded.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadVehicle();
    }, [router, vehicleId]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedDescription = description.trim();

        if (!trimmedDescription) {
            setError("Describe the issue.");
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
            await apiRequest<CreateIssueResponse>(
                `/vehicles/${vehicleId}/issues`,
                {
                    method: "POST",
                    token,
                    body: {
                        description: trimmedDescription,
                    },
                },
            );

            router.push(`/vehicles/${vehicleId}`);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Issue could not be reported.",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return <LoadingState label="Loading vehicle..."/>;
    }

    if (error && !vehicle) {
        return (
            <div className="mx-auto max-w-3xl">
                <Link
                    href={`/vehicles/${vehicleId}`}
                    className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4"/>
                    Back to vehicle
                </Link>

                <Alert variant="error">{error}</Alert>
            </div>
        );
    }

    if (!vehicle) {
        return null;
    }

    return (
        <div className="mx-auto max-w-3xl">
            <Link
                href={`/vehicles/${vehicleId}`}
                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
                <ArrowLeft className="size-4"/>
                Back to vehicle
            </Link>

            <div className="mb-6">
                <PageHeader
                    title="Report issue"
                    description="Describe a problem noticed with this vehicle."
                />
            </div>

            {error ? (
                <Alert variant="error" className="mb-5">
                    {error}
                </Alert>
            ) : null}

            <section className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Car className="size-5 text-muted-foreground"/>
                    </div>

                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-card-foreground">
                            {vehicle.name}
                        </p>

                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {vehicle.licensePlate}
                        </p>
                    </div>
                </div>
            </section>

            <form onSubmit={handleSubmit}>
                <section className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-warning/15">
                                <TriangleAlert className="size-5 text-warning-foreground"/>
                            </div>

                            <div>
                                <h2 className="text-base font-semibold text-card-foreground">
                                    Issue details
                                </h2>

                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    Include enough detail for the vehicle manager to understand the problem.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-5">
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium text-card-foreground">
                                Description
                            </span>

                            <textarea
                                rows={5}
                                maxLength={2000}
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                placeholder="Describe the issue..."
                                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/10"
                            />
                        </label>
                    </div>
                </section>

                <div className="mt-6 flex justify-end gap-3">
                    <Link
                        href={`/vehicles/${vehicleId}`}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Check className="size-4"/>
                        {isSubmitting ? "Reporting..." : "Report issue"}
                    </button>
                </div>
            </form>
        </div>
    );
}