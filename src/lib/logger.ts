/**
 * Production-safe logging utility
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
}

class Logger {
  private config: LoggerConfig;
  private levels = { debug: 0, info: 1, warn: 2, error: 3 };

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: process.env.NODE_ENV === "development" ? "debug" : "warn",
      enableConsole: process.env.NODE_ENV === "development",
      enableRemote: process.env.NODE_ENV === "production",
      ...config,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.config.level];
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: any
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : "";
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  debug(message: string, context?: any): void {
    if (!this.shouldLog("debug")) return;

    if (this.config.enableConsole) {
      console.debug(this.formatMessage("debug", message, context));
    }
  }

  info(message: string, context?: any): void {
    if (!this.shouldLog("info")) return;

    if (this.config.enableConsole) {
      console.info(this.formatMessage("info", message, context));
    }
  }

  warn(message: string, context?: any): void {
    if (!this.shouldLog("warn")) return;

    if (this.config.enableConsole) {
      console.warn(this.formatMessage("warn", message, context));
    }
  }

  error(message: string, error?: Error | any, context?: any): void {
    if (!this.shouldLog("error")) return;

    const errorContext = {
      ...context,
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : error,
    };

    if (this.config.enableConsole) {
      console.error(this.formatMessage("error", message, errorContext));
    }

    // Send to remote logging service in production
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      this.sendToRemote("error", message, errorContext);
    }
  }

  private async sendToRemote(
    level: LogLevel,
    message: string,
    context?: any
  ): Promise<void> {
    try {
      await fetch(this.config.remoteEndpoint!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          message,
          context,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }),
      });
    } catch {
      // Silently fail remote logging
    }
  }
}

export const logger = new Logger();
export default logger;
