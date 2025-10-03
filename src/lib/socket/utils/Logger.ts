/**
 * Centralized Logger for Socket Client
 * Enterprise-grade logging with multiple levels and context
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: number;
  context?: string;
  data?: any;
}

export interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  prefix: string;
  maxLogEntries: number;
  includeTimestamp: boolean;
}

export class Logger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private listeners: Map<LogLevel, Set<(entry: LogEntry) => void>> = new Map();

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      enabled: true,
      level: "info",
      prefix: "[SocketClient]",
      maxLogEntries: 1000,
      includeTimestamp: true,
      ...config,
    };

    // Initialize listener sets
    Object.values(["debug", "info", "warn", "error"] as LogLevel[]).forEach(level => {
      this.listeners.set(level, new Set());
    });
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;

    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };

    return levels[level] >= levels[this.config.level];
  }

  private createLogEntry(level: LogLevel, message: string, data?: unknown, context?: string): LogEntry {
    const entry: LogEntry = {
      level,
      message: `${this.config.prefix} ${message}`,
      timestamp: Date.now(),
      data,
    };

    if (context !== undefined) {
      entry.context = context;
    }

    return entry;
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;

    // Store log entry
    this.logs.push(entry);
    if (this.logs.length > this.config.maxLogEntries) {
      this.logs.shift();
    }

    // Notify listeners
    const listeners = this.listeners.get(entry.level);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(entry);
        } catch (error) {
          console.error("Logger listener error:", error);
        }
      });
    }

    // Console output
    const timestamp = this.config.includeTimestamp ? `[${new Date(entry.timestamp).toISOString()}] ` : "";
    const context = entry.context ? `[${entry.context}] ` : "";
    const logMessage = `${timestamp}${context}${entry.message}`;

    switch (entry.level) {
      case "debug":
        console.debug(logMessage, entry.data || "");
        break;
      case "info":
        console.info(logMessage, entry.data || "");
        break;
      case "warn":
        console.warn(logMessage, entry.data || "");
        break;
      case "error":
        console.error(logMessage, entry.data || "");
        break;
    }
  }

  debug(message: string, data?: any, context?: string): void {
    const entry = this.createLogEntry("debug", message, data, context);
    this.log(entry);
  }

  info(message: string, data?: any, context?: string): void {
    const entry = this.createLogEntry("info", message, data, context);
    this.log(entry);
  }

  warn(message: string, data?: any, context?: string): void {
    const entry = this.createLogEntry("warn", message, data, context);
    this.log(entry);
  }

  error(message: string, data?: any, context?: string): void {
    const entry = this.createLogEntry("error", message, data, context);
    this.log(entry);
  }

  // Log management
  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  // Event listeners
  onLog(level: LogLevel, listener: (entry: LogEntry) => void): () => void {
    const listeners = this.listeners.get(level);
    if (listeners) {
      listeners.add(listener);

      // Return cleanup function
      return () => {
        listeners.delete(listener);
      };
    }
    return () => {};
  }

  // Configuration
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  // Static factory methods
  static create(config?: Partial<LoggerConfig>): Logger {
    return new Logger(config);
  }

  static createDisabled(): Logger {
    return new Logger({ enabled: false });
  }

  static createDebug(): Logger {
    return new Logger({
      level: "debug",
      prefix: "[SocketClient:DEBUG]"
    });
  }
}

export default Logger;