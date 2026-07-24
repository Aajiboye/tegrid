import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PaginationService<T> {
  constructor(private readonly configService: ConfigService) {}

  DEFAULT_SORTING = { createdAt: -1 };

  async paginate(
    model: any,
    page = 1,
    pageSize = 10,
    totalItems: number,
    sort: number,
    populate?: any[],
  ): Promise<{
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    next_page_url?: string;
    prev_page_url?: string;
    from: number;
    to: number;
    data: T[];
  }> {
    const totalPages = Math.ceil(totalItems / pageSize);

    const nextPageUrl =
      page < totalPages ? `?page=${page + 1}&page_size=${pageSize}` : null;

    const prevPageUrl =
      page > 1 ? `?page=${page - 1}&page_size=${pageSize}` : null;

    const from = (page - 1) * pageSize + 1;

    const skip = (page - 1) * pageSize;

    let items;

    if (populate.length > 0) {
      items = await model
        .skip(skip)
        .limit(pageSize)
        .populate(populate)
        .sort(sort || this.DEFAULT_SORTING); // TOCLEANUP: This should be dynamic.
    } else {
      items = await model
        .skip(skip)
        .limit(pageSize)
        .sort(sort || this.DEFAULT_SORTING); // TOCLEANUP: This should be dynamic.
    }

    const to = Math.min(from + items.length - 1, totalItems);

    return {
      total: totalItems,
      per_page: pageSize,
      current_page: page,
      last_page: totalPages,
      next_page_url: nextPageUrl,
      prev_page_url: prevPageUrl,
      from,
      to,
      data: items,
    };
  }
}
