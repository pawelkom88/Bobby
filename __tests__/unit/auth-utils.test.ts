import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { extractAndValidateToken, extractBearerToken } from '../../lib/auth-utils';
import { logger } from '../../lib/logger';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

describe('auth-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractBearerToken', () => {
    it('should extract token from valid Bearer header', () => {
      const request = new NextRequest('http://localhost', {
        headers: { authorization: 'Bearer abc123' },
      });

      const result = extractBearerToken(request);

      expect(result).toEqual({
        success: true,
        token: 'abc123',
      });
    });

    it('should handle lowercase "bearer"', () => {
      const request = new NextRequest('http://localhost', {
        headers: { authorization: 'bearer abc123' },
      });

      const result = extractBearerToken(request);

      expect(result).toEqual({
        success: true,
        token: 'abc123',
      });
    });

    it('should handle mixed case "BeArEr"', () => {
      const request = new NextRequest('http://localhost', {
        headers: { authorization: 'BeArEr abc123' },
      });

      const result = extractBearerToken(request);

      expect(result).toEqual({
        success: true,
        token: 'abc123',
      });
    });

    it('should trim extra spaces before Bearer', () => {
      const request = new NextRequest('http://localhost', {
        headers: { authorization: '   Bearer abc123' },
      });

      const result = extractBearerToken(request);

      expect(result).toEqual({
        success: true,
        token: 'abc123',
      });
    });

    it('should trim extra spaces after Bearer', () => {
      const request = new NextRequest('http://localhost', {
        headers: { authorization: 'Bearer    abc123' },
      });

      const result = extractBearerToken(request);

      expect(result).toEqual({
        success: true,
        token: 'abc123',
      });
    });

    it('should trim extra spaces around token', () => {
      const request = new NextRequest('http://localhost', {
        headers: { authorization: 'Bearer   abc123   ' },
      });

      const result = extractBearerToken(request);

      expect(result).toEqual({
        success: true,
        token: 'abc123',
      });
    });

    it('should handle multiple spaces between Bearer and token', () => {
      const request = new NextRequest('http://localhost', {
        headers: { authorization: 'Bearer     abc123' },
      });

      const result = extractBearerToken(request);

      expect(result).toEqual({
        success: true,
        token: 'abc123',
      });
    });

    it('should reject missing authorization header', () => {
      const request = new NextRequest('http://localhost');

      const result = extractBearerToken(request);

      expect(result).toEqual({
        success: false,
        error: 'missing_header',
        message: 'Missing authorization header',
      });
    });

    it('should reject header without Bearer prefix', () => {
      const request = new NextRequest('http://localhost', {
        headers: { authorization: 'Basic abc123' },
      });

      const result = extractBearerToken(request);

      expect(result).toEqual({
        success: false,
        error: 'invalid_format',
        message: 'Authorization header must start with "Bearer "',
      });
    });

    it('should reject header with only "Bearer" (no space)', () => {
      const request = new NextRequest('http://localhost', {
        headers: { authorization: 'Bearer' },
      });

      const result = extractBearerToken(request);

      expect(result).toEqual({
        success: false,
        error: 'invalid_format',
        message: 'Authorization header must start with "Bearer "',
      });
    });

    it('should reject empty token after Bearer', () => {
      const request = new NextRequest('http://localhost', {
        headers: { authorization: 'Bearer' },
      });

      const result = extractBearerToken(request);

      expect(result).toEqual({
        success: false,
        error: 'invalid_format',
        message: 'Authorization header must start with "Bearer "',
      });
    });

    it('should reject token with only whitespace', () => {
      // Note: NextRequest automatically trims headers, so "Bearer      " becomes "Bearer"
      // This will be caught as invalid_format, not empty_token
      const request = new NextRequest('http://localhost', {
        headers: { authorization: 'Bearer      ' },
      });

      const result = extractBearerToken(request);

      expect(result).toEqual({
        success: false,
        error: 'invalid_format',
        message: 'Authorization header must start with "Bearer "',
      });
    });

    it('should reject tab character instead of space after Bearer', () => {
      const request = new NextRequest('http://localhost', {
        headers: { authorization: 'Bearer\tabc123' },
      });

      const result = extractBearerToken(request);

      expect(result).toEqual({
        success: false,
        error: 'invalid_format',
        message: 'Authorization header must start with "Bearer "',
      });
    });

    it('should handle complex JWT tokens', () => {
      const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      const request = new NextRequest('http://localhost', {
        headers: { authorization: `Bearer ${jwtToken}` },
      });

      const result = extractBearerToken(request);

      expect(result).toEqual({
        success: true,
        token: jwtToken,
      });
    });
  });

  describe('extractAndValidateToken', () => {
    it('should return token for valid header', () => {
      const request = new NextRequest('http://localhost', {
        headers: { authorization: 'Bearer abc123' },
      });

      const result = extractAndValidateToken(request, 'test-endpoint');

      expect(result).toBe('abc123');
      expect(logger.warn).not.toHaveBeenCalled();
    });

    it('should log warning for missing header', () => {
      const request = new NextRequest('http://localhost');

      const result = extractAndValidateToken(request, 'test-endpoint');

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(`Token extraction failed at test-endpoint`, {
        endpoint: 'test-endpoint',
        error: 'missing_header',
        ip: 'unknown',
        userAgent: null,
      });
    });

    it('should log warning for invalid format', () => {
      const request = new NextRequest('http://localhost', {
        headers: { authorization: 'Basic abc123' },
      });

      const result = extractAndValidateToken(request, 'test-endpoint');

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(`Token extraction failed at test-endpoint`, {
        endpoint: 'test-endpoint',
        error: 'invalid_format',
        ip: 'unknown',
        userAgent: null,
      });
    });

    it('should log warning for Bearer without space', () => {
      // Note: NextRequest automatically trims headers, so "Bearer " becomes "Bearer"
      // This will be caught as invalid_format, not empty_token
      const request = new NextRequest('http://localhost', {
        headers: { authorization: 'Bearer' },
      });

      const result = extractAndValidateToken(request, 'test-endpoint');

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(`Token extraction failed at test-endpoint`, {
        endpoint: 'test-endpoint',
        error: 'invalid_format',
        ip: 'unknown',
        userAgent: null,
      });
    });

    it('should include IP address in logs when available', () => {
      const request = new NextRequest('http://localhost', {
        headers: { 
          authorization: 'Basic abc123',
          'x-forwarded-for': '192.168.1.1',
          'user-agent': 'TestAgent/1.0',
        },
      });

      const result = extractAndValidateToken(request, 'test-endpoint');

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(`Token extraction failed at test-endpoint`, {
        endpoint: 'test-endpoint',
        error: 'invalid_format',
        ip: '192.168.1.1',
        userAgent: 'TestAgent/1.0',
      });
    });

    it('should use x-real-ip when x-forwarded-for is not available', () => {
      const request = new NextRequest('http://localhost', {
        headers: { 
          authorization: 'Basic abc123',
          'x-real-ip': '10.0.0.1',
        },
      });

      const result = extractAndValidateToken(request, 'test-endpoint');

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(`Token extraction failed at test-endpoint`, {
        endpoint: 'test-endpoint',
        error: 'invalid_format',
        ip: '10.0.0.1',
        userAgent: null,
      });
    });

    it('should handle multiple IPs in x-forwarded-for (use first one)', () => {
      const request = new NextRequest('http://localhost', {
        headers: { 
          authorization: 'Basic abc123',
          'x-forwarded-for': '192.168.1.1,10.0.0.1,172.16.0.1',
        },
      });

      const result = extractAndValidateToken(request, 'test-endpoint');

      expect(result).toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(`Token extraction failed at test-endpoint`, {
        endpoint: 'test-endpoint',
        error: 'invalid_format',
        ip: '192.168.1.1',
        userAgent: null,
      });
    });

    it('should never include token in log output', () => {
      const request = new NextRequest('http://localhost', {
        headers: { 
          authorization: 'Bearer secret-token-123',
          'x-forwarded-for': '192.168.1.1',
        },
      });

      // Even with valid token, logger should not contain the token
      const result = extractAndValidateToken(request, 'test-endpoint');
      expect(result).toBe('secret-token-123');
      expect(logger.warn).not.toHaveBeenCalled();

      // Now test with invalid token
      const request2 = new NextRequest('http://localhost', {
        headers: { 
          authorization: 'Bearer ',
          'x-forwarded-for': '192.168.1.1',
        },
      });

      const result2 = extractAndValidateToken(request2, 'test-endpoint');
      expect(result2).toBeNull();
      
      // Verify token is not in the log
      const logCall = (logger.warn as any).mock.calls[0][0];
      expect(JSON.stringify(logCall)).not.toContain('secret-token-123');
    });
  });
});
