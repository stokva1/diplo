"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {
    ArrowLeft,
    Car,
    CheckCircle2,
    MapPin,
    TriangleAlert,
    Image as ImageIcon,
} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {Alert} from "@/components/Alert";
import {LoadingState} from "@/components/LoadingState";
import {PageHeader} from "@/components/PageHeader";
import {StatusBadge} from "@/components/StatusBadge";
import {formatDateTime, formatDateTimeRange} from "@/lib/date";
import {IssuePhoto} from "@/components/IssuePhoto";

type IssueStatus = "OPEN" | "RESOLVED";

type IssueDetail = {
    id: string;
    vehicle: {
        id: string;
        name: string;
        licensePlate: string;
    };
    reservation?: {
        id: string;
        startAt: string;
        endAt: string;
        origin: string;
        destination: string;
    } | null;
    reportedBy: {
        id: string;
        name: string;
    };
    description: string;
    status: IssueStatus;
    photos: {
        id: string;
        fileName: string;
    }[];
    resolvedBy?: {
        id: string;
        name: string;
    } | null;
    resolvedAt?: string | null;
    createdAt: string;
};

export default function IssueDetailPage() {
    const params = useParams<{issueId: string}>();
    const router = useRouter();

    const issueId = params.issueId;

    const [issue, setIssue] = useState<IssueDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isResolving, setIsResolving] = useState(false);
    const [showResolveConfirm, setShowResolveConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadIssue() {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                setIsLoading(false);
                router.replace("/login");
                return;
            }

            try {
                const response = await apiRequest<IssueDetail>(
                    `/issues/${issueId}`,
                    {token},
                );

                setIssue(response);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Issue could not be loaded.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadIssue();
    }, [issueId, router]);

    async function handleResolve() {
        if (!issue) {
            return;
        }

        const token = localStorage.getItem("accessToken");

        if (!token) {
            router.replace("/login");
            return;
        }

        setError(null);
        setIsResolving(true);

        try {
            const response = await apiRequest<{
                id: string;
                status: "RESOLVED";
                resolvedBy: {
                    id: string;
                    name: string;
                };
                resolvedAt: string;
            }>(
                `/issues/${issue.id}/resolve`,
                {
                    method: "POST",
                    token,
                },
            );

            setIssue({
                ...issue,
                status: response.status,
                resolvedBy: response.resolvedBy,
                resolvedAt: response.resolvedAt,
            });

            setShowResolveConfirm(false);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Issue could not be resolved.",
            );
        } finally {
            setIsResolving(false);
        }
    }

    if (isLoading) {
        return <LoadingState label="Loading issue..."/>;
    }

    if (error && !issue) {
        return (
            <div className="mx-auto max-w-3xl">
                <Link
                    href="/manage/issues"
                    className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="size-4"/>
                    Back to issues
                </Link>

                <Alert variant="error">{error}</Alert>
            </div>
        );
    }

    if (!issue) {
        return null;
    }

    return (
        <div className="mx-auto max-w-3xl">
            <Link
                href="/manage/issues"
                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
                <ArrowLeft className="size-4"/>
                Back to issues
            </Link>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <PageHeader
                    title="Issue details"
                    description="Reported vehicle problem and its resolution status."
                />

                <div className="flex shrink-0 items-center gap-2">
                    {issue.status === "RESOLVED" ? (
                        <StatusBadge size="md" variant="success">
                            Resolved
                        </StatusBadge>
                    ) : null}

                    {issue.status === "OPEN" ? (
                        <button
                            type="button"
                            onClick={() => setShowResolveConfirm(true)}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                        >
                            <CheckCircle2 className="size-4"/>
                            Resolve issue
                        </button>
                    ) : null}
                </div>
            </div>

            {error ? (
                <Alert variant="error" className="mb-5">
                    {error}
                </Alert>
            ) : null}

            {issue.status === "OPEN" && showResolveConfirm ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="resolve-issue-title"
                >
                    <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
                                <CheckCircle2 className="size-5 text-success"/>
                            </div>

                            <div className="min-w-0">
                                <h2
                                    id="resolve-issue-title"
                                    className="text-base font-semibold text-card-foreground"
                                >
                                    Resolve this issue?
                                </h2>

                                <p className="mt-1 text-sm text-muted-foreground">
                                    This marks the reported problem as resolved.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowResolveConfirm(false)}
                                disabled={isResolving}
                                className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Keep open
                            </button>

                            <button
                                type="button"
                                onClick={handleResolve}
                                disabled={isResolving}
                                className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isResolving ? "Resolving..." : "Resolve issue"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            <section className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Car className="size-5 text-muted-foreground"/>
                    </div>

                    <div className="min-w-0">
                        <Link
                            href={`/vehicles/${issue.vehicle.id}`}
                            className="block truncate text-sm font-semibold text-card-foreground hover:underline"
                        >
                            {issue.vehicle.name}
                        </Link>

                        <p className="mt-0.5 text-sm text-muted-foreground">
                            {issue.vehicle.licensePlate}
                        </p>
                    </div>
                </div>
            </section>

            <div className="space-y-6">
                <section className="rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-warning/15">
                                <TriangleAlert className="size-5 text-warning-foreground"/>
                            </div>

                            <div>
                                <h2 className="text-base font-semibold text-card-foreground">
                                    Reported issue
                                </h2>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    Problem description and reporting information.
                                </p>
                            </div>
                        </div>
                    </div>

                    <dl className="divide-y divide-border px-5">
                        <DetailRow
                            label="Description"
                            value={issue.description}
                            multiline
                        />

                        <DetailRow
                            label="Reported by"
                            value={issue.reportedBy.name}
                        />

                        <DetailRow
                            label="Reported"
                            value={formatDateTime(issue.createdAt)}
                        />
                    </dl>
                </section>

                {issue.photos.length > 0 ? (
                    <section className="rounded-xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                                    <ImageIcon className="size-5 text-muted-foreground"/>
                                </div>

                                <div>
                                    <h2 className="text-base font-semibold text-card-foreground">
                                        Photos
                                    </h2>

                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                        {issue.photos.length === 1
                                            ? "One photo was attached to this issue."
                                            : `${issue.photos.length} photos were attached to this issue.`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3">
                            {issue.photos.map((photo) => (
                                <IssuePhoto
                                    key={photo.id}
                                    fileId={photo.id}
                                    fileName={photo.fileName}
                                />
                            ))}
                        </div>
                    </section>
                ) : null}

                {issue.reservation ? (
                    <section className="rounded-xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                                    <MapPin className="size-5 text-muted-foreground"/>
                                </div>

                                <div>
                                    <h2 className="text-base font-semibold text-card-foreground">
                                        Related reservation
                                    </h2>
                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                        Reservation during which this issue was reported.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <dl className="divide-y divide-border px-5">
                            <DetailRow
                                label="Route"
                                value={`${issue.reservation.origin} → ${issue.reservation.destination}`}
                            />

                            <DetailRow
                                label="Time window"
                                value={formatDateTimeRange(
                                    issue.reservation.startAt,
                                    issue.reservation.endAt,
                                )}
                            />
                        </dl>
                    </section>
                ) : null}

                {issue.status === "RESOLVED" ? (
                    <section className="rounded-xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border px-5 py-4">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-success/10">
                                    <CheckCircle2 className="size-5 text-success"/>
                                </div>

                                <div>
                                    <h2 className="text-base font-semibold text-card-foreground">
                                        Resolution
                                    </h2>
                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                        This issue has been marked as resolved.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <dl className="divide-y divide-border px-5">
                            <DetailRow
                                label="Resolved by"
                                value={issue.resolvedBy?.name || "—"}
                            />

                            <DetailRow
                                label="Resolved"
                                value={
                                    issue.resolvedAt
                                        ? formatDateTime(issue.resolvedAt)
                                        : "—"
                                }
                            />
                        </dl>
                    </section>
                ) : null}
            </div>
        </div>
    );
}

function DetailRow({
                       label,
                       value,
                       multiline = false,
                   }: {
    label: string;
    value: string;
    multiline?: boolean;
}) {
    return (
        <div className="grid gap-1 py-3 text-sm sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4">
            <dt className="text-muted-foreground">{label}</dt>
            <dd
                className={
                    multiline
                        ? "whitespace-pre-wrap break-words font-medium text-card-foreground sm:text-right"
                        : "min-w-0 break-words font-medium text-card-foreground sm:text-right"
                }
            >
                {value}
            </dd>
        </div>
    );
}