import { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory performance metrics tracker.
 * Tracks request counts, response times, and error rates.
 */
class PerformanceMetrics {
  private totalRequests = 0;
  private totalErrors = 0;
  private responseTimes: number[] = [];
  private readonly maxSamples = 1000; // Keep last 1000 response times
  private startTime = Date.now();

  recordRequest(durationMs: number, statusCode: number) {
    this.totalRequests++;
    if (statusCode >= 400) {
      this.totalErrors++;
    }
    this.responseTimes.push(durationMs);
    if (this.responseTimes.length > this.maxSamples) {
      this.responseTimes.shift();
    }
  }

  getMetrics() {
    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const len = sorted.length;

    return {
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      totalRequests: this.totalRequests,
      totalErrors: this.totalErrors,
      errorRate: this.totalRequests > 0
        ? ((this.totalErrors / this.totalRequests) * 100).toFixed(2) + '%'
        : '0%',
      responseTimes: len > 0
        ? {
            avg: Math.round(sorted.reduce((a, b) => a + b, 0) / len),
            p50: sorted[Math.floor(len * 0.5)],
            p95: sorted[Math.floor(len * 0.95)],
            p99: sorted[Math.floor(len * 0.99)],
            min: sorted[0],
            max: sorted[len - 1],
          }
        : null,
      memory: {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      },
    };
  }
}

export const metrics = new PerformanceMetrics();

/**
 * Express middleware that tracks response time and status codes.
 */
export function performanceMonitorMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.recordRequest(duration, res.statusCode);

    // Log slow requests (> 1000ms)
    if (duration > 1000) {
      console.warn(`[SLOW REQUEST] ${req.method} ${req.originalUrl} - ${duration}ms (status: ${res.statusCode})`);
    }
  });

  next();
}
