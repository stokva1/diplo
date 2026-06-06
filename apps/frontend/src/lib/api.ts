const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not set");
}

type RequestOptions = {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    token?: string;
    body?: unknown;
};

export async function apiRequest<T>(
    path: string,
    options: RequestOptions = {},
): Promise<T> {
    const headers: HeadersInit = {
        Accept: "application/json",
    };

    if (options.body !== undefined) {
        headers["Content-Type"] = "application/json";
    }

    if (options.token) {
        headers.Authorization = `Bearer ${options.token}`;
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

        throw new Error(message);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}