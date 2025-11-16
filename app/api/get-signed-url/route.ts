/**
 * API Route to generate signed URLs for ElevenLabs agent authentication
 * 
 * This is a secure server-side endpoint that:
 * 1. Uses the ElevenLabs API key (never exposed to client)
 * 2. Generates short-lived signed URLs for client-side agent connection
 * 3. Validates the request and returns the signed URL
 * 
 * Reference: https://elevenlabs.io/docs/agents-platform/overview#signed-urls
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Verify API key is configured
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    // Verify agent ID is configured
    const agentId = process.env.ELEVENLABS_AGENT_ID;
    if (!agentId) {
      return NextResponse.json(
        { error: 'ElevenLabs agent ID not configured' },
        { status: 500 }
      );
    }

    // Verify origin is allowed (for security)
    const origin = request.headers.get('origin');
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
    
    if (origin && !allowedOrigins.includes(origin)) {
      console.warn(`Unauthorized origin: ${origin}`);
      return NextResponse.json(
        { error: 'Origin not allowed' },
        { status: 403 }
      );
    }

    // Generate signed URL using ElevenLabs API
    // For now, this is a placeholder - the actual implementation depends on the ElevenLabs
    // REST API endpoint for generating signed URLs
    // 
    // Reference: https://elevenlabs.io/docs/agents-platform/authentication
    
    // In a real implementation, this would call the ElevenLabs API:
    // POST https://api.elevenlabs.io/v1/agents/{agentId}/signed-url
    
    const response = await fetch(`https://api.elevenlabs.io/v1/agents/${agentId}/signed-url`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expiresIn: 3600, // URL expires in 1 hour
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const signedUrl = (data as any).signedUrl;

    if (!signedUrl) {
      throw new Error('No signed URL in API response');
    }

    return NextResponse.json(
      { signedUrl },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store', // Don't cache signed URLs
        }
      }
    );
  } catch (error) {
    console.error('Error generating signed URL:', error);
    
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to generate signed URL: ${message}` },
      { status: 500 }
    );
  }
}

// OPTIONS for CORS
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

