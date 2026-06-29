"use client";

import {useEffect, useState} from "react";
import {
    Building2,
    CheckCircle2,
    Database,
    Image,
    Mail,
    RotateCcw,
    Save,
    Settings,
} from "lucide-react";
import {apiRequest} from "@/lib/api";
import {PageHeader} from "@/components/PageHeader";
import {Alert} from "@/components/Alert";
import {LoadingState} from "@/components/LoadingState";

type Organization = {
    id: string;
    name: string;
    ico?: string | null;
    contactEmail?: string | null;
};

type OrganizationSettings = {
    tripLogRetentionMonths: number;
    issuePhotoRetentionMonths: number;
};

export default function OrganizationSettingsPage() {
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [organizationForm, setOrganizationForm] = useState({
        name: "",
        ico: "",
        contactEmail: "",
    });

    const [settings, setSettings] = useState<OrganizationSettings | null>(null);
    const [settingsForm, setSettingsForm] = useState<OrganizationSettings>({
        tripLogRetentionMonths: 60,
        issuePhotoRetentionMonths: 24,
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    const [profileError, setProfileError] = useState<string | null>(null);
    const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
    const [settingsError, setSettingsError] = useState<string | null>(null);
    const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            const token = localStorage.getItem("accessToken");

            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const [organizationResponse, settingsResponse] = await Promise.all([
                    apiRequest<Organization>("/organization", {token}),
                    apiRequest<OrganizationSettings>(
                        "/organization/settings",
                        {token},
                    ),
                ]);

                setOrganization(organizationResponse);
                setOrganizationForm({
                    name: organizationResponse.name,
                    ico: organizationResponse.ico ?? "",
                    contactEmail: organizationResponse.contactEmail ?? "",
                });

                setSettings(settingsResponse);
                setSettingsForm(settingsResponse);
            } catch (error) {
                setProfileError(
                    error instanceof Error
                        ? error.message
                        : "Settings could not be loaded.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, []);

    const hasProfileChanges =
        organization !== null &&
        (
            organizationForm.name !== organization.name ||
            organizationForm.ico !== (organization.ico ?? "") ||
            organizationForm.contactEmail !==
            (organization.contactEmail ?? "")
        );

    const hasSettingsChanges =
        settings !== null &&
        (
            settingsForm.tripLogRetentionMonths !==
            settings.tripLogRetentionMonths ||
            settingsForm.issuePhotoRetentionMonths !==
            settings.issuePhotoRetentionMonths
        );

    async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const name = organizationForm.name.trim();
        const ico = organizationForm.ico.trim();
        const contactEmail = organizationForm.contactEmail.trim();

        if (!name) {
            setProfileError("Enter the organization name.");
            return;
        }

        const token = localStorage.getItem("accessToken");

        if (!token) {
            setProfileError("You need to be signed in to update the organization.");
            return;
        }

        setIsSavingProfile(true);
        setProfileError(null);
        setProfileSuccess(null);

        try {
            const response = await apiRequest<Organization>("/organization", {
                method: "PATCH",
                token,
                body: {
                    name,
                    ico: ico || undefined,
                    contactEmail: contactEmail || undefined,
                },
            });

            setOrganization(response);
            setOrganizationForm({
                name: response.name,
                ico: response.ico ?? "",
                contactEmail: response.contactEmail ?? "",
            });

            setProfileSuccess("Organization profile saved successfully.");
        } catch (error) {
            setProfileError(
                error instanceof Error
                    ? error.message
                    : "Organization profile could not be saved.",
            );
        } finally {
            setIsSavingProfile(false);
        }
    }

    async function handleSettingsSubmit(
        event: React.FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        const token = localStorage.getItem("accessToken");

        if (!token) {
            setSettingsError("You need to be signed in to update settings.");
            return;
        }

        setIsSavingSettings(true);
        setSettingsError(null);
        setSettingsSuccess(null);

        try {
            const response = await apiRequest<OrganizationSettings>(
                "/organization/settings",
                {
                    method: "PATCH",
                    token,
                    body: settingsForm,
                },
            );

            setSettings(response);
            setSettingsForm(response);
            setSettingsSuccess("Retention settings saved successfully.");
        } catch (error) {
            setSettingsError(
                error instanceof Error
                    ? error.message
                    : "Retention settings could not be saved.",
            );
        } finally {
            setIsSavingSettings(false);
        }
    }

    function resetProfile() {
        if (!organization) {
            return;
        }

        setOrganizationForm({
            name: organization.name,
            ico: organization.ico ?? "",
            contactEmail: organization.contactEmail ?? "",
        });

        setProfileError(null);
        setProfileSuccess(null);
    }

    function resetSettings() {
        if (!settings) {
            return;
        }

        setSettingsForm(settings);
        setSettingsError(null);
        setSettingsSuccess(null);
    }

    if (isLoading) {
        return <LoadingState label="Loading settings..."/>;
    }

    if (!organization || !settings) {
        return null;
    }

    return (
        <div className="mx-auto max-w-3xl">
            <div className="mb-6">
                <PageHeader
                    title="Organization settings"
                    description="Manage organization details and data retention rules."
                />
            </div>

            <section className="mb-6 rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <Building2 className="size-6 text-muted-foreground"/>
                    </div>

                    <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-card-foreground">
                            {organization.name}
                        </p>

                        <div className="mt-1 flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                            <Mail className="size-3.5 shrink-0"/>

                            <span className="truncate">
                                {organization.contactEmail || "No contact email"}
                            </span>
                        </div>
                    </div>
                </div>
            </section>

            <div className="space-y-6">
                <form
                    onSubmit={handleProfileSubmit}
                    className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                >
                    <div className="border-b border-border px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                                <Building2 className="size-5 text-muted-foreground"/>
                            </div>

                            <div>
                                <h2 className="text-base font-semibold text-card-foreground">
                                    Organization profile
                                </h2>

                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    Update basic organization details.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 p-5">
                        {profileError ? (
                            <Alert variant="error">{profileError}</Alert>
                        ) : null}

                        {profileSuccess ? (
                            <Alert variant="success">
                                <CheckCircle2 className="size-4 shrink-0"/>
                                {profileSuccess}
                            </Alert>
                        ) : null}

                        <div className="grid gap-5 sm:grid-cols-2">
                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium text-card-foreground">
                                    Organization name
                                </span>

                                <input
                                    value={organizationForm.name}
                                    onChange={(event) =>
                                        setOrganizationForm((current) => ({
                                            ...current,
                                            name: event.target.value,
                                        }))
                                    }
                                    maxLength={255}
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/10"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1.5 block text-sm font-medium text-card-foreground">
                                    Company ID / IČO
                                </span>

                                <input
                                    value={organizationForm.ico}
                                    onChange={(event) =>
                                        setOrganizationForm((current) => ({
                                            ...current,
                                            ico: event.target.value,
                                        }))
                                    }
                                    maxLength={32}
                                    placeholder="e.g. 12345678"
                                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/10"
                                />
                            </label>
                        </div>

                        <label className="block">
                            <span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-card-foreground">
                                <Mail className="size-4"/>
                                Contact email
                            </span>

                            <input
                                type="email"
                                value={organizationForm.contactEmail}
                                onChange={(event) =>
                                    setOrganizationForm((current) => ({
                                        ...current,
                                        contactEmail: event.target.value,
                                    }))
                                }
                                maxLength={255}
                                placeholder="e.g. office@company.com"
                                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/10"
                            />
                        </label>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-border bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
                        <button
                            type="button"
                            onClick={resetProfile}
                            disabled={!hasProfileChanges || isSavingProfile}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RotateCcw className="size-4"/>
                            Reset
                        </button>

                        <button
                            type="submit"
                            disabled={!hasProfileChanges || isSavingProfile}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Save className="size-4"/>
                            {isSavingProfile ? "Saving..." : "Save changes"}
                        </button>
                    </div>
                </form>

                <form
                    onSubmit={handleSettingsSubmit}
                    className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                >
                    <div className="border-b border-border px-5 py-4">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                                <Settings className="size-5 text-muted-foreground"/>
                            </div>

                            <div>
                                <h2 className="text-base font-semibold text-card-foreground">
                                    Data retention
                                </h2>

                                <p className="mt-0.5 text-sm text-muted-foreground">
                                    Define how long selected records should be retained.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 p-5">
                        {settingsError ? (
                            <Alert variant="error">{settingsError}</Alert>
                        ) : null}

                        {settingsSuccess ? (
                            <Alert variant="success">
                                <CheckCircle2 className="size-4 shrink-0"/>
                                {settingsSuccess}
                            </Alert>
                        ) : null}

                        <div className="grid gap-5 sm:grid-cols-2">
                            <RetentionField
                                icon={Database}
                                label="Trip log retention"
                                description="Completed trip logs."
                                value={settingsForm.tripLogRetentionMonths}
                                onChange={(value) =>
                                    setSettingsForm((current) => ({
                                        ...current,
                                        tripLogRetentionMonths: value,
                                    }))
                                }
                            />

                            <RetentionField
                                icon={Image}
                                label="Issue photo retention"
                                description="Photos attached to reported issues."
                                value={settingsForm.issuePhotoRetentionMonths}
                                onChange={(value) =>
                                    setSettingsForm((current) => ({
                                        ...current,
                                        issuePhotoRetentionMonths: value,
                                    }))
                                }
                            />
                        </div>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-border bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
                        <button
                            type="button"
                            onClick={resetSettings}
                            disabled={!hasSettingsChanges || isSavingSettings}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RotateCcw className="size-4"/>
                            Reset
                        </button>

                        <button
                            type="submit"
                            disabled={!hasSettingsChanges || isSavingSettings}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Save className="size-4"/>
                            {isSavingSettings ? "Saving..." : "Save changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function RetentionField({
                            icon: Icon,
                            label,
                            description,
                            value,
                            onChange,
                        }: {
    icon: React.ElementType;
    label: string;
    description: string;
    value: number;
    onChange: (value: number) => void;
}) {
    return (
        <div className="rounded-lg border border-border bg-muted/20 p-4">
            <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background">
                    <Icon className="size-5 text-muted-foreground"/>
                </div>

                <div className="min-w-0">
                    <p className="text-sm font-medium text-card-foreground">
                        {label}
                    </p>

                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>
            </div>

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
                    className="h-10 w-24 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/10"
                />

                <span className="text-sm text-muted-foreground">
                    months
                </span>
            </div>
        </div>
    );
}