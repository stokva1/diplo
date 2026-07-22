"use client";

import Link from "next/link";
import {Suspense, useEffect, useMemo, useState} from "react";
import {useSearchParams} from "next/navigation";
import {
    ArrowDownAZ,
    ArrowUpAZ,
    CalendarDays,
    Check,
    CheckCircle2,
    ChevronDown,
    Search,
    TriangleAlert,
    User,
} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {cn} from "@/lib/utils";
import {PageHeader} from "@/components/PageHeader";
import {EmptyState} from "@/components/EmptyState";
import {Alert} from "@/components/Alert";
import {FilterBar} from "@/components/FilterBar";
import {LoadingState} from "@/components/LoadingState";
import {StatCard} from "@/components/StatCard";
import {formatDateTime} from "@/lib/date";

type IssueStatus = "OPEN" | "RESOLVED";
type StatusFilter = "ALL" | IssueStatus;
type SortField = "createdAt" | "resolvedAt";
type SortDirection = "asc" | "desc";

const sortFieldLabels: Record<SortField, string> = {
    createdAt: "Created date",
    resolvedAt: "Resolved date",
};

type IssueListItem = {
    id: string;
    vehicle: {
        id: string;
        name: string;
        licensePlate: string;
    };
    reservationId?: string | null;
    reportedBy: {
        id: string;
        name: string;
    };
    description: string;
    status: IssueStatus;
    createdAt: string;
};

type IssuesResponse = {
    data: IssueListItem[];
};

function IssuesContent() {
    const searchParams = useSearchParams();
    const vehicleId = searchParams.get("vehicleId");

    const [issues, setIssues] = useState<IssueListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [statusMenuOpen, setStatusMenuOpen] = useState(false);
    const [sortOpen, setSortOpen] = useState(false);
    const [sortField, setSortField] = useState<SortField>("createdAt");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

    const sort = sortDirection === "desc" ? `-${sortField}` : sortField;

    useEffect(() => {
        async function loadIssues() {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                setIsLoading(false);
                return;
            }

            const params = new URLSearchParams({
                scope: "managed",
                page: "1",
                limit: "50",
                sort,
            });

            if (vehicleId) {
                params.set("vehicleId", vehicleId);
            }

            setIsLoading(true);
            setError(null);

            try {
                const response = await apiRequest<IssuesResponse>(
                    `/issues?${params.toString()}`,
                    {token},
                );

                setIssues(response.data);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Issues could not be loaded.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadIssues();
    }, [vehicleId, sort]);

    const filteredIssues = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return issues.filter((issue) => {
            const matchesStatus =
                statusFilter === "ALL" || issue.status === statusFilter;

            const matchesSearch =
                normalizedSearch.length === 0 ||
                issue.description.toLowerCase().includes(normalizedSearch) ||
                issue.vehicle.name.toLowerCase().includes(normalizedSearch) ||
                issue.vehicle.licensePlate.toLowerCase().includes(normalizedSearch) ||
                issue.reportedBy.name.toLowerCase().includes(normalizedSearch);

            return matchesStatus && matchesSearch;
        });
    }, [issues, search, statusFilter]);

    const openIssuesCount = issues.filter((issue) => issue.status === "OPEN").length;
    const resolvedIssuesCount = issues.filter((issue) => issue.status === "RESOLVED").length;


    return (
        <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <PageHeader
                    title="Issues"
                    description="Reports connected to vehicles under your management."
                />

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-[30rem]">
                    <StatCard
                        label="All issues"
                        value={issues.length}
                        icon={TriangleAlert}
                    />
                    <StatCard
                        label="Resolved"
                        value={resolvedIssuesCount}
                        icon={CheckCircle2}
                    />
                    <StatCard
                        label="Open"
                        value={openIssuesCount}
                        icon={TriangleAlert}
                        tone={openIssuesCount > 0 ? "danger" : "neutral"}
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
                                placeholder="Search by vehicle, plate, reporter or description..."
                                className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring"
                            />
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
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
                                    <div
                                        className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
                                        {(["ALL", "OPEN", "RESOLVED"] as StatusFilter[]).map((status) => (
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
                                            {(["createdAt", "resolvedAt"] as SortField[]).map((field) => (
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
                        label="Loading issues..."
                    />
                ) : error ? (
                    <div className="p-5">
                        <Alert variant="error">
                            {error}
                        </Alert>
                    </div>
                ) : filteredIssues.length > 0 ? (
                    <div className="divide-y divide-border">
                        {filteredIssues.map((issue) => (
                            <IssueRow key={issue.id} issue={issue}/>
                        ))}
                    </div>
                ) : (
                    <div className="p-5">
                        <EmptyState
                            title="No issues found"
                            description="Try changing the search or status filter."
                        />
                    </div>
                )}
            </section>
        </div>
    );
}

function IssueRow({issue}: { issue: IssueListItem }) {
    return (
        <Link
            href={`/manage/issues/${issue.id}`}
            className="grid grid-cols-1 gap-4 px-5 py-4 transition-colors hover:bg-muted/40 lg:grid-cols-[1.5fr_1fr]"
        >
            <div className="flex min-w-0 items-start gap-3">
                <div
                    className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-lg border",
                        issue.status === "OPEN"
                            ? "border-warning/40 bg-warning/15 text-warning-foreground"
                            : "border-success/25 bg-success/10 text-success",
                    )}
                >
                    {issue.status === "OPEN" ? (
                        <TriangleAlert className="size-5"/>
                    ) : (
                        <CheckCircle2 className="size-5"/>
                    )}
                </div>

                <div className="min-w-0">
                    <p className="line-clamp-2 break-words text-sm font-medium text-card-foreground">
                        {issue.description}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                            <User className="size-3.5"/>
                            {issue.reportedBy.name}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="size-3.5"/>
                            {formatDateTime(issue.createdAt)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex min-w-0 items-start gap-3 lg:justify-end">
                <div className="min-w-0 lg:text-right">
                    <p className="truncate text-sm font-semibold text-card-foreground">
                        {issue.vehicle.name}
                    </p>
                    <p className="mt-0.5 font-mono text-xs tracking-wide text-muted-foreground">
                        {issue.vehicle.licensePlate}
                    </p>
                </div>
            </div>
        </Link>
    );
}

function getStatusFilterLabel(status: StatusFilter) {
    const labels: Record<StatusFilter, string> = {
        ALL: "All statuses",
        OPEN: "Open",
        RESOLVED: "Resolved",
    };

    return labels[status];
}

export default function IssuesPage() {
    return (
        <Suspense fallback={<LoadingState label="Loading..."/>}>
            <IssuesContent/>
        </Suspense>
    );
}