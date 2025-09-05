// Deprecated: use httpClient.ts
// This file now re-exports the new Axios-based client to avoid breaking existing imports.
export { http as apiHttp, apiClient as api } from './httpClient';