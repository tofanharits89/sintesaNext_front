/**
 * Message Deduplication Service
 * Manages duplicate detection with bounded memory usage
 * Replaces multiple overlapping strategies in useMessagesRQ
 */

interface DuplicationEntry {
  id: string;
  content: string;
  timestamp: number;
}

export class MessageDuplicationService {
  private seenIds: Map<string, number> = new Map();
  private contentHashes: Map<string, number> = new Map();
  private maxSize: number = 500;
  private cleanupThreshold: number = 1000;

  constructor(maxSize: number = 500) {
    this.maxSize = maxSize;
    this.cleanupThreshold = maxSize * 2;
  }

  /**
   * Check if message ID has been seen
   */
  public hasSeen(id: string): boolean {
    if (this.seenIds.has(id)) {
      // Update timestamp to mark as recently seen
      this.seenIds.set(id, Date.now());
      return true;
    }
    return false;
  }

  /**
   * Mark message as seen
   */
  public markSeen(id: string, content: string): void {
    const now = Date.now();
    this.seenIds.set(id, now);
    
    // Also track content hash for content-based deduplication
    if (content) {
      const hash = this.hashContent(content);
      this.contentHashes.set(hash, now);
    }
    
    // Cleanup if needed
    if (this.seenIds.size > this.cleanupThreshold) {
      this.cleanup();
    }
  }

  /**
   * Check if message content was recently seen
   * Useful for detecting same message sent multiple times
   */
  public hasRecentContent(content: string, windowMs: number = 5000): boolean {
    if (!content) return false;
    
    const hash = this.hashContent(content);
    const lastSeen = this.contentHashes.get(hash);
    
    if (lastSeen && Date.now() - lastSeen < windowMs) {
      return true;
    }
    
    return false;
  }

  /**
   * Clear all tracking (use on logout/navigation)
   */
  public clear(): void {
    this.seenIds.clear();
    this.contentHashes.clear();
  }

  /**
   * Get current size
   */
  public getSize(): number {
    return this.seenIds.size;
  }

  /**
   * Cleanup old entries
   * Keeps only the most recent entries up to maxSize
   */
  private cleanup(): void {
    // Sort by timestamp and keep only maxSize most recent
    const sorted = Array.from(this.seenIds.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, this.maxSize);
    
    this.seenIds = new Map(sorted);
    
    // Rebuild content hashes from remaining IDs
    this.contentHashes.clear();
  }

  /**
   * Create simple hash of content
   */
  private hashContent(content: string): string {
    // Simple hash: take first + last + length
    // Not cryptographic, just for fast comparison
    return `${content.length}_${content.substring(0, 20)}_${content.substring(
      Math.max(0, content.length - 20),
    )}`;
  }

  /**
   * Get statistics
   */
  public getStats(): {
    seenIds: number;
    contentHashes: number;
    maxSize: number;
  } {
    return {
      seenIds: this.seenIds.size,
      contentHashes: this.contentHashes.size,
      maxSize: this.maxSize,
    };
  }
}

// Singleton instance
let instance: MessageDuplicationService | null = null;

export function getDuplicationService(): MessageDuplicationService {
  if (!instance) {
    instance = new MessageDuplicationService();
  }
  return instance;
}

export function resetDuplicationService(): void {
  if (instance) {
    instance.clear();
  }
}

export default {
  MessageDuplicationService,
  getDuplicationService,
  resetDuplicationService,
};
