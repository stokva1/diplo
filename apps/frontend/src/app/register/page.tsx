"use client";

import Link from "next/link";
import {SubmitEvent, useState} from "react";
import {useRouter} from "next/navigation";
import {apiRequest} from "@/lib/api";
import {Alert} from "@/components/Alert";

type RegisterOrganizationResponse = {
    email: string;
};

export default function RegisterPage() {
    const router = useRouter();

    const [organizationName, setOrganizationName] = useState("");
    const [ico, setIco] = useState("");
    const [contactEmail, setContactEmail] = useState("");

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");

    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedOrganizationName = organizationName.trim();
        const trimmedName = name.trim();
        const trimmedEmail = email.trim();

        if (!trimmedOrganizationName || !trimmedName || !trimmedEmail || !password) {
            setError("Complete all required fields.");
            return;
        }

        if (password.length < 8) {
            setError("Password must contain at least 8 characters.");
            return;
        }

        if (password !== passwordConfirmation) {
            setError("Passwords do not match.");
            return;
        }

        setError(null);
        setIsSubmitting(true);

        try {
            const response = await apiRequest<RegisterOrganizationResponse>(
                "/auth/register-organization",
                {
                    method: "POST",
                    body: {
                        organization: {
                            name: trimmedOrganizationName,
                            ...(ico.trim() ? {ico: ico.trim()} : {}),
                            ...(contactEmail.trim()
                                ? {contactEmail: contactEmail.trim()}
                                : {}),
                        },
                        user: {
                            name: trimmedName,
                            email: trimmedEmail,
                            password,
                        },
                    },
                },
            );

            router.push(
                `/check-email?email=${encodeURIComponent(response.email)}`,
            );
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Registration could not be completed.",
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
                            Set up your fleet workspace.
                        </h1>
                        <p className="mt-4 text-sm leading-6 text-sidebar-foreground/70">
                            Create your organization and start managing reservations,
                            trip logs, service events and vehicle issues.
                        </p>
                    </div>
                </section>

                <section className="flex min-h-screen items-center justify-center px-4 py-10 md:px-8">
                    <div className="w-full max-w-2xl">
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

                        <div className="rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
                            <div className="mb-8">
                                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-card-foreground">
                                    Create your organization
                                </h2>

                                <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                                    Set up your fleet workspace and administrator account.
                                </p>
                            </div>

                            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                                <div>
                                    <div className="mb-3 flex items-center gap-2">
                                        <span className="flex size-5 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                                            1
                                        </span>
                                        <p className="text-sm font-semibold text-card-foreground">
                                            Organization
                                        </p>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="md:col-span-2">
                                            <Field label="Organization name" htmlFor="organization-name">
                                                <input
                                                    id="organization-name"
                                                    value={organizationName}
                                                    onChange={(event) =>
                                                        setOrganizationName(event.target.value)
                                                    }
                                                    maxLength={255}
                                                    autoComplete="organization"
                                                    placeholder="e.g. Acme Logistics"
                                                    className={inputClassName}
                                                />
                                            </Field>
                                        </div>

                                        <Field label="Company ID (optional)" htmlFor="ico">
                                            <input
                                                id="ico"
                                                value={ico}
                                                onChange={(event) => setIco(event.target.value)}
                                                maxLength={20}
                                                placeholder="e.g. 12345678"
                                                className={inputClassName}
                                            />
                                        </Field>

                                        <Field label="Contact email (optional)" htmlFor="contact-email">
                                            <input
                                                id="contact-email"
                                                type="email"
                                                value={contactEmail}
                                                onChange={(event) =>
                                                    setContactEmail(event.target.value)
                                                }
                                                maxLength={255}
                                                autoComplete="email"
                                                placeholder="fleet@acme.com"
                                                className={inputClassName}
                                            />
                                        </Field>
                                    </div>
                                </div>

                                <div className="border-t border-border pt-5">
                                    <div className="mb-3 flex items-center gap-2">
                                        <span className="flex size-5 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                                            2
                                        </span>
                                        <p className="text-sm font-semibold text-card-foreground">
                                            Administrator account
                                        </p>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <Field label="Your name" htmlFor="name">
                                            <input
                                                id="name"
                                                value={name}
                                                onChange={(event) => setName(event.target.value)}
                                                maxLength={255}
                                                autoComplete="name"
                                                className={inputClassName}
                                            />
                                        </Field>

                                        <Field label="Email" htmlFor="email">
                                            <input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={(event) => setEmail(event.target.value)}
                                                maxLength={255}
                                                autoComplete="email"
                                                className={inputClassName}
                                            />
                                        </Field>

                                        <Field label="Password" htmlFor="password">
                                            <input
                                                id="password"
                                                type="password"
                                                value={password}
                                                onChange={(event) => setPassword(event.target.value)}
                                                minLength={8}
                                                maxLength={72}
                                                autoComplete="new-password"
                                                className={inputClassName}
                                            />
                                        </Field>

                                        <Field label="Confirm password" htmlFor="password-confirmation">
                                            <input
                                                id="password-confirmation"
                                                type="password"
                                                value={passwordConfirmation}
                                                onChange={(event) =>
                                                    setPasswordConfirmation(event.target.value)
                                                }
                                                minLength={8}
                                                maxLength={72}
                                                autoComplete="new-password"
                                                className={inputClassName}
                                            />
                                        </Field>
                                    </div>
                                </div>

                                {error ? <Alert variant="error">{error}</Alert> : null}

                                <div className="flex justify-center pt-1">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isSubmitting
                                            ? "Creating organization..."
                                            : "Create organization"}
                                    </button>
                                </div>
                            </form>

                            <p className="mt-5 text-center text-sm text-muted-foreground">
                                Already have an account?{" "}
                                <Link
                                    href="/login"
                                    className="font-medium text-primary transition-colors hover:underline"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </main>
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

const inputClassName =
    "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/10";