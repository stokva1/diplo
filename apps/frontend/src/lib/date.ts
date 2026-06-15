const dateFormatter = new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "numeric",
});

const monthDateFormatter = new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("cs-CZ", {
    hour: "2-digit",
    minute: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

function parseDate(value?: string | Date | null) {
    if (!value) {
        return null;
    }

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}

export function formatDate(value?: string | Date | null) {
    const date = parseDate(value);
    return date ? dateFormatter.format(date) : "—";
}

export function formatShortDate(value?: string | Date | null) {
    const date = parseDate(value);
    return date ? shortDateFormatter.format(date) : "—";
}

export function formatMonthDate(value?: string | Date | null) {
    const date = parseDate(value);
    return date ? monthDateFormatter.format(date) : "—";
}

export function formatTime(value?: string | Date | null) {
    const date = parseDate(value);
    return date ? timeFormatter.format(date) : "—";
}

export function formatDateTime(value?: string | Date | null) {
    const date = parseDate(value);
    return date ? dateTimeFormatter.format(date) : "—";
}

export function formatTimeRange(startValue?: string | Date | null, endValue?: string | Date | null) {
    return `${formatTime(startValue)}–${formatTime(endValue)}`;
}

export function formatDateTimeRange(startValue?: string | Date | null, endValue?: string | Date | null) {
    const start = parseDate(startValue);
    const end = parseDate(endValue);

    if (!start || !end) {
        return "—";
    }

    if (start.toDateString() === end.toDateString()) {
        return `${formatDate(start)}, ${formatTime(start)}–${formatTime(end)}`;
    }

    return `${formatDateTime(start)} – ${formatDateTime(end)}`;
}
