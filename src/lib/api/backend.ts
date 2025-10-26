/**
 * @deprecated This file is deprecated. Use @/lib/config/config instead.
 * 
 * Migration guide:
 * - import { BACKEND_BASE_URL } from "@/lib/api/backend" → import { config } from "@/lib/config/config"; use config.apiUrl
 * - import { backendPath } from "@/lib/api/backend" → import { backendPath } from "@/lib/config/config"
 * 
 * This file is kept for backward compatibility only.
 */

import { config, backendPath as newBackendPath } from "../config/config";

/**
 * @deprecated Use config.apiUrl from @/lib/config/config instead
 */
export const BACKEND_BASE_URL = config.apiUrl;

/**
 * @deprecated Use backendPath from @/lib/config/config instead
 */
export function backendPath(path: string): string {
  return newBackendPath(path);
}
