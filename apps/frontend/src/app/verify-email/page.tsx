"use client";

import Link from "next/link";
import {useEffect, useRef, useState} from "react";
import {useSearchParams} from "next/navigation";
import {CheckCircle2, CircleX, LoaderCircle} from "lucide-react";
import {apiRequest} from "@/lib/api";

type VerificationState = "loading" | "success" | "error";

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const hasStarted = useRef(false);

    const [state, setState] = useState<VerificationState>("loading");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (hasStarted.current) {
            return;
        }

        hasStarted.current = true;

        if (!token) {
            setError("The verification link is invalid.");
            setState("error");
            return;
        }

        async function verifyEmail() {
            try {
                await apiRequest<void>("/auth/email-verification/confirm", {
                    method: "POST",
                    body: {
                        token,
                    },
                });

                setState("success");
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "The verification link could not be confirmed.",
                );
                setState("error");
            }
        }

        void verifyEmail();
    }, [token]);

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
                            Activate your workspace.
                        </h1>

                        <p className="mt-4 text-sm leading-6 text-sidebar-foreground/70">
                            We are confirming your e-mail address and securing your account.
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

                        <div className="rounded-lg border border-border bg-card p-6 text-center shadow-sm">
                            {state === "loading" ? (
                                <>
                                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
                                        <LoaderCircle className="size-6 animate-spin text-muted-foreground"/>
                                    </div>

                                    <h1 className="mt-4 text-2xl font-semibold tracking-tight text-card-foreground">
                                        Verifying your e-mail
                                    </h1>

                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                        Please wait a moment.
                                    </p>
                                </>
                            ) : null}

                            {state === "success" ? (
                                <>
                                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/10">
                                        <CheckCircle2 className="size-6 text-success"/>
                                    </div>

                                    <h1 className="mt-4 text-2xl font-semibold tracking-tight text-card-foreground">
                                        E-mail verified
                                    </h1>

                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                        Your FleetCore account is active. You can now sign in.
                                    </p>

                                    <Link
                                        href="/login"
                                        className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                                    >
                                        Sign in
                                    </Link>
                                </>
                            ) : null}

                            {state === "error" ? (
                                <>
                                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10">
                                        <CircleX className="size-6 text-destructive"/>
                                    </div>

                                    <h1 className="mt-4 text-2xl font-semibold tracking-tight text-card-foreground">
                                        Verification failed
                                    </h1>

                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                        {error}
                                    </p>

                                    <Link
                                        href="/login"
                                        className="mt-6 inline-flex h-10 items-center justify-center rounded-md border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                                    >
                                        Back to sign in
                                    </Link>
                                </>
                            ) : null}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}