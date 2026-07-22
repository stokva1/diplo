"use client";

import Link from "next/link";
import {Suspense, useEffect, useState} from "react";
import {useRouter, useSearchParams} from "next/navigation";
import {Check, LockKeyhole, Mail, UserPlus} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {Alert} from "@/components/Alert";
import {LoadingState} from "@/components/LoadingState";

type InvitationDetail = {
    organizationName: string;
    email: string;
    name: string;
    expiresAt: string;
};

type AcceptInvitationResponse = {
    user: {
        id: string;
        email: string;
        name: string;
    };
    membership: {
        id: string;
        status: "ACTIVE";
        role: "MEMBER";
    };
};

function AcceptInvitationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const token = searchParams.get("token") ?? "";

    const [invitation, setInvitation] = useState<InvitationDetail | null>(null);
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [accepted, setAccepted] = useState(false);

    useEffect(() => {
        async function loadInvitation() {
            if (!token) {
                setError("This invitation link is invalid.");
                setIsLoading(false);
                return;
            }

            try {
                const response = await apiRequest<InvitationDetail>(
                    `/invitations/accept/${token}`,
                );

                setInvitation(response);
                setName(response.name);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "This invitation could not be loaded.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadInvitation();
    }, [token]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedName = name.trim();

        if (!trimmedName || !password || !confirmPassword) {
            setError("Complete all fields before continuing.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setError(null);
        setIsSubmitting(true);

        try {
            await apiRequest<AcceptInvitationResponse>(
                `/invitations/accept/${token}`,
                {
                    method: "POST",
                    body: {
                        name: trimmedName,
                        password,
                    },
                },
            );

            setAccepted(true);

            window.setTimeout(() => {
                router.push("/login");
            }, 1200);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Invitation could not be accepted.",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return <LoadingState label="Loading invitation..."/>;
    }

    return (
        <main className="min-h-screen bg-background">
            <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
                <section className="relative hidden overflow-hidden border-r border-border bg-sidebar px-10 py-8 text-sidebar-foreground lg:flex lg:flex-col">
                    <div className="absolute inset-0 translate-y-60 bg-[url('/login-cars-1.jpg')] bg-[length:100%_auto] bg-center bg-no-repeat opacity-70"/>
                    <div className="absolute inset-0 bg-gradient-to-b from-sidebar via-sidebar/95 via-55% to-sidebar/20"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-sidebar/30 to-sidebar"/>

                    <div className="relative z-10 flex h-12 items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sm font-semibold text-sidebar-primary-foreground">
                            FC
                        </div>

                        <div>
                            <p className="text-sm font-semibold text-sidebar-primary">
                                FleetCore
                            </p>
                            <p className="text-xs text-sidebar-foreground/60">
                                Fleet management
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 mt-24 max-w-md">
                        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-sidebar-primary">
                            You have been invited.
                        </h1>

                        <p className="mt-4 text-sm leading-6 text-sidebar-foreground/70">
                            Set your password to join the organization and start
                            using the fleet workspace.
                        </p>
                    </div>
                </section>

                <section className="flex min-h-screen items-center justify-center px-4 py-10 md:px-8">
                    <div className="w-full max-w-md">
                        <div className="mb-8 lg:hidden">
                            <div className="flex items-center gap-3">
                                <div className="flex size-9 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                                    FC
                                </div>

                                <div>
                                    <p className="text-sm font-semibold">
                                        FleetCore
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Fleet management
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                            {accepted ? (
                                <div className="py-6 text-center">
                                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/10">
                                        <Check className="size-6 text-success"/>
                                    </div>

                                    <h1 className="mt-4 text-2xl font-semibold tracking-tight text-card-foreground">
                                        Invitation accepted
                                    </h1>

                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                        Your account is ready. Redirecting you to sign in…
                                    </p>
                                </div>
                            ) : error && !invitation ? (
                                <div className="py-4">
                                    <h1 className="text-2xl font-semibold tracking-tight text-card-foreground">
                                        Invitation unavailable
                                    </h1>

                                    <Alert variant="error" className="mt-4">
                                        {error}
                                    </Alert>

                                    <Link
                                        href="/login"
                                        className="mt-5 inline-flex h-10 items-center justify-center rounded-md border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                                    >
                                        Go to sign in
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-6">
                                        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                                            <UserPlus className="size-5 text-muted-foreground"/>
                                        </div>

                                        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-card-foreground">
                                            Join {invitation?.organizationName}
                                        </h1>

                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                            Create your password to activate your member account.
                                        </p>
                                    </div>

                                    <form className="space-y-4" onSubmit={handleSubmit}>
                                        <div>
                                            <label
                                                htmlFor="name"
                                                className="mb-1.5 block text-sm font-medium text-card-foreground"
                                            >
                                                Full name
                                            </label>

                                            <input
                                                id="name"
                                                value={name}
                                                onChange={(event) => setName(event.target.value)}
                                                maxLength={255}
                                                autoComplete="name"
                                                className={inputClassName}
                                            />
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="email"
                                                className="mb-1.5 block text-sm font-medium text-card-foreground"
                                            >
                                                Email
                                            </label>

                                            <div className="relative">
                                                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>

                                                <input
                                                    id="email"
                                                    value={invitation?.email ?? ""}
                                                    readOnly
                                                    className={`${inputClassName} cursor-not-allowed bg-muted pl-9 text-muted-foreground`}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="password"
                                                className="mb-1.5 block text-sm font-medium text-card-foreground"
                                            >
                                                Password
                                            </label>

                                            <div className="relative">
                                                <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>

                                                <input
                                                    id="password"
                                                    type="password"
                                                    value={password}
                                                    onChange={(event) => setPassword(event.target.value)}
                                                    autoComplete="new-password"
                                                    className={`${inputClassName} pl-9`}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="confirm-password"
                                                className="mb-1.5 block text-sm font-medium text-card-foreground"
                                            >
                                                Confirm password
                                            </label>

                                            <input
                                                id="confirm-password"
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(event) =>
                                                    setConfirmPassword(event.target.value)
                                                }
                                                autoComplete="new-password"
                                                className={inputClassName}
                                            />
                                        </div>

                                        {error ? (
                                            <Alert variant="error">
                                                {error}
                                            </Alert>
                                        ) : null}

                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            <Check className="size-4"/>
                                            {isSubmitting
                                                ? "Creating account..."
                                                : "Accept invitation"}
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default function AcceptInvitationPage() {
    return (
        <Suspense fallback={<LoadingState label="Loading invitation..."/>}>
            <AcceptInvitationContent/>
        </Suspense>
    );
}

const inputClassName =
    "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/10";