"use client";

import Link from "next/link";
import {useEffect, useMemo, useState} from "react";
import {
    ArrowDownAZ,
    ArrowUpAZ,
    Car,
    Check,
    ChevronDown,
    Search,
    Shield,
    User,
    UserRoundX,
    Users,
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
import {formatDate} from "@/lib/date";

type MemberRole = "ADMIN" | "MEMBER";
type MemberStatus = "ACTIVE" | "DISABLED";
type StatusFilter = "ALL" | MemberStatus;
type SortField = "name" | "createdAt";
type SortDirection = "asc" | "desc";

const sortFieldLabels: Record<SortField, string> = {
    name: "Name",
    createdAt: "Created date",
};

type MemberListItem = {
    id: string;
    userId: string;
    name: string;
    email: string;
    role: MemberRole;
    status: MemberStatus;
    managedVehicles: {
        id: string;
        name: string;
        licensePlate: string;
    }[];
    createdAt: string;
};

type MembersResponse = {
    data: MemberListItem[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

const memberStatusLabels: Record<MemberStatus, string> = {
    ACTIVE: "Active",
    DISABLED: "Disabled",
};

const memberStatusVariants: Record<MemberStatus, "success" | "muted"> = {
    ACTIVE: "success",
    DISABLED: "muted",
};

export default function AdminMembersPage() {
    const [members, setMembers] = useState<MemberListItem[]>([]);
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
        async function loadMembers() {
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
                    sort,
                });

                if (search.trim()) {
                    params.set("search", search.trim());
                }

                if (statusFilter !== "ALL") {
                    params.set("status", statusFilter);
                }

                const response = await apiRequest<MembersResponse>(
                    `/members?${params.toString()}`,
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
    }, [search, statusFilter, sort]);

    const activeMembersCount = useMemo(
        () => members.filter((member) => member.status === "ACTIVE").length,
        [members],
    );

    const disabledMembersCount = useMemo(
        () => members.filter((member) => member.status === "DISABLED").length,
        [members],
    );

    const adminsCount = useMemo(
        () => members.filter((member) => member.role === "ADMIN").length,
        [members],
    );

    return (
        <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <PageHeader
                    title="Members"
                    description="Organization members, roles and assigned vehicle management."
                />

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-[30rem]">
                    <StatCard
                        label="Active"
                        value={activeMembersCount}
                        icon={Users}
                    />
                    <StatCard
                        label="Admins"
                        value={adminsCount}
                        icon={Shield}
                    />
                    <StatCard
                        label="Disabled"
                        value={disabledMembersCount}
                        icon={UserRoundX}
                        tone={disabledMembersCount > 0 ? "danger" : "neutral"}
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
                                placeholder="Search by name or email..."
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
                                        {(["ALL", "ACTIVE", "DISABLED"] as StatusFilter[]).map((status) => (
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
                                            {(["name", "createdAt"] as SortField[]).map((field) => (
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
                        label="Loading members..."
                    />
                ) : error ? (
                    <Alert variant="error" className="m-5">
                        {error}
                    </Alert>
                ) : members.length > 0 ? (
                    <div className="overflow-hidden">
                        <div
                            className="hidden gap-3 border-b border-border bg-muted/40 px-5 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:grid md:grid-cols-[1.3fr_1fr_1.4fr_130px_130px]">
                            <div>Member</div>
                            <div>Role</div>
                            <div>Managed vehicles</div>
                            <div>Created</div>
                            <div className="text-right">Status</div>
                        </div>

                        <div className="divide-y divide-border">
                            {members.map((member) => (
                                <Link
                                    key={member.id}
                                    href={`/members/${member.id}`}
                                    className="group grid gap-3 px-5 py-4 transition-colors hover:bg-muted/40 md:grid-cols-[1.3fr_1fr_1.4fr_130px_130px] md:items-center"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div
                                            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                                            <User className="size-5 text-muted-foreground"/>
                                        </div>

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-card-foreground">
                                                {member.name}
                                            </p>
                                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                {member.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <RoleBadge role={member.role}/>
                                    </div>

                                    <div className="min-w-0">
                                        {member.managedVehicles.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {member.managedVehicles.slice(0, 2).map((vehicle) => (
                                                    <span
                                                        key={vehicle.id}
                                                        className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground"
                                                    >
                                                        <Car className="size-3.5 shrink-0"/>
                                                        <span className="max-w-32 truncate">
                                                            {vehicle.name}
                                                        </span>
                                                    </span>
                                                ))}

                                                {member.managedVehicles.length > 2 ? (
                                                    <span
                                                        className="inline-flex rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                                        +{member.managedVehicles.length - 2}
                                                    </span>
                                                ) : null}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-muted-foreground">
                                                —
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-sm text-muted-foreground">
                                        {formatDate(member.createdAt)}
                                    </div>

                                    <div className="md:flex md:justify-end">
                                        <StatusBadge variant={memberStatusVariants[member.status]}>
                                            {memberStatusLabels[member.status]}
                                        </StatusBadge>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="p-5">
                        <EmptyState
                            title="No members found"
                            description="Try changing the search or status filter."
                        />
                    </div>
                )}
            </section>
        </div>
    );
}

function RoleBadge({role}: { role: MemberRole }) {
    return (
        <span
            className={cn(
                "inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-medium",
                role === "ADMIN" && "border-info/25 bg-info/10 text-info",
                role === "MEMBER" && "border-border bg-muted text-muted-foreground",
            )}
        >
            {role === "ADMIN" ? "Admin" : "Member"}
        </span>
    );
}


function getStatusFilterLabel(status: StatusFilter) {
    const labels: Record<StatusFilter, string> = {
        ALL: "All statuses",
        ACTIVE: "Active",
        DISABLED: "Disabled",
    };

    return labels[status];
}
