import { apiRequest } from "@/lib/api";
import type { MeResponse } from "@/types/api";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

function hasBrowserStorage() {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getAccessToken() {
    if (!hasBrowserStorage()) {
        return null;
    }

    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken() {
    if (!hasBrowserStorage()) {
        return null;
    }

    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setAuthTokens({
                                  accessToken,
                                  refreshToken,
                              }: {
    accessToken: string;
    refreshToken?: string | null;
}) {
    if (!hasBrowserStorage()) {
        return;
    }

    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

    if (refreshToken) {
        window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
}

export function clearAuthTokens() {
    if (!hasBrowserStorage()) {
        return;
    }

    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

type ApiClientOptions = {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
};

export async function apiClient<T>(path: string, options: ApiClientOptions = {}) {
    const token = getAccessToken();

    return apiRequest<T>(path, {
        ...options,
        token: token ?? undefined,
    });
}

export async function loadCurrentUser() {
    return apiClient<MeResponse>("/me");
}
