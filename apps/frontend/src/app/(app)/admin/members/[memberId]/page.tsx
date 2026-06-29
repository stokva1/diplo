"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {
    ArrowLeft,
    Car,
    CalendarDays,
    Mail,
    Shield,
    User, UserRoundX, Pencil,
} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {Alert} from "@/components/Alert";
import {LoadingState} from "@/components/LoadingState";
import {PageHeader} from "@/components/PageHeader";
import {StatusBadge} from "@/components/StatusBadge";
import {cn} from "@/lib/utils";
import {formatDate} from "@/lib/date";

type MemberRole = "ADMIN" | "MEMBER";
type MemberStatus = "ACTIVE" | "DISABLED";

type MemberDetail = {
    id: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
    role: MemberRole;
    status: MemberStatus;
    managedVehicles: {
        id: string;
        name: string;
        licensePlate: string;
    }[];
    createdAt: string;
};

const memberStatusLabels: Record<MemberStatus, string> = {
    ACTIVE: "Active",
    DISABLED: "Disabled",
};

const memberStatusVariants: Record<MemberStatus, "success" | "muted"> = {
    ACTIVE: "success",
    DISABLED: "muted",
};

export default function AdminMemberDetailPage() {
    const params = useParams<{memberId: string}>();
    const router = useRouter();

    const memberId = params.memberId;

    const [member, setMember] = useState<MemberDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
    const [isDeactivating, setIsDeactivating] = useState(false);

    useEffect(() => {
        async function loadMember() {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                setIsLoading(false);
                router.replace("/login");
                return;
            }

            try {
                const response = await apiRequest<MemberDetail>(
                    `/members/${memberId}`,
                    {token},
                );

                setMember(response);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Member could not be loaded.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadMember();
    }, [memberId, router]);

    async function handleDeactivate() {
        const token = localStorage.getItem("accessToken");

        if (!token || !member) {
            router.replace("/login");
            return;
        }

        setError(null);
        setIsDeactivating(true);

        try {
            await apiRequest(`/members/${member.id}/deactivate`, {
                method: "POST",
                token,
            });

            setMember({
                ...member,
                status: "DISABLED",
            });

            setShowDeactivateConfirm(false);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Member could not be deactivated.",
            );
        } finally {
            setIsDeactivating(false);
        }
    }

    if (isLoading) {
        return <LoadingState label="Loading member..."/>;
    }

    if (error && !member) {
        return (
            <div className="mx-auto max-w-3xl">
                <Link
                    href="/admin/members"
                    className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4"/>
                    Back to members
                </Link>

                <Alert variant="error">{error}</Alert>
            </div>
        );
    }

    if (!member) {
        return null;
    }

    return (
        <div className="mx-auto max-w-3xl">
            <button
                type="button"
                onClick={() => router.back()}
                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
                <ArrowLeft className="size-4"/>
                Back
            </button>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <PageHeader
                    title="Member details"
                    description="Organization membership, role and assigned vehicle management."
                />

                <div className="flex shrink-0 gap-2">
                    <Link
                        href={`/admin/members/${member.id}/edit`}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                        <Pencil className="size-4"/>
                        Edit
                    </Link>

                    {member.status === "ACTIVE" ? (
                        <button
                            type="button"
                            onClick={() => setShowDeactivateConfirm(true)}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                        >
                            <UserRoundX className="size-4"/>
                            Deactivate
                        </button>
                    ) : null}
                </div>
            </div>

            {error ? (
                <Alert variant="error" className="mb-5">
                    {error}
                </Alert>
            ) : null}

            <section className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <User className="size-6 text-muted-foreground"/>
                    </div>

                    <div className="min-w-0 flex-1">
                        <h1 className="truncate text-base font-semibold text-card-foreground">
                            {member.user.name}
                        </h1>

                        <div className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                            <Mail className="size-3.5 shrink-0"/>
                            <span className="truncate">{member.user.email}</span>
                        </div>
                    </div>

                    <StatusBadge variant={memberStatusVariants[member.status]}>
                        {memberStatusLabels[member.status]}
                    </StatusBadge>
                </div>
            </section>

            <div className="space-y-6">
                <section className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                                <Shield className="size-5 text-muted-foreground"/>
                            </div>

                            <div>
                                <h2 className="text-base font-semibold text-card-foreground">
                                    Membership
                                </h2>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    Role and organization membership status.
                                </p>
                            </div>
                        </div>
                    </div>

                    <dl className="divide-y divide-border px-5">
                        <DetailRow
                            label="Role"
                            value={<RoleBadge role={member.role}/>}
                        />

                        <DetailRow
                            label="Status"
                            value={
                                <StatusBadge
                                    variant={memberStatusVariants[member.status]}
                                >
                                    {memberStatusLabels[member.status]}
                                </StatusBadge>
                            }
                        />

                        <DetailRow
                            label="Member since"
                            value={formatDate(member.createdAt)}
                        />
                    </dl>
                </section>

                <section className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                                <Car className="size-5 text-muted-foreground"/>
                            </div>

                            <div>
                                <h2 className="text-base font-semibold text-card-foreground">
                                    Managed vehicles
                                </h2>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    Vehicles this member is responsible for managing.
                                </p>
                            </div>
                        </div>
                    </div>

                    {member.managedVehicles.length > 0 ? (
                        <div className="divide-y divide-border">
                            {member.managedVehicles.map((vehicle) => (
                                <Link
                                    key={vehicle.id}
                                    href={`/vehicles/${vehicle.id}`}
                                    className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
                                >
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                        <Car className="size-5 text-muted-foreground"/>
                                    </div>

                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium text-card-foreground">
                                            {vehicle.name}
                                        </p>

                                        <p className="mt-0.5 text-sm text-muted-foreground">
                                            {vehicle.licensePlate}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                            This member does not manage any vehicles.
                        </div>
                    )}
                </section>

                <section className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                                <CalendarDays className="size-5 text-muted-foreground"/>
                            </div>

                            <div>
                                <h2 className="text-base font-semibold text-card-foreground">
                                    Account information
                                </h2>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    Basic organization membership details.
                                </p>
                            </div>
                        </div>
                    </div>

                    <dl className="divide-y divide-border px-5">
                        <DetailRow
                            label="Email"
                            value={member.user.email}
                        />

                        <DetailRow
                            label="Created"
                            value={formatDate(member.createdAt)}
                        />
                    </dl>
                </section>
            </div>
            {member.status === "ACTIVE" && showDeactivateConfirm ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="deactivate-member-title"
                >
                    <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                                <UserRoundX className="size-5 text-destructive"/>
                            </div>

                            <div>
                                <h2
                                    id="deactivate-member-title"
                                    className="text-base font-semibold text-card-foreground"
                                >
                                    Deactivate member?
                                </h2>

                                <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                                    {member.user.name} will no longer be able to use the application.
                                    Any future reservations belonging to this member will be cancelled.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDeactivateConfirm(false)}
                                disabled={isDeactivating}
                                className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleDeactivate}
                                disabled={isDeactivating}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-destructive px-4 text-sm font-medium text-destructive-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <UserRoundX className="size-4"/>
                                {isDeactivating ? "Deactivating..." : "Deactivate member"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}

function DetailRow({
                       label,
                       value,
                   }: {
    label: string;
    value: React.ReactNode;
}) {
    return (
        <div className="grid gap-1 py-3 text-sm sm:grid-cols-[170px_minmax(0,1fr)] sm:items-center sm:gap-4">
            <dt className="text-muted-foreground">{label}</dt>

            <dd className="min-w-0 break-words font-medium text-card-foreground sm:flex sm:justify-end">
                {value}
            </dd>
        </div>
    );
}

function RoleBadge({role}: {role: MemberRole}) {
    return (
        <span
            className={cn(
                "inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                role === "ADMIN" && "border-info/25 bg-info/10 text-info",
                role === "MEMBER" &&
                "border-border bg-muted text-muted-foreground",
            )}
        >
            {role === "ADMIN" ? "Admin" : "Member"}
        </span>
    );
}