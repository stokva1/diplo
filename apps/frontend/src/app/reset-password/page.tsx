"use client";

import Link from "next/link";
import {useRouter, useSearchParams} from "next/navigation";
import {Suspense, useState} from "react";
import {ArrowLeft, CheckCircle2, LockKeyhole} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {Alert} from "@/components/Alert";
import {LoadingState} from "@/components/LoadingState";

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const token = searchParams.get("token") ?? "";

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReset, setIsReset] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!token) {
            setError("This password reset link is invalid.");
            return;
        }

        if (!newPassword || !confirmPassword) {
            setError("Complete both password fields.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setError(null);
        setIsSubmitting(true);

        try {
            await apiRequest<void>("/auth/password-reset/confirm", {
                method: "POST",
                body: {
                    token,
                    newPassword,
                },
            });

            setIsReset(true);

            window.setTimeout(() => {
                router.push("/login");
            }, 1400);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Password could not be reset.",
            );
        } finally {
            setIsSubmitting(false);
        }
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
                            Choose a new password.
                        </h1>

                        <p className="mt-4 text-sm leading-6 text-sidebar-foreground/70">
                            Your new password will be used the next time you sign in.
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
                                    <p className="text-sm font-semibold">FleetCore</p>
                                    <p className="text-xs text-muted-foreground">
                                        Fleet management
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                            {isReset ? (
                                <div className="py-4 text-center">
                                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/10">
                                        <CheckCircle2 className="size-6 text-success"/>
                                    </div>

                                    <h1 className="mt-4 text-2xl font-semibold tracking-tight text-card-foreground">
                                        Password updated
                                    </h1>

                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                        Your password has been changed. Redirecting you to sign in…
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        <ArrowLeft className="size-4"/>
                                        Back to sign in
                                    </Link>

                                    <div className="mb-6">
                                        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                                            <LockKeyhole className="size-5 text-muted-foreground"/>
                                        </div>

                                        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-card-foreground">
                                            Set a new password
                                        </h1>

                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                            Choose a secure password for your account.
                                        </p>
                                    </div>

                                    <form className="space-y-4" onSubmit={handleSubmit}>
                                        <div>
                                            <label
                                                htmlFor="new-password"
                                                className="mb-1.5 block text-sm font-medium text-card-foreground"
                                            >
                                                New password
                                            </label>

                                            <input
                                                id="new-password"
                                                type="password"
                                                value={newPassword}
                                                onChange={(event) => setNewPassword(event.target.value)}
                                                autoComplete="new-password"
                                                className={inputClassName}
                                            />
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="confirm-password"
                                                className="mb-1.5 block text-sm font-medium text-card-foreground"
                                            >
                                                Confirm new password
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
                                            <LockKeyhole className="size-4"/>
                                            {isSubmitting
                                                ? "Updating password..."
                                                : "Update password"}
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

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<LoadingState label="Loading..."/>}>
            <ResetPasswordContent/>
        </Suspense>
    );
}

const inputClassName =
    "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/10";