"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {
    ArrowLeft,
    Car,
    Check,
    ClipboardPenLine,
} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {Alert} from "@/components/Alert";
import {LoadingState} from "@/components/LoadingState";
import {PageHeader} from "@/components/PageHeader";

type FuelType =
    | "PETROL"
    | "DIESEL"
    | "ELECTRIC"
    | "HYBRID"
    | "LPG"
    | "CNG"
    | "OTHER";

type MemberListItem = {
    id: string;
    name: string;
    email: string;
    status: "ACTIVE" | "DISABLED";
};

type MembersResponse = {
    data: MemberListItem[];
};

type CreateVehicleResponse = {
    id: string;
};

const fuelTypeOptions: { value: FuelType; label: string }[] = [
    {value: "PETROL", label: "Petrol"},
    {value: "DIESEL", label: "Diesel"},
    {value: "ELECTRIC", label: "Electric"},
    {value: "HYBRID", label: "Hybrid"},
    {value: "LPG", label: "LPG"},
    {value: "CNG", label: "CNG"},
    {value: "OTHER", label: "Other"},
];

export default function NewVehiclePage() {
    const router = useRouter();

    const [members, setMembers] = useState<MemberListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: "",
        licensePlate: "",
        brand: "",
        model: "",
        fuelType: "PETROL" as FuelType,
        currentOdometerKm: "",
        vin: "",
        managerMemberId: "",
        note: "",
    });

    useEffect(() => {
        async function loadMembers() {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                setIsLoading(false);
                router.replace("/login");
                return;
            }

            try {
                const response = await apiRequest<MembersResponse>(
                    "/members?page=1&limit=100&status=ACTIVE&sort=name",
                    {token},
                );

                setMembers(response.data);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Members could not be loaded.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadMembers();
    }, [router]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const name = form.name.trim();
        const licensePlate = form.licensePlate.trim();
        const brand = form.brand.trim();
        const model = form.model.trim();
        const vin = form.vin.trim();
        const note = form.note.trim();

        const currentOdometerKm = Number(form.currentOdometerKm);

        if (!name || !licensePlate || !brand || !model) {
            setError("Complete all required vehicle details.");
            return;
        }

        if (
            !form.currentOdometerKm ||
            Number.isNaN(currentOdometerKm) ||
            !Number.isInteger(currentOdometerKm) ||
            currentOdometerKm < 0
        ) {
            setError("Enter a valid whole-number odometer reading.");
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
            const response = await apiRequest<CreateVehicleResponse>(
                "/vehicles",
                {
                    method: "POST",
                    token,
                    body: {
                        name,
                        licensePlate,
                        brand,
                        model,
                        fuelType: form.fuelType,
                        currentOdometerKm,
                        status: "ACTIVE",
                        ...(vin ? {vin} : {}),
                        ...(form.managerMemberId
                            ? {managerMemberId: form.managerMemberId}
                            : {}),
                        ...(note ? {note} : {}),
                    },
                },
            );

            router.push(`/vehicles/${response.id}`);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Vehicle could not be created.",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return <LoadingState label="Loading form..."/>;
    }

    return (
        <div className="mx-auto max-w-3xl">
            <Link
                href="/admin/vehicles"
                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
                <ArrowLeft className="size-4"/>
                Back to vehicles
            </Link>

            <div className="mb-6">
                <PageHeader
                    title="Add vehicle"
                    description="Create a vehicle and optionally assign a vehicle manager."
                />
            </div>

            {error ? (
                <Alert variant="error" className="mb-5">
                    {error}
                </Alert>
            ) : null}

            <section className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Car className="size-6 text-muted-foreground"/>
                    </div>

                    <div>
                        <p className="text-base font-semibold text-card-foreground">
                            New organization vehicle
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                            The vehicle will be available for future reservations.
                        </p>
                    </div>
                </div>
            </section>

            <form
                onSubmit={handleSubmit}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
            >
                <div className="border-b border-border px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                            <ClipboardPenLine className="size-5 text-muted-foreground"/>
                        </div>

                        <div>
                            <h2 className="text-base font-semibold text-card-foreground">
                                Vehicle details
                            </h2>

                            <p className="mt-0.5 text-sm text-muted-foreground">
                                Add identification, fuel and management information.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 p-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Vehicle name">
                            <input
                                value={form.name}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        name: event.target.value,
                                    }))
                                }
                                maxLength={255}
                                placeholder="e.g. Škoda Octavia"
                                className={inputClassName}
                            />
                        </Field>

                        <Field label="License plate">
                            <input
                                value={form.licensePlate}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        licensePlate: event.target.value.toUpperCase(),
                                    }))
                                }
                                maxLength={30}
                                placeholder="e.g. 1AB 2345"
                                className={inputClassName}
                            />
                        </Field>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Brand">
                            <input
                                value={form.brand}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        brand: event.target.value,
                                    }))
                                }
                                maxLength={100}
                                placeholder="e.g. Škoda"
                                className={inputClassName}
                            />
                        </Field>

                        <Field label="Model">
                            <input
                                value={form.model}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        model: event.target.value,
                                    }))
                                }
                                maxLength={100}
                                placeholder="e.g. Octavia Combi"
                                className={inputClassName}
                            />
                        </Field>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Fuel type">
                            <select
                                value={form.fuelType}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        fuelType: event.target.value as FuelType,
                                    }))
                                }
                                className={inputClassName}
                            >
                                {fuelTypeOptions.map((fuelType) => (
                                    <option
                                        key={fuelType.value}
                                        value={fuelType.value}
                                    >
                                        {fuelType.label}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        <Field label="Current odometer (km)">
                            <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={form.currentOdometerKm}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        currentOdometerKm:
                                            event.target.value.replace(/\D/g, ""),
                                    }))
                                }
                                placeholder="e.g. 84250"
                                className={inputClassName}
                            />
                        </Field>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="VIN" optional>
                            <input
                                value={form.vin}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        vin: event.target.value.toUpperCase(),
                                    }))
                                }
                                maxLength={50}
                                placeholder="Vehicle identification number"
                                className={inputClassName}
                            />
                        </Field>

                        <Field label="Assigned manager" optional>
                            <select
                                value={form.managerMemberId}
                                onChange={(event) =>
                                    setForm((current) => ({
                                        ...current,
                                        managerMemberId: event.target.value,
                                    }))
                                }
                                className={inputClassName}
                            >
                                <option value="">No manager assigned</option>

                                {members.map((member) => (
                                    <option key={member.id} value={member.id}>
                                        {member.name} · {member.email}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    </div>

                    <Field label="Note" optional>
    <textarea
        rows={4}
        maxLength={255}
        value={form.note}
        onChange={(event) =>
            setForm((current) => ({
                ...current,
                note: event.target.value,
            }))
        }
        placeholder="Optional information about this vehicle..."
        className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/10"
    />
                    </Field>
                </div>

                <div
                    className="flex flex-col-reverse gap-3 border-t border-border bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
                    <Link
                        href="/admin/vehicles"
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Check className="size-4"/>
                        {isSubmitting ? "Creating..." : "Create vehicle"}
                    </button>
                </div>
            </form>
        </div>
    );
}

const inputClassName =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/10";

function Field({
                   label,
                   optional = false,
                   icon: Icon,
                   children,
               }: {
    label: string;
    optional?: boolean;
    icon?: React.ElementType;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-card-foreground">
                {Icon ? <Icon className="size-4"/> : null}
                {label}

                {optional ? (
                    <span className="font-normal text-muted-foreground/80">
                        (Optional)
                    </span>
                ) : null}
            </span>

            {children}
        </label>
    );
}