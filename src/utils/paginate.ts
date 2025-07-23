// src/utils/paginate.ts
export function paginate<T>(
  items: T[],
  currentPage: number,
  perPage: number
): {
  pageItems: T[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
} {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / perPage);
  const offset = (currentPage - 1) * perPage;
  const pageItems = items.slice(offset, offset + perPage);
  return { pageItems, totalPages, currentPage, totalItems };
}
