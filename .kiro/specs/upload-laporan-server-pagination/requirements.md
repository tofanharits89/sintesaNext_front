# Requirements Document

## Introduction

This feature migrates the Upload Laporan tables on the `/transfer-daerah/upload-laporan` page from client-side pagination to server-side pagination. Currently, all report data is fetched at once and paginated on the frontend by the DataTable component. As the number of uploaded reports grows, this causes performance degradation, slow API response times, and high memory usage. The migration updates the backend API endpoints to support `page` and `limit` query parameters (translated to SQL LIMIT/OFFSET), and updates the frontend hooks and components to pass pagination state to the API and use manual (server-controlled) pagination in the DataTable.

## Glossary

- **Backend_API**: The Express.js server (Node.js + TypeScript) running on port 88 that serves the transfer-daerah endpoints using raw SQL queries against PostgreSQL via Sequelize.
- **Frontend_App**: The Next.js application (TypeScript + React) that consumes the Backend_API and renders the Upload Laporan page.
- **DataTable**: The reusable TanStack Table component (`data-table.tsx`) that supports both client-side and server-side (manual) pagination modes.
- **Upload_Laporan_Keuangan_KPPN_Endpoint**: The GET `/transfer-daerah/upload-laporan/kppn/keuangan` API endpoint that returns financial report upload records.
- **Upload_Laporan_Monev_KPPN_Endpoint**: The GET `/transfer-daerah/upload-laporan/kppn/monev` API endpoint that returns monitoring & evaluation report upload records for KPPN.
- **Upload_Laporan_Monev_Kanwil_Endpoint**: The GET `/transfer-daerah/upload-laporan/kanwil/monev` API endpoint that returns monitoring & evaluation report upload records for Kanwil.
- **Pagination_Parameters**: The query string parameters `page` (1-based page number) and `limit` (rows per page) sent by the frontend to control server-side pagination.
- **Periode_Filter**: A dropdown filter in the frontend that selects a reporting period (e.g., Triwulan, Semester, Bulanan) and sends it as a query parameter to the backend.
- **React_Query_Hook**: A TanStack Query (React Query) custom hook that manages data fetching, caching, and refetching for a specific API endpoint.
- **Total_Count**: The total number of rows matching the current filter criteria, returned by the backend alongside the paginated data rows.

## Requirements

### Requirement 1: Backend Pagination Support for Keuangan KPPN Endpoint

**User Story:** As a frontend application, I want the Upload Laporan Keuangan KPPN endpoint to accept pagination parameters and return paginated results with a total count, so that the page loads faster and uses less memory.

#### Acceptance Criteria

1. WHEN a GET request is received with `page` and `limit` query parameters, THE Upload_Laporan_Keuangan_KPPN_Endpoint SHALL return only the rows for the requested page by applying SQL OFFSET of (`page` - 1) * `limit` and LIMIT of `limit` to the data query.
2. WHEN a GET request is received with `page` and `limit` query parameters, THE Upload_Laporan_Keuangan_KPPN_Endpoint SHALL execute a separate COUNT(*) query with the same WHERE conditions and return the total count in the response body as `total`.
3. IF the `page` parameter is absent, not a positive integer, or less than 1, THEN THE Upload_Laporan_Keuangan_KPPN_Endpoint SHALL default `page` to 1.
4. IF the `limit` parameter is absent, not a positive integer, or less than 1, THEN THE Upload_Laporan_Keuangan_KPPN_Endpoint SHALL default `limit` to 10.
5. IF the `limit` parameter exceeds 100, THEN THE Upload_Laporan_Keuangan_KPPN_Endpoint SHALL cap `limit` to 100.
6. WHEN a `periode` query parameter is provided, THE Upload_Laporan_Keuangan_KPPN_Endpoint SHALL include a WHERE clause filtering by the periode value and apply it to both the data query and the count query.
7. IF the requested `page` exceeds the available pages (i.e., OFFSET >= total count), THEN THE Upload_Laporan_Keuangan_KPPN_Endpoint SHALL return an empty `data` array with the actual `total` count.
8. THE Upload_Laporan_Keuangan_KPPN_Endpoint SHALL return a response in the format `{ success: true, data: rows, total: number }`.

