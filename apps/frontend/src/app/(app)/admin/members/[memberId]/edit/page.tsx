"use client";

import Link from "next/link";
import {useEffect, useState} from "react";
import {useParams, useRouter} from "next/navigation";
import {
    ArrowLeft,
    Check,
    Mail,
    Shield,
    User,
} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {Alert} from "@/components/Alert";
import {LoadingState} from "@/components/LoadingState";
import {PageHeader} from "@/components/PageHeader";

type MemberRole = "ADMIN" | "MEMBER";

type MemberDetail = {
    id: string;
    user: {
        id: string;
        name: string;
        email: string;
    };
    role: MemberRole;
    status: "ACTIVE" | "DISABLED";
};

export default function EditMemberPage() {
    const params = useParams<{memberId: string}>();
    const router = useRouter();

    const memberId = params.memberId;

    const [member, setMember] = useState<MemberDetail | null>(null);
    const [name, setName] = useState("");
    const [role, setRole] = useState<MemberRole>("MEMBER");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
                setName(response.user.name);
                setRole(response.role);
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

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedName = name.trim();

        if (!trimmedName) {
            setError("Enter the member's name.");
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
            await apiRequest(`/members/${memberId}`, {
                method: "PATCH",
                token,
                body: {
                    name: trimmedName,
                    role,
                },
            });

            router.push(`/admin/members/${memberId}`);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Member could not be updated.",
            );
        } finally {
            setIsSubmitting(false);
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
            <Link
                href={`/admin/members/${member.id}`}
                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
                <ArrowLeft className="size-4"/>
                Back to member
            </Link>

            <div className="mb-6">
                <PageHeader
                    title="Edit member"
                    description="Update member details and organization access."
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
                        <User className="size-6 text-muted-foreground"/>
                    </div>

                    <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-card-foreground">
                            {member.user.name}
                        </p>

                        <div className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                            <Mail className="size-3.5 shrink-0"/>
                            <span className="truncate">
                                {member.user.email}
                            </span>
                        </div>
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
                            <Shield className="size-5 text-muted-foreground"/>
                        </div>

                        <div>
                            <h2 className="text-base font-semibold text-card-foreground">
                                Member settings
                            </h2>

                            <p className="mt-0.5 text-sm text-muted-foreground">
                                Update the member’s name and assigned role.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 p-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                        <label className="block">
                            <span className="mb-1.5 block text-sm font-medium text-card-foreground">
                                Full name
                            </span>

                            <input
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                maxLength={255}
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/10"
                            />
                        </label>

                        <div>
                            <span className="mb-1.5 block text-sm font-medium text-card-foreground">
                                Email address
                            </span>

                            <div className="flex h-10 items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 text-sm text-muted-foreground">
                                <Mail className="size-4 shrink-0"/>
                                <span className="truncate">
                                    {member.user.email}
                                </span>
                            </div>
                        </div>
                    </div>

                    <label className="block">
                        <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-card-foreground">
                            <Shield className="size-4"/>
                            Organization role
                        </span>

                        <select
                            value={role}
                            onChange={(event) =>
                                setRole(event.target.value as MemberRole)
                            }
                            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/10"
                        >
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                        </select>

                        <div className="mt-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
                            {role === "ADMIN"
                                ? "Admins can manage members, vehicles, organization settings and all operational records."
                                : "Members can create reservations, complete their own trip logs and report issues."}
                        </div>
                    </label>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-border bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
                    <Link
                        href={`/admin/members/${member.id}`}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        disabled={isSubmitting || !name.trim()}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Check className="size-4"/>
                        {isSubmitting ? "Saving..." : "Save changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}