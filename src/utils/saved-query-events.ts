/**
 * Global event system for real-time updates across saved queries components
 */

type SavedQueryEvent = {
  type: 'saved' | 'updated' | 'deleted';
  queryId?: string;
  scope?: string;
  timestamp: number;
};

type SavedQueryEventListener = (event: SavedQueryEvent) => void;

class SavedQueryEventBus {
  private listeners: Set<SavedQueryEventListener> = new Set();

  subscribe(listener: SavedQueryEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  publish(event: SavedQueryEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in saved query event listener:', error);
      }
    });
  }

  // Convenience methods
  notifySaved(scope?: string): void {
    const event: SavedQueryEvent = {
      type: 'saved',
      timestamp: Date.now(),
    };
    if (scope) {
      event.scope = scope;
    }
    this.publish(event);
  }

  notifyUpdated(queryId: string, scope?: string): void {
    const event: SavedQueryEvent = {
      type: 'updated',
      queryId,
      timestamp: Date.now(),
    };
    if (scope) {
      event.scope = scope;
    }
    this.publish(event);
  }

  notifyDeleted(queryId: string, scope?: string): void {
    const event: SavedQueryEvent = {
      type: 'deleted',
      queryId,
      timestamp: Date.now(),
    };
    if (scope) {
      event.scope = scope;
    }
    this.publish(event);
  }

  clear(): void {
    this.listeners.clear();
  }
}

// Singleton instance for global access
export const savedQueryEvents = new SavedQueryEventBus();

export type { SavedQueryEvent, SavedQueryEventListener };