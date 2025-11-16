/**
 * API Route to generate signed URLs for ElevenLabs agent authentication
 * 
 * Server-side endpoint that:
 * 1. Uses the ElevenLabs SDK with API key (never exposed to client)
 * 2. Generates short-lived signed URLs for client-side agent connection
 * 3. Validates the request and returns the signed URL
 * 
 * Reference: https://elevenlabs.io/docs/agents-platform/customization/authentication#using-signed-urls
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Verify API key is configured
    const apiKey = process.env.ELEVEN_LABS_API_KEY;
    if (!apiKey) {
      console.error('ELEVEN_LABS_API_KEY not configured');
      return NextResponse.json(
        { error: 'ElevenLabs API key not configured' },
        { status: 500 }
      );
    }

    // Verify agent ID is configured
    const agentId = process.env.ELEVEN_LABS_AGENT_ID;
    if (!agentId) {
      console.error('ELEVEN_LABS_AGENT_ID not configured');
      return NextResponse.json(
        { error: 'ElevenLabs agent ID not configured' },
        { status: 500 }
      );
    }

    // Verify origin is allowed (for security)
    const origin = request.headers.get('origin');
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
    
    if (origin && !allowedOrigins.some(allowed => origin.includes(allowed.trim()))) {
      console.warn(`Unauthorized origin: ${origin}`);
      return NextResponse.json(
        { error: 'Origin not allowed' },
        { status: 403 }
      );
    }

    console.log('Generating signed URL for agent:', agentId);

    // Generate signed URL using ElevenLabs REST API
    // Reference: https://elevenlabs.io/docs/agents-platform/customization/authentication#generate-a-signed-url-via-the-api
    const signedUrlEndpoint = `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`;
    
    const response = await fetch(signedUrlEndpoint, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const signedUrl = (data as any).signed_url;

    if (!signedUrl) {
      throw new Error('No signed URL in response');
    }

    console.log('Signed URL generated successfully');

    return NextResponse.json(
      { signed_url: signedUrl },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store', // Don't cache signed URLs
        }
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    console.error('Error generating signed URL:', {
      message,
      stack,
      error,
    });
    
    return NextResponse.json(
      { 
        error: `Failed to generate signed URL: ${message}`,
        details: stack 
      },
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

