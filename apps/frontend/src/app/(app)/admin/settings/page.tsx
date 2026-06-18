"use client";

import {useEffect, useState} from "react";
import {
    CheckCircle2,
    Database,
    Image,
    RotateCcw,
    Save,
    Settings,
} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {PageHeader} from "@/components/PageHeader";
import {Alert} from "@/components/Alert";
import {LoadingState} from "@/components/LoadingState";

type OrganizationSettings = {
    tripLogRetentionMonths: number;
    issuePhotoRetentionMonths: number;
};

export default function OrganizationSettingsPage() {
    const [settings, setSettings] = useState<OrganizationSettings | null>(null);
    const [form, setForm] = useState<OrganizationSettings>({
        tripLogRetentionMonths: 60,
        issuePhotoRetentionMonths: 24,
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        async function loadSettings() {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const response = await apiRequest<OrganizationSettings>(
                    "/organization/settings",
                    {token},
                );

                setSettings(response);
                setForm(response);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Settings could not be loaded.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadSettings();
    }, []);

    const hasChanges =
        settings !== null &&
        (form.tripLogRetentionMonths !== settings.tripLogRetentionMonths ||
            form.issuePhotoRetentionMonths !== settings.issuePhotoRetentionMonths);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const token = localStorage.getItem("accessToken");

        if (!token) {
            setError("You need to be signed in to update settings.");
            return;
        }

        setIsSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await apiRequest<OrganizationSettings>(
                "/organization/settings",
                {
                    method: "PATCH",
                    token,
                    body: form,
                },
            );

            setSettings(response);
            setForm(response);
            setSuccess("Settings saved successfully.");
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Settings could not be saved.",
            );
        } finally {
            setIsSaving(false);
        }
    }

    function resetForm() {
        if (!settings) {
            return;
        }

        setForm(settings);
        setError(null);
        setSuccess(null);
    }

    if (isLoading) {
        return <LoadingState label="Loading settings..."/>;
    }

    return (
        <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <PageHeader
                    title="Organization settings"
                    description="Configure data retention rules for trip logs and issue photos."
                />
            </div>

            <section className="rounded-xl border border-border bg-card shadow-sm">
                <div className="border-b border-border p-5">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <Settings className="size-5 text-muted-foreground"/>
                        </div>

                        <div>
                            <h2 className="text-base font-semibold text-card-foreground">
                                Retention settings
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                These values define how long selected organization data should be kept.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6 p-5">
                    {error ? (
                        <Alert variant="error">
                            {error}
                        </Alert>
                    ) : null}

                    {success ? (
                        <Alert variant="success">
                            <CheckCircle2 className="size-4 shrink-0"/>
                            {success}
                        </Alert>
                    ) : null}

                    <div className="grid gap-4 md:grid-cols-2">
                        <SettingField
                            icon={Database}
                            label="Trip log retention"
                            description="How long completed trip logs should be retained."
                            suffix="months"
                            value={form.tripLogRetentionMonths}
                            onChange={(value) =>
                                setForm((current) => ({
                                    ...current,
                                    tripLogRetentionMonths: value,
                                }))
                            }
                        />

                        <SettingField
                            icon={Image}
                            label="Issue photo retention"
                            description="How long photos attached to reported issues should be retained."
                            suffix="months"
                            value={form.issuePhotoRetentionMonths}
                            onChange={(value) =>
                                setForm((current) => ({
                                    ...current,
                                    issuePhotoRetentionMonths: value,
                                }))
                            }
                        />
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={resetForm}
                            disabled={!hasChanges || isSaving}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RotateCcw className="size-4"/>
                            Reset
                        </button>

                        <button
                            type="submit"
                            disabled={!hasChanges || isSaving}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Save className="size-4"/>
                            {isSaving ? "Saving..." : "Save changes"}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    );
}

function SettingField({
                          icon: Icon,
                          label,
                          description,
                          suffix,
                          value,
                          onChange,
                      }: {
    icon: React.ElementType;
    label: string;
    description: string;
    suffix: string;
    value: number;
    onChange: (value: number) => void;
}) {
    return (
        <label className="block rounded-xl border border-border bg-background p-4">
            <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Icon className="size-5 text-muted-foreground"/>
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-card-foreground">
                        {label}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {description}
                    </p>

                    <div className="mt-4 flex items-center gap-2">
                        <input
                            type="number"
                            min={1}
                            max={240}
                            value={value}
                            onChange={(event) => {
                                const nextValue = Number(event.target.value);

                                onChange(Number.isNaN(nextValue) ? 1 : nextValue);
                            }}
                            className="h-10 w-28 rounded-lg border border-input bg-card px-3 text-sm text-foreground outline-none transition-colors focus:border-ring"
                        />

                        <span className="text-sm text-muted-foreground">
                            {suffix}
                        </span>
                    </div>
                </div>
            </div>
        </label>
    );
}
