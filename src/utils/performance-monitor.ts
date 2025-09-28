/**
 * Performance monitoring utility for tracking app performance
 */

export const performanceMonitor = {
  measurePageLoad: () => {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart);
      });
    }
  },
  
  measureComponentRender: (componentName: string) => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      console.log(`${componentName} render time:`, end - start);
    };
  }
};