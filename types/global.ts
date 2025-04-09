export interface GenericAPIResponse<T> {
  success: boolean;
  code: number;
  data: T;

  pagination?: {
    query_count: number;
    prev_page?: string;
    next_page?: string;
  };
}

export interface GenericAPIBody {
  message: string;
  error?: Errors;
}

export type Errors =
  | "MISSING_FIELDS"
  | "INVALID_REQUEST"
  | "INVALID_ENDPOINT"
  | "UNCAUGHT_ERROR"
  | "QUERY_ERROR"
  | "AUTHENTICATION_ERROR"
  | "DOESNT_EXIST_ERROR"
  | "INVALID_PARAMETERS";

// export interface PaginationQueries {
//   page?: string;
// }

// export type SortType = "COST" | "DISCOUNT" | "ALPHABETICAL" | "POPULARITY";
// export type SortOrder = "ASC" | "DESC";

// export interface SortingQueries {
//   sort?: SortType;
//   order?: SortOrder;
// }
