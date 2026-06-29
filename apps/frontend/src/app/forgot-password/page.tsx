"use client";

import Link from "next/link";
import {useState} from "react";
import {ArrowLeft, CheckCircle2, Mail} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {Alert} from "@/components/Alert";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedEmail = email.trim().toLowerCase();

        if (!trimmedEmail) {
            setError("Enter your email address.");
            return;
        }

        setError(null);
        setIsSubmitting(true);

        try {
            await apiRequest<void>("/auth/password-reset/request", {
                method: "POST",
                body: {
                    email: trimmedEmail,
                },
            });

            setIsSent(true);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Password reset email could not be sent.",
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
                            Get back into your account.
                        </h1>

                        <p className="mt-4 text-sm leading-6 text-sidebar-foreground/70">
                            We will send you a secure link to choose a new password.
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
                            {isSent ? (
                                <div className="py-4 text-center">
                                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/10">
                                        <CheckCircle2 className="size-6 text-success"/>
                                    </div>

                                    <h1 className="mt-4 text-2xl font-semibold tracking-tight text-card-foreground">
                                        Check your inbox
                                    </h1>

                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                        If an account exists for this email address, we sent a
                                        password reset link.
                                    </p>

                                    <Link
                                        href="/login"
                                        className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                                    >
                                        Back to sign in
                                    </Link>
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
                                            <Mail className="size-5 text-muted-foreground"/>
                                        </div>

                                        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-card-foreground">
                                            Reset your password
                                        </h1>

                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                            Enter your email address and we will send you a reset link.
                                        </p>
                                    </div>

                                    <form className="space-y-4" onSubmit={handleSubmit}>
                                        <div>
                                            <label
                                                htmlFor="email"
                                                className="mb-1.5 block text-sm font-medium text-card-foreground"
                                            >
                                                Email
                                            </label>

                                            <input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={(event) => setEmail(event.target.value)}
                                                autoComplete="email"
                                                placeholder="you@company.com"
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
                                            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {isSubmitting ? "Sending..." : "Send reset link"}
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

const inputClassName =
    "h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/10";