### Requirement 2: Backend Pagination Support for Monev KPPN Endpoint

**User Story:** As a frontend application, I want the Upload Laporan Monev KPPN endpoint to accept pagination parameters and return paginated results with a total count, so that the page loads faster and uses less memory.

#### Acceptance Criteria

1. WHEN a GET request is received with `page` and `limit` query parameters, THE Upload_Laporan_Monev_KPPN_Endpoint SHALL return only the rows for the requested page using SQL LIMIT and OFFSET clauses, where OFFSET is calculated as (`page` - 1) * `limit`.
2. WHEN a GET request is received with `page` and `limit` query parameters, THE Upload_Laporan_Monev_KPPN_Endpoint SHALL execute a separate COUNT(*) query with the same WHERE conditions and return the total count in the response body as `total`.
3. IF the `page` parameter is absent, not a positive integer, or less than 1, THEN THE Upload_Laporan_Monev_KPPN_Endpoint SHALL default `page` to 1.
4. IF the `limit` parameter is absent, not a positive integer, or less than 1, THEN THE Upload_Laporan_Monev_KPPN_Endpoint SHALL default `limit` to 10. IF the `limit` parameter exceeds 100, THEN THE Upload_Laporan_Monev_KPPN_Endpoint SHALL cap `limit` to 100.
5. WHEN a `periode` query parameter is provided, THE Upload_Laporan_Monev_KPPN_Endpoint SHALL include a WHERE clause filtering by the periode value and apply it to both the data query and the count query.
6. THE Upload_Laporan_Monev_KPPN_Endpoint SHALL return a response in the format `{ success: true, data: rows, total: number, page: number, limit: number }`.
7. WHEN the requested `page` exceeds the available data (OFFSET >= total), THE Upload_Laporan_Monev_KPPN_Endpoint SHALL return an empty array in `data` with the correct `total` count and the requested `page` and `limit` values.

### Requirement 3: Backend Pagination Support for Monev Kanwil Endpoint

**User Story:** As a frontend application, I want the Upload Laporan Monev Kanwil endpoint to accept pagination parameters and return paginated results with a total count, so that the page loads faster and uses less memory.

#### Acceptance Criteria

1. WHEN a GET request is received with `page` and `limit` query parameters, THE Upload_Laporan_Monev_Kanwil_Endpoint SHALL return only the rows for the requested page by applying SQL OFFSET of (`page` - 1) * `limit` and LIMIT of `limit` to the data query.
2. WHEN a GET request is received with `page` and `limit` query parameters, THE Upload_Laporan_Monev_Kanwil_Endpoint SHALL execute a separate COUNT(*) query with the same WHERE conditions and return the total count in the response body as `total`.
3. IF the `page` parameter is absent, not a positive integer, or less than 1, THEN THE Upload_Laporan_Monev_Kanwil_Endpoint SHALL default `page` to 1.
4. IF the `limit` parameter is absent, not a positive integer, or less than 1, THEN THE Upload_Laporan_Monev_Kanwil_Endpoint SHALL default `limit` to 10. IF the `limit` parameter exceeds 100, THEN THE Upload_Laporan_Monev_Kanwil_Endpoint SHALL cap `limit` to 100.
5. WHEN a `periode` query parameter is provided, THE Upload_Laporan_Monev_Kanwil_Endpoint SHALL include a WHERE clause filtering by the periode value and apply it to both the data query and the count query.
6. IF the requested `page` exceeds the available pages (i.e., OFFSET >= total count), THEN THE Upload_Laporan_Monev_Kanwil_Endpoint SHALL return an empty `data` array with the actual `total` count.
7. THE Upload_Laporan_Monev_Kanwil_Endpoint SHALL return a response in the format `{ success: true, data: rows, total: number }`.

