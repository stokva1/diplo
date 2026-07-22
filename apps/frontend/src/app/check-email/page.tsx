"use client";

import Link from "next/link";
import {useSearchParams} from "next/navigation";
import {Mail, ArrowLeft} from "lucide-react";
import {Suspense} from "react";
import {LoadingState} from "@/components/LoadingState";


function CheckEmailContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email");

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
                            One more step.
                        </h1>

                        <p className="mt-4 text-sm leading-6 text-sidebar-foreground/70">
                            Verify your e-mail address to activate your FleetCore workspace.
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
                            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
                                <Mail className="size-6 text-primary"/>
                            </div>

                            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-card-foreground">
                                Check your e-mail
                            </h1>

                            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                We sent a verification link to
                            </p>

                            {email ? (
                                <p className="mt-1 break-all text-sm font-semibold text-card-foreground">
                                    {email}
                                </p>
                            ) : null}

                            <p className="mt-4 text-sm leading-6 text-muted-foreground">
                                Open the link in the e-mail to activate your account.
                                You can then sign in to FleetCore.
                            </p>

                            <Link
                                href="/login"
                                className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                            >
                                <ArrowLeft className="size-4"/>
                                Back to sign in
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default function CheckEmailPage() {
    return (
        <Suspense fallback={<LoadingState label="Loading..."/>}>
            <CheckEmailContent/>
        </Suspense>
    );
}