export class PageOptions {
  page?: number;
  size?: number;
}

export class PaginatedResponse<T> {
  page: number;
  size: number;
  pageTotal: number;
  hasNext: boolean;
  hasPrevious: boolean;
  data: T;
}
