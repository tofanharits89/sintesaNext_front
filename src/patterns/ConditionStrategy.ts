/**
 * Strategy pattern for handling conditional logic
 * Used throughout the codebase to replace complex if/else chains
 */

export interface ConditionStrategy<T = any, R = any> {
  canHandle(config: T): boolean;
  build(config: T, value?: any): R;
}

/**
 * Registry for managing condition strategies
 * Replaces large switch statements and if/else chains
 */
export class StrategyRegistry<T = any, R = any> {
  private strategies = new Map<string, ConditionStrategy<T, R>>();

  /**
   * Register a new strategy
   */
  register(type: string, strategy: ConditionStrategy<T, R>) {
    this.strategies.set(type, strategy);
  }

  /**
   * Build using the appropriate strategy
   */
  build(type: string, config: T, value?: any): R | null {
    const strategy = this.strategies.get(type);
    return strategy?.canHandle(config) ? strategy.build(config, value) : null;
  }

  /**
   * Get all registered types
   */
  getTypes(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Check if a type is registered
   */
  hasType(type: string): boolean {
    return this.strategies.has(type);
  }

  /**
   * Clear all strategies
   */
  clear() {
    this.strategies.clear();
  }
}

/**
 * Helper to create a strategy with simple canHandle check
 */
export function createStrategy<T, R>(
  typeMatcher: (config: T) => boolean,
  builder: (config: T, value?: any) => R
): ConditionStrategy<T, R> {
  return {
    canHandle: typeMatcher,
    build: builder,
  };
}

/**
 * Helper for exact type matching
 */
export function createExactMatchStrategy<T extends { type: string }, R>(
  type: string,
  builder: (config: T, value?: any) => R
): ConditionStrategy<T, R> {
  return createStrategy(
    (config: T) => config.type === type,
    builder
  );
}

/**
 * Example usage:
 *
 * const registry = new StrategyRegistry<FilterConfig, string>();
 *
 * registry.register('kementerian', createStrategy(
 *   (config) => config.filterKey === 'kementerian',
 *   (config, value) => `kementerian = '${value}'`
 * ));
 *
 * registry.register('eselonI', createStrategy(
 *   (config) => config.filterKey === 'eselonI',
 *   (config, value) => `eselonI = '${value}'`
 * ));
 *
 * const whereClause = registry.build('kementerian', filterConfig, filterValue);
 */
