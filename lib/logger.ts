/**
 * Logger utility for debugging and monitoring
 *
 * Security: CWE-532 - Prevents sensitive information in logs
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'log';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

/**
 * Keys that should be redacted from logs
 */
const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'key',
  'authorization',
  'auth',
  'credential',
  'apikey',
  'api_key',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'idtoken',
  'id_token',
  'privatekey',
  'private_key',
  'credit_card',
  'creditcard',
  'cvv',
  'ssn',
  'social_security',
];

/**
 * Patterns that should be redacted from string values
 */
const SENSITIVE_PATTERNS = [
  // JWT tokens
  /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
  // API keys (common formats)
  /sk_[a-zA-Z0-9]{20,}/g,
  /pk_[a-zA-Z0-9]{20,}/g,
  /[a-zA-Z0-9]{32,}/g, // Generic long alphanumeric strings (potential keys)
];

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Sanitize data to remove sensitive information
   */
  private sanitize(data: any, depth: number = 0): any {
    // Prevent infinite recursion
    if (depth > 10) {
      return '[MAX_DEPTH_EXCEEDED]';
    }

    if (data === null || data === undefined) {
      return data;
    }

    // Handle strings - check for sensitive patterns
    if (typeof data === 'string') {
      let sanitized = data;
      for (const pattern of SENSITIVE_PATTERNS) {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
      }
      return sanitized;
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item, depth + 1));
    }

    // Handle objects
    if (typeof data === 'object') {
      const sanitized: Record<string, any> = {};

      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();

        // Check if key contains sensitive information
        const isSensitive = SENSITIVE_KEYS.some(sensitiveKey =>
          lowerKey.includes(sensitiveKey)
        );

        if (isSensitive) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitize(value, depth + 1);
        }
      }

      return sanitized;
    }

    // Return primitives as-is
    return data;
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    let formatted = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    if (data) {
      const sanitizedData = this.sanitize(data);
      formatted += ` ${JSON.stringify(sanitizedData)}`;
    }
    return formatted;
  }

  debug(message: string, ...data: any[]): void {
    const dataToLog = data.length > 0 ? data : undefined;
    if (!this.isDevelopment) {
      return;
    }
    console.debug(this.formatMessage('debug', message, dataToLog));
    this.addLog('debug', message, dataToLog);
  }

  info(message: string, ...data: any[]): void {
    const dataToLog = data.length > 0 ? data : undefined;
    if (!this.isDevelopment) {
      return;
    }
    console.info(this.formatMessage('info', message, dataToLog));
    this.addLog('info', message, dataToLog);
  }

  log(message: string, ...data: any[]): void {
    const dataToLog = data.length > 0 ? data : undefined;
    // Always log (visible in production for debugging)
    console.log(this.formatMessage('log', message, dataToLog));
    this.addLog('log', message, dataToLog);
  }

  warn(message: string, ...data: any[]): void {
    const dataToLog = data.length > 0 ? data : undefined;
    // Always log warnings (visible in production)
    console.warn(this.formatMessage('warn', message, dataToLog));
    this.addLog('warn', message, dataToLog);
  }

  error(message: string, ...data: any[]): void {
    const dataToLog = data.length > 0 ? data : undefined;
    // Always log errors (visible in production)
    console.error(this.formatMessage('error', message, dataToLog));
    this.addLog('error', message, dataToLog);
  }

  private addLog(level: LogLevel, message: string, data?: any): void {
    // Sanitize data before storing
    const sanitizedData = data ? this.sanitize(data) : undefined;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: sanitizedData,
    };

    this.logs.push(entry);

    // Keep logs size manageable
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get only error and warning logs (safe for production monitoring)
   */
  getImportantLogs(): LogEntry[] {
    return this.logs.filter(
      log => log.level === 'error' || log.level === 'warn'
    );
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();
