/**
 * LoggerService - Centralized logging for Construsmart WM
 * Handles production error tracking and debug logs.
 */

export const LoggerService = {
  log(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[LOG] ${message}`, data || '');
    }
  },

  warn(message: string, data?: any) {
    console.warn(`[WARN] ${message}`, data || '');
    // Here you could integrate with a remote service like Sentry or LogRocket
  },

  error(message: string, error?: any) {
    console.error(`[ERROR] ${message}`, error || '');
    
    // Remote tracking simulation
    if (process.env.NODE_ENV === 'production') {
      // fetch('/api/log-error', { method: 'POST', body: JSON.stringify({ message, error: error?.toString() }) });
    }
  },

  info(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[INFO] ${message}`, data || '');
    }
  }
};

export default LoggerService;
