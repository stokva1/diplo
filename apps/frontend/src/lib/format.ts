const numberFormatter = new Intl.NumberFormat("en-GB");

const czkFormatter = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
});

export function formatNumber(value?: number | null) {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return "—";
    }

    return numberFormatter.format(value);
}

export function formatKm(value?: number | null) {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return "—";
    }

    return `${formatNumber(value)} km`;
}

export function formatCurrency(value?: number | string | null) {
    if (value === null || value === undefined || value === "") {
        return "—";
    }

    const numericValue = typeof value === "string" ? Number(value) : value;

    if (Number.isNaN(numericValue)) {
        return "—";
    }

    return czkFormatter.format(numericValue);
}

export function formatBoolean(
    value?: boolean | null,
    labels: { true: string; false: string } = {true: "Yes", false: "No"},
) {
    if (value === null || value === undefined) {
        return "—";
    }

    return value ? labels.true : labels.false;
}
