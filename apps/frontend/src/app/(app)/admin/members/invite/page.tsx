"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {ArrowLeft, Check, Mail, UserPlus} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {Alert} from "@/components/Alert";
import {PageHeader} from "@/components/PageHeader";

type CreateInvitationResponse = {
    id: string;
    email: string;
    name: string;
    status: "PENDING";
    expiresAt: string;
};

export default function InviteMemberPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedName = name.trim();
        const trimmedEmail = email.trim().toLowerCase();

        if (!trimmedName || !trimmedEmail) {
            setError("Enter the member's name and email address.");
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
            await apiRequest<CreateInvitationResponse>("/invitations", {
                method: "POST",
                token,
                body: {
                    name: trimmedName,
                    email: trimmedEmail,
                },
            });

            router.push("/admin/members");
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Invitation could not be sent.",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="mx-auto max-w-3xl">
            <Link
                href="/admin/members"
                className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
                <ArrowLeft className="size-4"/>
                Back to members
            </Link>

            <div className="mb-6">
                <PageHeader
                    title="Invite member"
                    description="Send an invitation to join your organization."
                />
            </div>

            {error ? (
                <Alert variant="error" className="mb-5">
                    {error}
                </Alert>
            ) : null}

            <form
                onSubmit={handleSubmit}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
            >
                <div className="border-b border-border px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                            <UserPlus className="size-5 text-muted-foreground"/>
                        </div>

                        <div>
                            <h2 className="text-base font-semibold text-card-foreground">
                                Member details
                            </h2>

                            <p className="mt-0.5 text-sm text-muted-foreground">
                                The invited person will join as a regular member.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 p-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field label="Full name">
                            <input
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                maxLength={255}
                                placeholder="e.g. Petr Svoboda"
                                className={inputClassName}
                            />
                        </Field>

                        <Field label="Email address">
                            <div className="relative">
                                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/>

                                <input
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    maxLength={255}
                                    placeholder="e.g. petr.svoboda@company.com"
                                    className={`${inputClassName} pl-9`}
                                />
                            </div>
                        </Field>
                    </div>

                    <div className="rounded-lg border border-info/20 bg-info/5">
                        <div className="flex items-center gap-3 p-4">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-info/10">
                                <Mail className="size-5 text-info"/>
                            </div>

                            <div className="min-w-0">
                                <p className="text-sm font-medium text-card-foreground">
                                    What happens next
                                </p>

                                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                    The member receives an email invitation and chooses their password
                                    when accepting it.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-border bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
                    <Link
                        href="/admin/members"
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                    >
                        Cancel
                    </Link>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Check className="size-4"/>
                        {isSubmitting ? "Sending..." : "Send invitation"}
                    </button>
                </div>
            </form>
        </div>
    );
}

const inputClassName =
    "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/10";

function Field({
                   label,
                   children,
               }: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-card-foreground">
                {label}
            </span>

            {children}
        </label>
    );
}