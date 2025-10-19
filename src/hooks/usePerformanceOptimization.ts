/**
 * Simple performance hook - no heavy optimizations for better performance
 */

export function usePerformanceOptimization(options?: any) {
  // Simple no-op hook for better performance
  const reportMetrics = () => {
    const perf: any = typeof performance !== 'undefined' ? (performance as any) : {}
    return {
      timestamp: Date.now(),
      memory: perf && perf.memory ? {
        used: Math.round(perf.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(perf.memory.totalJSHeapSize / 1024 / 1024)
      } : null,
      timing: perf && perf.timing ? {
        loadTime: perf.timing.loadEventEnd - perf.timing.navigationStart,
        domReady: perf.timing.domContentLoadedEventEnd - perf.timing.navigationStart
      } : null
    }
  }

  return {
    isOptimized: true,
    optimizationLevel: 'basic',
    reportMetrics
  }
}
