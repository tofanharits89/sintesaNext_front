/**
 * Health Check Service
 * Manages backend health checks with circuit breaker pattern
 */

import { backendPath } from "@/lib/backend";
import { MiddlewareConfig } from "../config";
import type { CircuitBreakerState } from "../types";

class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: CircuitBreakerState = 'CLOSED';
  
  async check(): Promise<boolean> {
    if (this.state === 'OPEN' && Date.now() - this.lastFailure < MiddlewareConfig.circuitBreakerTimeout) {
      return false;
    }
    
    try {
      const result = await this.performHealthCheck();
      if (result) {
        this.failures = 0;
        this.state = 'CLOSED';
      }
      return result;
    } catch {
      this.failures++;
      this.lastFailure = Date.now();
      if (this.failures >= MiddlewareConfig.circuitBreakerFailureThreshold) {
        this.state = 'OPEN';
      }
      return false;
    }
  }
  
  private async performHealthCheck(): Promise<boolean> {
    const ac = new AbortController();
    const timeout = setTimeout(() => ac.abort(), 2000);

    try {
      const resp = await fetch(backendPath("/health"), {
        method: "GET",
        cache: "no-store",
        signal: ac.signal,
      });
      clearTimeout(timeout);
      return resp.ok;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export class HealthCheckService {
  private circuitBreaker = new CircuitBreaker();
  private healthCache: { ok: boolean; exp: number } | null = null;

  async isBackendHealthy(): Promise<boolean> {
    const now = Date.now();
    if (this.healthCache && this.healthCache.exp > now) {
      if (MiddlewareConfig.debugAuth) {
        console.debug("[Auth] health cache hit");
      }
      return this.healthCache.ok;
    }

    const ok = await this.circuitBreaker.check();
    this.healthCache = { ok, exp: now + MiddlewareConfig.healthCheckTtl };
    return ok;
  }
}
