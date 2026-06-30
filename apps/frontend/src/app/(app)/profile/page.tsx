"use client";

import {useEffect, useState} from "react";
import {LockKeyhole, ShieldCheck, User} from "lucide-react";
import {apiRequest} from "@/lib/api";
import type {MeResponse} from "@/types/api";
import {Alert} from "@/components/Alert";
import {LoadingState} from "@/components/LoadingState";
import {PageHeader} from "@/components/PageHeader";

export default function ProfilePage() {
    const [me, setMe] = useState<MeResponse | null>(null);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        async function loadProfile() {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await apiRequest<MeResponse>("/me", {token});
                setMe(response);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Profile could not be loaded.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadProfile();
    }, []);

    async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!currentPassword || !newPassword || !confirmPassword) {
            setError("Complete all password fields.");
            return;
        }

        if (newPassword.length < 8) {
            setError("New password must contain at least 8 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match.");
            return;
        }

        const token = localStorage.getItem("accessToken");

        if (!token) {
            setError("Your session has expired. Sign in again.");
            return;
        }

        setError(null);
        setSuccess(null);
        setIsSubmitting(true);

        try {
            await apiRequest<void>("/auth/change-password", {
                method: "POST",
                token,
                body: {
                    currentPassword,
                    newPassword,
                },
            });

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setSuccess("Password changed successfully.");
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Password could not be changed.",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    if (isLoading) {
        return <LoadingState label="Loading profile..."/>;
    }

    return (
        <div className="mx-auto max-w-3xl">
            <PageHeader
                title="Profile"
                description="View your account details and manage your password."
            />

            {error ? (
                <Alert variant="error" className="mt-5">
                    {error}
                </Alert>
            ) : null}

            {success ? (
                <Alert variant="success" className="mt-5">
                    {success}
                </Alert>
            ) : null}

            <div className="mt-6 flex flex-col gap-5">
                <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                                <User className="size-5 text-muted-foreground"/>
                            </div>

                            <div>
                                <h2 className="text-base font-semibold text-card-foreground">
                                    Account details
                                </h2>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    Your identity in this organization.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-5 p-5 sm:grid-cols-2">
                        <InfoField label="Full name" value={me?.user.name ?? "—"}/>
                        <InfoField label="Email address" value={me?.user.email ?? "—"}/>
                        <InfoField
                            label="Organization"
                            value={me?.organization.name ?? "—"}
                        />
                        <InfoField
                            label="Role"
                            value={me?.member.role === "ADMIN" ? "Administrator" : "Member"}
                        />
                    </div>
                </section>

                <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                    <div className="border-b border-border px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                                <ShieldCheck className="size-5 text-muted-foreground"/>
                            </div>

                            <div>
                                <h2 className="text-base font-semibold text-card-foreground">
                                    Change password
                                </h2>
                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    Use at least 8 characters.
                                </p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleChangePassword}>
                        <div className="flex flex-col gap-5 p-5">
                            <Field label="Current password" htmlFor="current-password">
                                <input
                                    id="current-password"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(event) =>
                                        setCurrentPassword(event.target.value)
                                    }
                                    autoComplete="current-password"
                                    className={inputClassName}
                                />
                            </Field>

                            <div className="grid gap-5 sm:grid-cols-2">
                                <Field label="New password" htmlFor="new-password">
                                    <div className="relative">
                                        <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>

                                        <input
                                            id="new-password"
                                            type="password"
                                            value={newPassword}
                                            onChange={(event) =>
                                                setNewPassword(event.target.value)
                                            }
                                            minLength={8}
                                            autoComplete="new-password"
                                            className={`${inputClassName} pl-9`}
                                        />
                                    </div>
                                </Field>

                                <Field
                                    label="Confirm new password"
                                    htmlFor="confirm-password"
                                >
                                    <input
                                        id="confirm-password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(event) =>
                                            setConfirmPassword(event.target.value)
                                        }
                                        minLength={8}
                                        autoComplete="new-password"
                                        className={inputClassName}
                                    />
                                </Field>
                            </div>
                        </div>

                        <div className="flex justify-end border-t border-border bg-muted/20 px-5 py-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {isSubmitting ? "Updating password..." : "Update password"}
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </div>
    );
}

const inputClassName =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/10";

function InfoField({
                       label,
                       value,
                   }: {
    label: string;
    value: string;
}) {
    return (
        <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {label}
            </p>
            <p className="mt-1.5 truncate text-sm font-medium text-card-foreground">
                {value}
            </p>
        </div>
    );
}

function Field({
                   label,
                   htmlFor,
                   children,
               }: {
    label: string;
    htmlFor: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label
                htmlFor={htmlFor}
                className="mb-1.5 block text-sm font-medium text-card-foreground"
            >
                {label}
            </label>

            {children}
        </div>
    );
}