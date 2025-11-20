/**
 * LemonFox TTS API Route
 * Server-side proxy for LemonFox Text-to-Speech API
 * 
 * - Stores LEMONFOX_API_KEY securely
 * - Accepts configurable voice, speed, and format parameters
 * - Uses sensible defaults from config
 * - Implements rate limiting per IP
 * - Supports EU-based processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { CONFIG } from '@/lib/config';

// In-memory rate limiting: { ip: { count, resetTime } }
const rateLimitMap = new Map<
  string,
  { count: number; resetTime: number }
>();

/**
 * Get client IP from request
 */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown'
  );
}

/**
 * Check rate limit for IP
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  if (!limit || now > limit.resetTime) {
    // New window or expired
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + 60 * 1000, // 1 minute window
    });
    return true;
  }

  if (limit.count < CONFIG.RATE_LIMIT_REQUESTS_PER_MINUTE) {
    limit.count++;
    return true;
  }

  return false;
}

interface TTSRequest {
  text: string;
  voice?: string;
  language?: string;
  response_format?: string;
  speed?: number;
  useEU?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const clientIp = getClientIp(request);
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { 
          status: 429,
          headers: { 'Retry-After': '60' }
        }
      );
    }

    // Verify API key
    const apiKey = process.env.LEMONFOX_API_KEY;
    if (!apiKey) {
      console.error('LEMONFOX_API_KEY not configured');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Parse request
    const body = (await request.json()) as TTSRequest;
    const { text, useEU = false } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Use provided parameters or defaults from config
    const voice = body.voice || CONFIG.LEMONFOX_DEFAULT_VOICE;
    const language = body.language || CONFIG.LEMONFOX_LANGUAGE;
    const response_format = body.response_format || CONFIG.LEMONFOX_RESPONSE_FORMAT;
    const speed = body.speed || CONFIG.LEMONFOX_SPEED;

    // Validate speed is within range
    if (speed < 0.5 || speed > 4.0) {
      return NextResponse.json(
        { error: 'Speed must be between 0.5 and 4.0' },
        { status: 400 }
      );
    }

    // Choose API endpoint (EU or standard)
    const apiEndpoint = useEU
      ? 'https://eu-api.lemonfox.ai/v1/audio/speech'
      : 'https://api.lemonfox.ai/v1/audio/speech';

    console.log('Calling LemonFox TTS API', {
      text: text.substring(0, 50) + '...',
      voice,
      language,
      response_format,
      speed,
      endpoint: apiEndpoint,
    });

    // Call LemonFox API
    const ttsResponse = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        voice,
        language,
        response_format,
        speed,
      }),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('LemonFox API error:', {
        status: ttsResponse.status,
        statusText: ttsResponse.statusText,
        error: errorText,
      });

      return NextResponse.json(
        {
          error: 'Failed to generate audio',
          details: `LemonFox API returned ${ttsResponse.status}`,
        },
        { status: ttsResponse.status }
      );
    }

    // Get audio content type from LemonFox response
    const contentType = ttsResponse.headers.get('content-type') || 'audio/mpeg';
    const audioBuffer = await ttsResponse.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        'Accept-Ranges': 'bytes',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    console.error('LemonFox TTS API error:', { message, stack, error });

    return NextResponse.json(
      {
        error: 'Failed to process TTS request',
        details: message,
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

