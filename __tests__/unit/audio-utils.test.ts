/**
 * Audio Utils Tests
 * Tests for pure audio processing functions
 */

import { describe, it, expect, vi } from 'vitest';
import { downsample, convertFloat32ToInt16 } from '@/utils/audioUtils';

// Mock logger to avoid console output during tests
vi.mock('@/lib/logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('Audio Utils', () => {
  describe('downsample', () => {
    it('should return same buffer when sample rates are equal', () => {
      const buffer = new Float32Array([0.1, 0.2, 0.3, 0.4]);
      const result = downsample(buffer, 48000, 48000);
      expect(result).toBe(buffer);
    });

    it('should downsample from 48000 to 16000 (3:1 ratio)', () => {
      // Create a buffer with 9 samples at 48000Hz
      const buffer = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]);
      const result = downsample(buffer, 48000, 16000);
      
      // Should produce 3 samples (9 / 3 = 3)
      expect(result.length).toBe(3);
    });

    it('should downsample from 48000 to 24000 (2:1 ratio)', () => {
      const buffer = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5, 0.6]);
      const result = downsample(buffer, 48000, 24000);
      
      // Should produce 3 samples (6 / 2 = 3)
      expect(result.length).toBe(3);
    });

    it('should handle empty buffer', () => {
      const buffer = new Float32Array([]);
      const result = downsample(buffer, 48000, 16000);
      expect(result.length).toBe(0);
    });

    it('should handle single sample buffer', () => {
      const buffer = new Float32Array([0.5]);
      const result = downsample(buffer, 48000, 16000);
      // With 3:1 ratio, 1 sample rounds to 0 or 1
      expect(result.length).toBeLessThanOrEqual(1);
    });

    it('should average samples when downsampling', () => {
      // Create buffer where averaging is predictable
      const buffer = new Float32Array([0.0, 0.0, 0.0, 1.0, 1.0, 1.0]);
      const result = downsample(buffer, 48000, 24000);
      
      // First 3 samples average to 0, next 3 average to 1
      expect(result.length).toBe(3);
      expect(result[0]).toBeCloseTo(0.0, 5);
      expect(result[2]).toBeCloseTo(1.0, 5);
    });

    it('should return Float32Array', () => {
      const buffer = new Float32Array([0.1, 0.2, 0.3]);
      const result = downsample(buffer, 48000, 16000);
      expect(result).toBeInstanceOf(Float32Array);
    });
  });

  describe('convertFloat32ToInt16', () => {
    it('should convert 0.0 to 0', () => {
      const buffer = new Float32Array([0.0]);
      const result = convertFloat32ToInt16(buffer);
      expect(result[0]).toBe(0);
    });

    it('should convert 1.0 to max positive int16 (32767)', () => {
      const buffer = new Float32Array([1.0]);
      const result = convertFloat32ToInt16(buffer);
      expect(result[0]).toBe(32767);
    });

    it('should convert -1.0 to negative int16', () => {
      const buffer = new Float32Array([-1.0]);
      const result = convertFloat32ToInt16(buffer);
      // -1.0 * 32767 = -32767
      expect(result[0]).toBe(-32767);
    });

    it('should clamp values above 1.0 to max', () => {
      const buffer = new Float32Array([2.0]);
      const result = convertFloat32ToInt16(buffer);
      // Math.min(1, 2.0) * 32767 = 32767
      expect(result[0]).toBe(32767);
    });

    it('should handle multiple samples', () => {
      const buffer = new Float32Array([0.0, 0.5, 1.0, -0.5]);
      const result = convertFloat32ToInt16(buffer);

      expect(result.length).toBe(4);
      expect(result[0]).toBe(0);
      // Implementation uses Math.min(1, val) * 0x7fff which truncates to int16
      expect(result[1]).toBe(Math.trunc(0.5 * 0x7fff));
      expect(result[2]).toBe(32767);
      expect(result[3]).toBe(Math.trunc(-0.5 * 0x7fff));
    });

    it('should return Int16Array', () => {
      const buffer = new Float32Array([0.1, 0.2]);
      const result = convertFloat32ToInt16(buffer);
      expect(result).toBeInstanceOf(Int16Array);
    });

    it('should handle empty buffer', () => {
      const buffer = new Float32Array([]);
      const result = convertFloat32ToInt16(buffer);
      expect(result.length).toBe(0);
    });

    it('should preserve buffer length', () => {
      const buffer = new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5]);
      const result = convertFloat32ToInt16(buffer);
      expect(result.length).toBe(buffer.length);
    });

    it('should handle typical audio values', () => {
      // Typical audio values are between -1 and 1
      const buffer = new Float32Array([0.25, -0.25, 0.75, -0.75]);
      const result = convertFloat32ToInt16(buffer);

      // Implementation uses Math.min(1, val) * 0x7fff which truncates to int16
      expect(result[0]).toBe(Math.trunc(0.25 * 0x7fff));
      expect(result[1]).toBe(Math.trunc(-0.25 * 0x7fff));
      expect(result[2]).toBe(Math.trunc(0.75 * 0x7fff));
      expect(result[3]).toBe(Math.trunc(-0.75 * 0x7fff));
    });
  });
});

