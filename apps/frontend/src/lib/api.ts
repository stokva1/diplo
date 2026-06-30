const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
}

type RequestOptions = {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    token?: string;
    body?: unknown;
};

type RefreshResponse = {
    accessToken: string;
};

class ApiRequestError extends Error {
    constructor(
        message: string,
        public readonly status: number,
    ) {
        super(message);
        this.name = "ApiRequestError";
    }
}

let refreshPromise: Promise<string | null> | null = null;

function hasBrowserStorage() {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function clearStoredTokens() {
    if (!hasBrowserStorage()) {
        return;
    }

    window.localStorage.removeItem("accessToken");
    window.localStorage.removeItem("refreshToken");
}

async function refreshAccessToken(): Promise<string | null> {
    if (!hasBrowserStorage()) {
        return null;
    }

    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = (async () => {
        const refreshToken = window.localStorage.getItem("refreshToken");

        if (!refreshToken) {
            clearStoredTokens();
            return null;
        }

        try {
            const response = await fetch(`${API_URL}/auth/refresh`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    refreshToken,
                }),
            });

            if (!response.ok) {
                clearStoredTokens();
                return null;
            }

            const data = await response.json() as RefreshResponse;

            window.localStorage.setItem("accessToken", data.accessToken);

            return data.accessToken;
        } catch {
            clearStoredTokens();
            return null;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

async function sendRequest<T>(
    path: string,
    options: RequestOptions,
    token?: string,
): Promise<T> {
    const headers: HeadersInit = {
        Accept: "application/json",
    };

    if (options.body !== undefined) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
        method: options.method ?? "GET",
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
        let message = "Request failed.";

        try {
            const errorBody = await response.json();
            message = errorBody.message ?? message;
        } catch {
            // Response body is not JSON.
        }

        throw new ApiRequestError(message, response.status);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

export async function apiRequest<T>(
    path: string,
    options: RequestOptions = {},
): Promise<T> {
    try {
        return await sendRequest<T>(path, options, options.token);
    } catch (error) {
        const shouldRefresh =
            error instanceof ApiRequestError &&
            error.status === 401 &&
            Boolean(options.token) &&
            path !== "/auth/refresh";

        if (!shouldRefresh) {
            throw error;
        }

        const newAccessToken = await refreshAccessToken();

        if (!newAccessToken) {
            throw new Error("Your session has expired. Sign in again.");
        }

        return sendRequest<T>(path, options, newAccessToken);
    }
}

export type UploadedFile = {
    id: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    purpose: "FUEL_RECEIPT" | "ISSUE_PHOTO" | "SERVICE_INVOICE" | "OTHER";
    createdAt: string;
};

async function sendMultipartRequest<T>(
    path: string,
    formData: FormData,
    token?: string,
): Promise<T> {
    const headers: HeadersInit = {
        Accept: "application/json",
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
        method: "POST",
        headers,
        body: formData,
    });

    if (!response.ok) {
        let message = "File upload failed.";

        try {
            const errorBody = await response.json();
            message = errorBody.message ?? message;
        } catch {
            // Response body is not JSON.
        }

        throw new ApiRequestError(message, response.status);
    }

    return response.json() as Promise<T>;
}

export async function uploadFile(
    file: File,
    purpose: UploadedFile["purpose"],
    token: string,
): Promise<UploadedFile> {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("purpose", purpose);

    try {
        return await sendMultipartRequest<UploadedFile>(
            "/files",
            formData,
            token,
        );
    } catch (error) {
        const shouldRefresh =
            error instanceof ApiRequestError &&
            error.status === 401;

        if (!shouldRefresh) {
            throw error;
        }

        const newAccessToken = await refreshAccessToken();

        if (!newAccessToken) {
            throw new Error("Your session has expired. Sign in again.");
        }

        return sendMultipartRequest<UploadedFile>(
            "/files",
            formData,
            newAccessToken,
        );
    }
}

async function sendFileRequest(
    path: string,
    token?: string,
): Promise<Blob> {
    const headers: HeadersInit = {};

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
        headers,
    });

    if (!response.ok) {
        let message = "File could not be loaded.";

        try {
            const errorBody = await response.json();
            message = errorBody.message ?? message;
        } catch {
            // Response body is not JSON.
        }

        throw new ApiRequestError(message, response.status);
    }

    return response.blob();
}

export async function downloadFile(
    fileId: string,
    token: string,
): Promise<Blob> {
    try {
        return await sendFileRequest(`/files/${fileId}/download`, token);
    } catch (error) {
        const shouldRefresh =
            error instanceof ApiRequestError &&
            error.status === 401;

        if (!shouldRefresh) {
            throw error;
        }

        const newAccessToken = await refreshAccessToken();

        if (!newAccessToken) {
            throw new Error("Your session has expired. Sign in again.");
        }

        return sendFileRequest(`/files/${fileId}/download`, newAccessToken);
    }
}