### Requirement 4: Backend Pagination Parameter Validation

**User Story:** As a system administrator, I want the backend to validate pagination parameters, so that invalid inputs do not cause SQL errors or unexpected behavior.

#### Acceptance Criteria

1. IF the `page` query parameter is absent, zero, a negative number, a floating-point number, or a non-numeric value, THEN THE Backend_API SHALL treat it as page 1.
2. IF the `limit` query parameter is absent, zero, a negative number, a floating-point number, or a non-numeric value, THEN THE Backend_API SHALL treat it as limit 10.
3. IF the `limit` query parameter is a numeric value greater than 100, THEN THE Backend_API SHALL cap the limit at 100.
4. THE Backend_API SHALL return results starting at offset `(page - 1) * limit` from the beginning of the result set, where `page` and `limit` are the validated values after applying criteria 1 through 3.
5. IF the computed offset exceeds the total number of available records, THEN THE Backend_API SHALL return an empty result set with no error.

### Requirement 5: Frontend Hook Pagination Support for Keuangan KPPN

**User Story:** As a frontend developer, I want the useUploadLaporanKeuanganKppn hook to accept pagination and filter parameters, so that it fetches only the current page of data from the server.

#### Acceptance Criteria

1. WHEN the hook is called with `page`, `limit`, and `periode` arguments, THE React_Query_Hook SHALL append `page` (1-based integer) and `limit` (integer, 1–100) as query parameters to the API URL.
2. WHEN the hook is called with a `periode` value other than "all" or empty string, THE React_Query_Hook SHALL append `periode` as a query parameter to the API URL; IF `periode` is "all" or empty string, THEN THE React_Query_Hook SHALL omit the `periode` query parameter from the URL.
3. WHEN the hook is called with `page`, `limit`, and `periode` arguments, THE React_Query_Hook SHALL include `page`, `limit`, and `periode` in the React Query `queryKey` array so that changes to any parameter trigger a refetch.
4. WHEN the API response contains a numeric `total` field, THE React_Query_Hook SHALL parse and return it as a non-negative integer alongside the row data.
5. IF the API response does not contain a `total` field or the field is not a valid number, THEN THE React_Query_Hook SHALL default `total` to 0.
6. THE React_Query_Hook SHALL return an object containing `rows` (array of mapped row objects), `total` (number), `isLoading` (boolean), `error` (Error or null), and `refetch` (function to manually re-trigger the query).

### Requirement 6: Frontend Hook Pagination Support for Monev KPPN

**User Story:** As a frontend developer, I want the useUploadLaporanMonevKppn hook to accept pagination and filter parameters, so that it fetches only the current page of data from the server.

#### Acceptance Criteria

1. WHEN the hook is called with `page` (1-based integer ≥ 1), `limit` (integer between 1 and 100), and `periode` arguments, THE React_Query_Hook SHALL append `page` and `limit` as query parameters to the API URL, and append `periode` only when its value is not "all" and not empty.
2. WHEN the hook is called with `page`, `limit`, and `periode` arguments, THE React_Query_Hook SHALL include `page`, `limit`, and `periode` in the React Query `queryKey` array alongside the existing user-scoped keys (user role, kdkppn).
3. WHEN the API response contains a `total` field, THE React_Query_Hook SHALL parse it as a number and return it alongside the row data. IF the `total` field is absent or not a valid number, THEN THE React_Query_Hook SHALL default `total` to 0.
4. THE React_Query_Hook SHALL return an object containing `rows` (array of `UploadLaporanMonevKppnRow`), `total` (number, defaulting to 0 when no data is loaded), `isLoading` (boolean), `error` (Error or null), and `refetch` (function).

### Requirement 7: Frontend Hook Pagination Support for Monev Kanwil

**User Story:** As a frontend developer, I want the useUploadLaporanMonevKanwil hook to accept pagination and filter parameters, so that it fetches only the current page of data from the server.

