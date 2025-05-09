import { captureException } from '@sentry/nextjs';

export function setupMonitoring() {
  // Globale Error-Handler
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      captureException(event.error);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      captureException(event.reason);
    });
  }
}

export async function trackApiUsage(endpoint: string, duration: number, success: boolean) {
  // Metriken an Monitoring-Service senden
  try {
    await fetch('/api/internal/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint,
        duration,
        success,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Failed to track API usage:', error);
  }
}

// Middleware für API-Endpunkte
export function withMetrics(handler) {
  return async (req, res) => {
    const start = Date.now();
    let success = false;
    
    try {
      await handler(req, res);
      success = res.statusCode >= 200 && res.statusCode < 400;
    } catch (error) {
      captureException(error);
      throw error;
    } finally {
      const duration = Date.now() - start;
      trackApiUsage(req.url, duration, success);
    }
  };
} 