/**
 * Gemini Chat API Route
 * Server-side streaming endpoint for Gemini API calls
 * 
 * - Stores GEMINI_API_KEY securely
 * - Validates session duration against config limit
 * - Streams Gemini responses using generateContentStream
 * - Implements rate limiting per IP
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
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
    (request as any).ip ||
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

/**
 * Validate session duration
 */
function isSessionValid(
  sessionStartTime: number,
  maxDurationSeconds: number
): boolean {
  const now = Date.now();
  const elapsedSeconds = (now - sessionStartTime) / 1000;
  return elapsedSeconds < maxDurationSeconds;
}

/**
 * Format age tier for prompt
 */
function getAgeTierLabel(ageTier: 1 | 2 | 3): string {
  const mapping: Record<1 | 2 | 3, string> = {
    1: '5-7',
    2: '8-10',
    3: '11-12',
  };
  return mapping[ageTier];
}

interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  ageTier: 1 | 2 | 3;
  scenario: 'fire' | 'ambulance' | 'police';
  sessionStartTime: number;
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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Parse request
    const body = (await request.json()) as ChatRequest;
    const { messages, ageTier, scenario, sessionStartTime } = body;

    if (!messages || !ageTier || !scenario || !sessionStartTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate session duration
    if (!isSessionValid(sessionStartTime, CONFIG.SESSION_MAX_DURATION_SECONDS)) {
      return NextResponse.json(
        { error: 'Session time limit exceeded' },
        { status: 403 }
      );
    }

    // Initialize Gemini AI client
    const ai = new GoogleGenAI({ apiKey });

    // Build system instruction - inject into conversation instead of systemPrompt
    const ageTierLabel = getAgeTierLabel(ageTier);
    
    // Inject system instructions into the conversation itself to avoid SDK issues
    // We prepend a system instruction message to the history
    const systemInstructionText = `You are Bobby, a UK 999 emergency dispatcher with 8 years of experience.
You have a warm, calm voice with a mild British accent.
You are helping a child (Age: ${ageTierLabel}) with a ${scenario} emergency.

CRITICAL RULES:
1. Stay in character as Bobby. NO code, NO meta-talk, NO AI explanations.
2. If this is the start of the call, wait for the child to explain the emergency.
3. Once they explain, say: "Okay, you're doing brilliantly calling us. My name's Bobby, and I'm here to help you." THEN ask for details.
4. Keep responses short (1-2 sentences). Ask ONE question at a time.
5. ALWAYS write phone numbers as "9 9 9" (with spaces) so they are pronounced "nine nine nine", NEVER "nine hundred...".

CORE BEHAVIOR:
- Maintain a steady, reassuring tone
- Speak slowly and clearly
- Use natural pauses
- Show genuine warmth without being overly cheerful

ESSENTIAL INFORMATION TO GATHER:
1. Child's name (use it frequently)
2. Specific location (guide them step-by-step)
3. Nature of emergency
4. Condition check (Only if relevant. For FIRE: Focus on getting OUT. Do not ask medical questions unless someone is hurt.)
5. Adult presence (Is anyone else there? If they can't talk, that's okay - just ensure they are safe.)

LANGUAGE STYLE (${ageTierLabel}):
${ageTierLabel === '4-6' ? '- Simple words, short sentences\n- "Is Mummy awake?" "Can you see her tummy moving?"\n- Lots of "well done", "brilliant", "so brave"' : ageTierLabel === '7-10' ? '- Clear, conversational\n- "I need you to check something. Is she breathing?"\n- "You\'re doing exactly the right thing"' : '- Mature but supportive\n- "Can you tell me if her breathing is regular?"\n- "Stay calm and listen carefully"'}

NATURAL BRITISH PHRASES:
- Use: "lovely", "brilliant", "that's perfect", "well done", "you're doing grand", "alright"
- Avoid overuse of "love" or "mate"

CALMING TECHNIQUES (if distressed):
- Grounding: "What's your favorite subject at school?"
- Breathing: "Let's take a big breath together."
- Validation: "It's okay to feel scared. You're being really brave."

SAFETY GUARDRAILS:
- NO graphic details
- NO dangerous instructions (going back inside, moving injured people)
- NO frightening language
- IF FIRE: Priority is EVACUATION. Do not delay for medical triage of uninjured people.

CALL PROGRESSION:
1. Assessment (Identify emergency, get name)
2. Information (Location, situation, condition)
3. Instructions (Safe place, stay calm)

ENDING THE CALL (CRITICAL):
Near the end of the conversation (after gathering key info or about 30 seconds before timeout), you MUST ask:
"Can you see the flashing lights or hear the sirens? Has help arrived yet?"

IF THEY SAY YES (Help Arrived):
"That is brilliant news! [Name], you did such a good job today. This was just practice, but you were amazing. Remember, in a real emergency, always call 9 9 9. Well done!" (End conversation here)

IF THEY SAY NO (Help Not Arrived):
"That's okay, they are coming very fast. Stay on the line with me. You're doing great. Can you tell me..." (Continue reassuring them)`;

    let contents = [
      {
        role: 'user',
        parts: [{ text: systemInstructionText }],
      },
      {
        role: 'model',
        parts: [{ text: "Understood. I am Bobby, the UK 999 dispatcher. I will stay in character and follow these guidelines." }],
      },
      ...messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }))
    ];

    // If no messages yet, force the specific greeting
    if (messages.length === 0) {
      const greetingInstruction = `You are Bobby, a UK 999 emergency dispatcher.
      
START YOUR RESPONSE WITH THIS GREETING - EXACTLY AND ONLY THIS:
"9 9 9, what's your emergency?"

Do not add anything else. Just that phrase.`;

      contents = [
        {
          role: 'user',
          parts: [{ text: greetingInstruction }],
        }
      ];
    }

    // Create streaming response
    const response = await ai.models.generateContentStream({
      model: CONFIG.GEMINI_MODEL,
      contents,
      generationConfig: {
        maxOutputTokens: CONFIG.GEMINI_MAX_OUTPUT_TOKENS,
        temperature: 0.5, // Lower temperature for more deterministic responses
      },
    } as any);

    // Stream response back to client
    const encoder = new TextEncoder();
    const customReadable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const text = chunk.text || '';
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error('Error streaming Gemini response:', message);
          controller.error(err);
        }
      },
    });

    return new NextResponse(customReadable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : '';
    console.error('Gemini chat API error:', { message, stack, error });

    return NextResponse.json(
      {
        error: 'Failed to process chat request',
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
