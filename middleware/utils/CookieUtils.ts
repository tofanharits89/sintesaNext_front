/**
 * Cookie Utilities
 * Helper functions for cookie management
 */

import { NextResponse } from "next/server";
import { CookieNames } from "../config";

export class CookieUtils {
  /**
   * Expire all authentication-related cookies
   */
  static expireAuthCookies(res: NextResponse): void {
    try {
      const past = new Date(0);
      const names = Object.values(CookieNames);
      const paths = ["/", "/api", "/auth"];
      
      for (const name of names) {
        for (const path of paths) {
          res.cookies.set({ name, value: "", expires: past, path });
        }
      }
    } catch {
      // Ignore cookie set errors in middleware context
    }
  }
}
