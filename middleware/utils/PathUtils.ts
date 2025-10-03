/**
 * Path Utilities
 * Helper functions for path classification and routing
 */

import { MiddlewareConfig, PathConfig } from "../config";

export class PathUtils {
  static getRelativePath(pathname: string): string {
    const basePath = MiddlewareConfig.basePath;
    return basePath && pathname.startsWith(basePath)
      ? pathname.slice(basePath.length) || "/"
      : pathname;
  }

  static isPublicPath(relPath: string): boolean {
    return PathConfig.public.some(path => 
      relPath === path || relPath.startsWith(path)
    );
  }

  static isStaticPath(relPath: string): boolean {
    return PathConfig.static.some(path => relPath.startsWith(path)) ||
           /\.[a-zA-Z0-9]+$/.test(relPath);
  }

  static isApiRoute(relPath: string): boolean {
    return relPath.startsWith(PathConfig.api);
  }

  static isLoginPage(relPath: string): boolean {
    return relPath.startsWith("/login");
  }
}
