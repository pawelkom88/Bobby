/**
 * Logger utility for debugging and monitoring
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    let formatted = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    if (data) {
      formatted += ` ${JSON.stringify(data)}`;
    }
    return formatted;
  }

  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.debug(this.formatMessage('debug', message, data));
    }
    this.addLog('debug', message, data);
  }

  info(message: string, data?: any): void {
    console.info(this.formatMessage('info', message, data));
    this.addLog('info', message, data);
  }

  warn(message: string, data?: any): void {
    console.warn(this.formatMessage('warn', message, data));
    this.addLog('warn', message, data);
  }

  error(message: string, data?: any): void {
    console.error(this.formatMessage('error', message, data));
    this.addLog('error', message, data);
  }

  private addLog(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
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

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();

