/**
 * Event Manager
 * Enterprise-grade event handling and lifecycle management
 */

import { Socket } from "socket.io-client";
import {
  IEventHandlerManager,
  SocketEventListeners,
  EventListenerOptions,
  SocketEventHandler
} from "../types";
import Logger from "../utils/Logger";

interface EventListener {
  fn: (...args: any[]) => void;
  options: EventListenerOptions;
  id: string;
  wrappedListener?: (...args: any[]) => void;
}

export class EventManager implements IEventHandlerManager {
  private listeners: Map<string, Map<string, EventListener>> = new Map();
  private socket: Socket | null = null;
  private logger: Logger;
  private eventQueue: Array<{ event: string; args: any[]; timestamp: number }> = [];
  private maxQueueSize = 1000;
  private isProcessingQueue = false;
  private registeredSocketHandlers: Set<string> = new Set();

  constructor(logger: Logger) {
    this.logger = logger;
    this.logger.debug("EventManager initialized");
  }

  setSocket(socket: Socket | null): void {
    const oldSocket = this.socket;
    this.socket = socket;

    if (oldSocket && oldSocket !== socket) {
      this.detachFromSocket(oldSocket);
    }

    if (socket) {
      this.attachToSocket(socket);
    }

    this.logger.debug("Socket reference updated", {
      hasSocket: !!socket,
      listenersCount: this.getTotalListenersCount(),
    });
  }

  addListener(event: string, listener: (...args: any[]) => void, options: EventListenerOptions = {}): void {
    const listenerId = this.generateListenerId();
    const eventListeners = this.listeners.get(event) || new Map();

    // Check if listener already exists
    for (const [id, existingListener] of eventListeners) {
      if (existingListener.fn === listener && !existingListener.options.once) {
        this.logger.debug("Listener already exists, skipping", { event, id });
        return;
      }
    }

    const eventListener: EventListener = {
      fn: listener,
      options: { once: false, priority: 0, ...options },
      id: listenerId,
    };

    eventListeners.set(listenerId, eventListener);
    this.listeners.set(event, eventListeners);

    // Attach to socket if available
    if (this.socket) {
      this.attachListenerToSocket(event, eventListener);
    }

    this.logger.debug("Listener added", {
      event,
      listenerId,
      once: eventListener.options.once,
      priority: eventListener.options.priority,
    });
  }

  removeListener(event: string, listener?: (...args: any[]) => void): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;

    if (listener) {
      // Remove specific listener
      for (const [id, eventListener] of eventListeners) {
        if (eventListener.fn === listener) {
          eventListeners.delete(id);
          this.detachListenerFromSocket(event, id);

          this.logger.debug("Listener removed", { event, listenerId: id });
          break;
        }
      }
    } else {
      // Remove all listeners for event
      const count = eventListeners.size;
      eventListeners.clear();
      this.detachAllListenersFromSocket(event);

      this.logger.debug("All listeners removed for event", { event, count });
    }