#### Acceptance Criteria

1. WHEN the hook is called with `page` (1-based integer ≥ 1), `limit` (integer between 1 and 100), and `periode` arguments, THE React_Query_Hook SHALL append `page` and `limit` as query parameters to the API URL, and append `periode` only when its value is not "all" and not empty.
2. WHEN the hook is called with `page`, `limit`, and `periode` arguments, THE React_Query_Hook SHALL include `page`, `limit`, and `periode` in the React Query `queryKey` array alongside the existing user-scoped keys (user role, kdkanwil).
3. WHEN the API response contains a `total` field, THE React_Query_Hook SHALL parse it as a number and return it alongside the row data. IF the `total` field is absent or not a valid number, THEN THE React_Query_Hook SHALL default `total` to 0.
4. THE React_Query_Hook SHALL return an object containing `rows` (array of `UploadLaporanMonevKanwilRow`), `total` (number, defaulting to 0 when no data is loaded), `isLoading` (boolean), `error` (Error or null), and `refetch` (function).

### Requirement 8: Frontend Component Server-Side Pagination for Laporan Keuangan KPPN Tab

**User Story:** As a user, I want the Laporan Keuangan KPPN table to use server-side pagination, so that the page loads quickly even with large datasets.

#### Acceptance Criteria

1. THE Frontend_App SHALL maintain local pagination state (`pageIndex` and `pageSize`) in the LaporanKeuanganKppnTab component with initial values of `pageIndex` = 0 and `pageSize` = 10.
2. WHEN the user changes the Periode filter dropdown, THE Frontend_App SHALL reset `pageIndex` to 0 and trigger a new server request with the updated filter value.
3. THE Frontend_App SHALL pass `page` (as `pageIndex + 1`, 1-indexed), `limit` (equal to `pageSize`), and `periode` (the selected filter value) to the useUploadLaporanKeuanganKppn hook based on the current pagination and filter state.
4. THE Frontend_App SHALL render the DataTable with `manualPagination` enabled, pass the `total` from the API response as `rowCount`, and supply the current `controlledPagination` state and an `onPaginationChange` callback.
5. WHEN the user navigates to a different page in the DataTable, THE Frontend_App SHALL update the `pageIndex` in pagination state and trigger a new server request for the target page.
6. WHILE the API request for a new page is in progress, THE Frontend_App SHALL display a TableSkeleton loading indicator in the table area.
7. IF the API request for a page fails, THEN THE Frontend_App SHALL display an error message indicating the failure reason in the table area and retain the previous pagination state so the user can retry.
8. WHEN the user changes the page size (rows per page) via the DataTable control, THE Frontend_App SHALL reset `pageIndex` to 0, update `pageSize` to the selected value, and trigger a new server request.

### Requirement 9: Frontend Component Server-Side Pagination for Laporan Monev KPPN Tab

**User Story:** As a user, I want the Laporan Monev KPPN table to use server-side pagination, so that the page loads quickly even with large datasets.

#### Acceptance Criteria

1. THE Frontend_App SHALL maintain local pagination state (`pageIndex` starting at 0 and `pageSize` defaulting to 10) in the LaporanMonevKppnTab component.
2. WHEN the user changes the Triwulan filter dropdown or the Tahun filter dropdown, THE Frontend_App SHALL reset `pageIndex` to 0 and trigger a new server request with the updated filter values.
3. THE Frontend_App SHALL pass `page` (computed as `pageIndex + 1`), `limit` (equal to `pageSize`), and `periode` (derived from the selected Triwulan value) to the useUploadLaporanMonevKppn hook based on the current pagination and filter state.
4. THE Frontend_App SHALL render the DataTable with `manualPagination` enabled and pass the `total` from the API response as `rowCount`.
5. WHEN the user navigates to a different page in the DataTable, THE Frontend_App SHALL update the pagination state and trigger a new server request for the target page.
6. WHILE the API request for a new page is in progress, THE Frontend_App SHALL display a skeleton loader in the table area in place of the table rows.
7. WHEN the user changes the rows-per-page selection in the DataTable, THE Frontend_App SHALL update `pageSize`, reset `pageIndex` to 0, and trigger a new server request with the updated pagination parameters.

