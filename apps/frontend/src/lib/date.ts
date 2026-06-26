const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

const shortDateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
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

export function isSameCalendarDay(
    startValue?: string | Date | null,
    endValue?: string | Date | null,
) {
    const start = parseDate(startValue);
    const end = parseDate(endValue);

    if (!start || !end) {
        return false;
    }

    return (
        start.getFullYear() === end.getFullYear() &&
        start.getMonth() === end.getMonth() &&
        start.getDate() === end.getDate()
    );
}

export function formatDate(value?: string | Date | null) {
    const date = parseDate(value);
    return date ? dateFormatter.format(date) : "—";
}

export function formatTime(value?: string | Date | null) {
    const date = parseDate(value);
    return date ? timeFormatter.format(date) : "—";
}

export function formatDateTime(value?: string | Date | null) {
    const date = parseDate(value);
    return date ? dateTimeFormatter.format(date) : "—";
}

export function formatShortDateTime(value?: string | Date | null) {
    const date = parseDate(value);
    return date ? shortDateTimeFormatter.format(date) : "—";
}

export function formatTimeRange(
    startValue?: string | Date | null,
    endValue?: string | Date | null,
) {
    const start = parseDate(startValue);
    const end = parseDate(endValue);

    if (!start || !end) {
        return "—";
    }

    return `${formatTime(start)}–${formatTime(end)}`;
}

export function formatDateTimeRange(
    startValue?: string | Date | null,
    endValue?: string | Date | null,
) {
    const start = parseDate(startValue);
    const end = parseDate(endValue);

    if (!start || !end) {
        return "—";
    }

    if (isSameCalendarDay(start, end)) {
        return `${formatDate(start)}, ${formatTimeRange(start, end)}`;
    }

    return `${formatDateTime(start)} – ${formatDateTime(end)}`;
}

export function formatCompactDateTimeRange(
    startValue?: string | Date | null,
    endValue?: string | Date | null,
) {
    const start = parseDate(startValue);
    const end = parseDate(endValue);

    if (!start || !end) {
        return "—";
    }

    if (isSameCalendarDay(start, end)) {
        return formatTimeRange(start, end);
    }

    return `${formatShortDateTime(start)} – ${formatShortDateTime(end)}`;
}

export function formatRelativeDate(
    value?: string | Date | null,
    referenceValue: Date = new Date(),
) {
    const date = parseDate(value);

    if (!date) {
        return "—";
    }

    const dateOnly = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
    );

    const referenceOnly = new Date(
        referenceValue.getFullYear(),
        referenceValue.getMonth(),
        referenceValue.getDate(),
    );

    const diffDays = Math.round(
        (dateOnly.getTime() - referenceOnly.getTime()) / 86_400_000,
    );

    if (diffDays === 0) {
        return "Today";
    }

    if (diffDays === 1) {
        return "Tomorrow";
    }

    if (diffDays === -1) {
        return "Yesterday";
    }

    return formatDate(date);
}