    // Clean up empty event map
    if (eventListeners.size === 0) {
      this.listeners.delete(event);
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.removeListener(event);
    } else {
      // Remove all listeners for all events
      const totalEvents = this.listeners.size;
      for (const [eventName] of this.listeners) {
        this.detachAllListenersFromSocket(eventName);
      }
      this.listeners.clear();

      this.logger.debug("All listeners removed", { totalEvents });
    }
  }

  emit(event: string, ...args: any[]): void {
    if (!this.socket?.connected) {
      // Queue event for when socket connects
      this.queueEvent(event, args);
      this.logger.debug("Event queued (socket not connected)", { event });
      return;
    }

    try {
      this.socket.emit(event, ...args);
      this.logger.debug("Event emitted", { event, args });
    } catch (error) {
      this.logger.error("Failed to emit event", { event, error });
    }
  }

  registerSocketHandler(name: string, handler: SocketEventHandler): void {
    if (this.registeredSocketHandlers.has(name)) {
      this.logger.warn("Socket handler already registered", { name });
      return;
    }

    this.registeredSocketHandlers.add(name);

    if (this.socket) {
      try {
        handler.setup(this.socket, this.createSocketContext());
        this.logger.debug("Socket handler registered", { name });
      } catch (error) {
        this.logger.error("Failed to register socket handler", { name, error });
      }
    }
  }

  unregisterSocketHandler(name: string): void {
    if (!this.registeredSocketHandlers.has(name)) {
      return;
    }

    this.registeredSocketHandlers.delete(name);
    this.logger.debug("Socket handler unregistered", { name });
  }

  getListenerCount(event?: string): number {
    if (event) {
      return this.listeners.get(event)?.size || 0;
    }

    let total = 0;
    for (const eventListeners of this.listeners.values()) {
      total += eventListeners.size;
    }
    return total;
  }

  getEventList(): string[] {
    return Array.from(this.listeners.keys());
  }

  processQueuedEvents(): void {
    if (this.isProcessingQueue || !this.socket?.connected) {
      return;
    }

    this.isProcessingQueue = true;
    const events = [...this.eventQueue];
    this.eventQueue = [];

    this.logger.debug("Processing queued events", { count: events.length });

    for (const { event, args, timestamp } of events) {
      const delay = Date.now() - timestamp;
      if (delay > 30000) { // 30 seconds
        this.logger.warn("Skipping old queued event", { event, delay });
        continue;
      }

      try {
        this.socket.emit(event, ...args);
        this.logger.debug("Queued event emitted", { event, delay });
      } catch (error) {
        this.logger.error("Failed to emit queued event", { event, error });
      }
    }

    this.isProcessingQueue = false;
  }

  cleanup(): void {
    this.logger.debug("Cleaning up EventManager");

    // Detach from socket
    if (this.socket) {
      this.detachFromSocket(this.socket);
    }

    // Clear all listeners
    this.listeners.clear();
    this.eventQueue = [];
    this.registeredSocketHandlers.clear();

    this.logger.debug("EventManager cleaned up");
  }

  private attachToSocket(socket: Socket): void {
    // Attach existing listeners
    for (const [event, eventListeners] of this.listeners) {
      for (const eventListener of eventListeners.values()) {
        this.attachListenerToSocket(event, eventListener);
      }
    }

    // Setup registered handlers
    for (const handlerName of this.registeredSocketHandlers) {
      try {
        // This would need to be implemented based on actual handler registry
        this.logger.debug("Re-attaching socket handler", { handlerName });
      } catch (error) {
        this.logger.error("Failed to re-attach socket handler", { handlerName, error });
      }
    }

    // Process queued events
    setTimeout(() => this.processQueuedEvents(), 100);

    this.logger.debug("Attached to socket", {
      listenersCount: this.getTotalListenersCount(),
      queuedEvents: this.eventQueue.length,
    });
  }

  private detachFromSocket(socket: Socket): void {
    for (const [event] of this.listeners) {
      this.detachAllListenersFromSocket(event);
    }

    this.logger.debug("Detached from socket");
  }

  private attachListenerToSocket(event: string, eventListener: EventListener): void {
    if (!this.socket) return;

    const wrappedListener = (...args: any[]) => {
      try {
        eventListener.fn(...args);

        // Remove once listeners
        if (eventListener.options.once) {
          this.removeListener(event, eventListener.fn);
        }
      } catch (error) {
        this.logger.error("Event listener error", {
          event,
          listenerId: eventListener.id,
          error,
        });
      }
    };

    // Store wrapped listener reference for cleanup
    (eventListener as any).wrappedListener = wrappedListener;
    this.socket.on(event, wrappedListener);
  }

  private detachListenerFromSocket(event: string, listenerId: string): void {
    if (!this.socket) return;

    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;

    const eventListener = eventListeners.get(listenerId);
    if (eventListener?.wrappedListener) {
      try {
        this.socket.off(event, eventListener.wrappedListener);
      } catch (error) {
        this.logger.error("Error detaching listener from socket", {
          event,
          listenerId,
          error: error instanceof Error ? error.message : String(error)
        });
      } finally {
        delete eventListener.wrappedListener;
      }
    }
  }

  private detachAllListenersFromSocket(event: string): void {
    if (!this.socket) return;

    const eventListeners = this.listeners.get(event);
    if (!eventListeners) return;

    const detachedCount = eventListeners.size;
    const errors: Array<{ listenerId: string; error: string }> = [];

    for (const eventListener of eventListeners.values()) {
      if (eventListener.wrappedListener) {
        try {
          this.socket.off(event, eventListener.wrappedListener);
        } catch (error) {
          errors.push({
            listenerId: eventListener.id,
            error: error instanceof Error ? error.message : String(error)
          });
        } finally {
          delete eventListener.wrappedListener;
        }
      }
    }

    if (errors.length > 0) {
      this.logger.warn("Errors detaching listeners from socket", {
        event,
        detachedCount,
        errorCount: errors.length,
        errors
      });
    }
  }

  private queueEvent(event: string, args: any[]): void {
    if (this.eventQueue.length >= this.maxQueueSize) {
      // Remove oldest events to maintain queue size
      const removed = this.eventQueue.shift();
      this.logger.warn("Event queue full, removed oldest event", { removed });
    }

    this.eventQueue.push({
      event,
      args,
      timestamp: Date.now(),
    });
  }

  private generateListenerId(): string {
    return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getTotalListenersCount(): number {
    let total = 0;
    for (const eventListeners of this.listeners.values()) {
      total += eventListeners.size;
    }
    return total;
  }

  private createSocketContext(): any {
    // This would create the context needed by socket handlers
    return {
      config: {},
      managers: {},
      logger: this.logger,
    };
  }
}

export default EventManager;