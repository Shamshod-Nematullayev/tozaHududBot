import { SortOrder } from "mongoose";

interface PaginationOptions {
  page?: string | number;
  limit?: string | number;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

export function getPagination(options: PaginationOptions): {
  skip: number;
  limit: number;
  sort: { [key: string]: SortOrder };
  meta: {
    page: number;
    limit: number;
  };
} {
  const {
    page = 1,
    limit = 10,
    sortField = "createdAt",
    sortDirection = "desc",
  } = options;

  const parsedPage = parseInt(page as string);
  const parsedLimit = parseInt(limit as string);

  return {
    skip: (parsedPage - 1) * parsedLimit,
    limit: parsedLimit,
    sort: {
      [sortField as string]: sortDirection === "asc" ? 1 : -1,
    },
    meta: {
      page: parsedPage,
      limit: parsedLimit,
    },
  };
}