### Requirement 10: Frontend Component Server-Side Pagination for Laporan Monev Kanwil Tab

**User Story:** As a user, I want the Laporan Monev Kanwil table to use server-side pagination, so that the page loads quickly even with large datasets.

#### Acceptance Criteria

1. THE Frontend_App SHALL maintain local pagination state (`pageIndex` starting at 0 and `pageSize` defaulting to 10) in the LaporanMonevKanwilTab component.
2. WHEN the user changes the Periode filter dropdown, THE Frontend_App SHALL reset `pageIndex` to 0 and trigger a new server request with the updated `periode` value and the current `pageSize`.
3. THE Frontend_App SHALL pass `page` (derived from `pageIndex + 1`), `limit` (derived from `pageSize`), and `periode` (from the selected filter value) as query parameters to the useUploadLaporanMonevKanwil hook on every pagination or filter state change.
4. THE Frontend_App SHALL render the DataTable with `manualPagination` enabled, pass the `total` from the API response as `rowCount`, and supply a controlled pagination state and `onPaginationChange` callback.
5. WHEN the user navigates to a different page in the DataTable, THE Frontend_App SHALL update `pageIndex` to the selected page index and trigger a new server request for that page.
6. WHILE the API request for a new page is in progress, THE Frontend_App SHALL display a table skeleton loader (TableSkeleton) in the table area, replacing the table content until the response is received.
7. IF the API request for a page returns an error, THEN THE Frontend_App SHALL display an inline error message above the table indicating the failure reason and retain the previously displayed data or empty state.
8. THE Frontend_App SHALL calculate row numbers displayed in the "No" column using the formula `(pageIndex * pageSize) + row.index + 1` to reflect the correct sequential position across pages.

### Requirement 11: Removal of Client-Side Filtering

**User Story:** As a developer, I want to remove client-side filtering logic from the tab components, so that filtering is handled entirely by the server and the code is simpler.

#### Acceptance Criteria

1. THE Frontend_App SHALL remove the `useMemo`-based client-side filtering by periode (including the `filteredData` variable and associated helper functions such as `normalizeText` and `getPeriodeBase`) from the LaporanKeuanganKppnTab component.
2. THE Frontend_App SHALL remove the `useMemo`-based client-side filtering by periode (including the `filteredData` variable) from the LaporanMonevKppnTab component.
3. THE Frontend_App SHALL remove the `useMemo`-based client-side filtering by periode (including the `filteredData` variable) from the LaporanMonevKanwilTab component.
4. WHEN the "Semua Periode" (all) option is selected, THE Frontend_App SHALL send the request without a `periode` query parameter, causing the backend to return all records regardless of period.
5. WHEN a specific periode option is selected (not "all"), THE Frontend_App SHALL include the selected value as the `periode` query parameter in the server request, so that the backend returns only records matching that period.
6. THE Frontend_App SHALL pass the data returned from the server hook directly to the DataTable `data` prop without any intermediate client-side filtering transformation.

### Requirement 12: Row Numbering Consistency with Server-Side Pagination

**User Story:** As a user, I want the row numbers in the table to reflect the correct position across all pages, so that I can identify records by their global position.

#### Acceptance Criteria

1. THE Frontend_App SHALL compute the row number for each row displayed in the DataTable using the formula `(pageIndex * pageSize) + rowIndex + 1`, where `pageIndex` is 0-based and `rowIndex` is the 0-based position of the row within the current page.
2. WHEN the user navigates to page 2 with a page size of 10, THE Frontend_App SHALL display row numbers starting from 11.
3. WHEN the user changes the page size, THE Frontend_App SHALL recalculate row numbers based on the new `pageSize` and the reset `pageIndex` of 0.
