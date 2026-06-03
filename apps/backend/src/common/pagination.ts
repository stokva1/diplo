export type PaginationQuery = {
    page?: number;
    limit?: number;
};

export function getPagination(query: PaginationQuery) {
    const page = Math.max(Number(query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(query.limit ?? 20), 1), 100);
    const skip = (page - 1) * limit;

    return {
        page,
        limit,
        skip,
        take: limit,
    };
}

export function buildPaginationMeta(params: {
    page: number;
    limit: number;
    total: number;
}) {
    return {
        page: params.page,
        limit: params.limit,
        total: params.total,
        totalPages: Math.ceil(params.total / params.limit),
    };
}