"use client";

import { SubmitEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { LoginResponse } from "@/types/api";
import {Alert} from "@/components/Alert";
import Link from "next/link";
import {setAuthTokens} from "@/lib/auth";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("petr.svoboda@firma.cz");
    const [password, setPassword] = useState("tajne-heslo");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loginResponse, setLoginResponse] = useState<LoginResponse | null>(null);

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        setError(null);
        setLoginResponse(null);
        setIsSubmitting(true);

        try {
            const response = await apiRequest<LoginResponse>("/auth/login", {
                method: "POST",
                body: {
                    email,
                    password,
                },
            });

            setAuthTokens({
                accessToken: response.accessToken,
                refreshToken: response.refreshToken,
            });

            setLoginResponse(response);
            router.push("/dashboard");
        } catch (error) {
            setError(error instanceof Error ? error.message : "Login failed.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="min-h-screen bg-background">
            <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
                <section className="relative hidden overflow-hidden border-r border-border bg-sidebar px-10 py-8 text-sidebar-foreground lg:flex lg:flex-col">
                    <div className="absolute inset-0 translate-y-60 bg-[url('/login-cars-1.jpg')] bg-[length:100%_auto] bg-center bg-no-repeat opacity-70" />
                    <div className="absolute inset-0 bg-gradient-to-b from-sidebar via-sidebar/95 via-55% to-sidebar/20" />
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-sidebar/30 to-sidebar" />

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
                            Shared company vehicle management.
                        </h1>
                        <p className="mt-4 text-sm leading-6 text-sidebar-foreground/70">
                            Reservations, trip logs, service events and issue reporting
                            in one clear workspace.
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
                            <div className="mb-6">
                                <h2 className="text-2xl font-semibold tracking-tight text-card-foreground">
                                    Sign in
                                </h2>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    Enter your credentials.
                                </p>
                            </div>

                            <form className="space-y-4" onSubmit={handleSubmit}>
                                <div>
                                    <label
                                        className="mb-1.5 block text-sm font-medium text-card-foreground"
                                        htmlFor="email"
                                    >
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/10"
                                        type="email"
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        autoComplete="email"
                                    />
                                </div>

                                <div>
                                    <label
                                        className="mb-1.5 block text-sm font-medium text-card-foreground"
                                        htmlFor="password"
                                    >
                                        Password
                                    </label>
                                    <input
                                        id="password"
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/10"
                                        type="password"
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        autoComplete="current-password"
                                    />
                                </div>

                                <div className="flex justify-end">
                                    <Link
                                        href="/forgot-password"
                                        className="text-sm font-medium text-primary transition-colors hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>

                                {error ? (
                                    <Alert variant="error">
                                        {error}
                                    </Alert>
                                ) : null}

                                <button
                                    className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                    type="submit"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Signing in..." : "Sign in"}
                                </button>
                            </form>

                            {loginResponse ? (
                                <Alert
                                    className="mt-5"
                                    variant="success"
                                    title="Signed in successfully."
                                />

                            ) : null}
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}