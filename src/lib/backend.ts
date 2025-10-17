/**
 * @deprecated This file is deprecated. Use @/lib/config instead.
 * 
 * Migration guide:
 * - import { BACKEND_BASE_URL } from "@/lib/backend" → import { config } from "@/lib/config"; use config.apiUrl
 * - import { backendPath } from "@/lib/backend" → import { backendPath } from "@/lib/config"
 * 
 * This file is kept for backward compatibility only.
 */

import { config, backendPath as newBackendPath } from "@/lib/config";

/**
 * @deprecated Use config.apiUrl from @/lib/config instead
 */
export const BACKEND_BASE_URL = config.apiUrl;

/**
 * @deprecated Use backendPath from @/lib/config instead
 */
export function backendPath(path: string): string {
  return newBackendPath(path);
}
