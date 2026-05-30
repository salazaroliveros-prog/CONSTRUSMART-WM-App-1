type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export const LoggerService = {
  log(message: string, data?: unknown) {
    if (data !== undefined) {
      console.log(`[LOG] ${message}`, data);
    } else {
      console.log(`[LOG] ${message}`);
    }
  },
  
  warn(message: string, data?: unknown) {
    if (data !== undefined) {
      console.warn(`[WARN] ${message}`, data);
    } else {
      console.warn(`[WARN] ${message}`);
    }
  },
  
  error(message: string, error?: unknown) {
    if (error !== undefined) {
      console.error(`[ERROR] ${message}`, error);
    } else {
      console.error(`[ERROR] ${message}`);
    }
  },
  
  info(message: string, data?: unknown) {
    if (data !== undefined) {
      console.info(`[INFO] ${message}`, data);
    } else {
      console.info(`[INFO] ${message}`);
    }
  },

  group(label: string) {
    console.group(label);
  },

  groupEnd() {
    console.groupEnd();
  },
};