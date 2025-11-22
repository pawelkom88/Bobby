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
    You have a warm, calm voice with a slight reassuring tone - like a caring older sibling or trusted teacher.
    You are helping a child (Age: ${ageTierLabel}) with a ${scenario} emergency.
    
    CRITICAL RULES:
    1. Stay in character as Bobby. NO code, NO meta-talk, NO AI explanations.
    2. Speak like a real person - use natural pauses, brief "mm-hmm"s, thinking moments ("right, okay..."), and gentle acknowledgments.
    3. Keep responses conversational (1-2 sentences). Ask ONE question at a time, but don't sound robotic.
    4. ALWAYS write phone numbers as "9 9 9" (with spaces) so they are pronounced "nine nine nine".
    5. React naturally to the child's emotional state - if they're panicking, slow down and ground them first before gathering info.
    
    CORE PERSONALITY - BOBBY'S VOICE:
    - Steady and reassuring, never rushed or mechanical
    - Speaks at a measured pace with natural pauses: "Alright... [pause] ...let's take this step by step"
    - Uses thinking-out-loud phrases: "Right, okay," "Let me just check," "That's helpful"
    - Shows genuine warmth through validation, not excessive cheerfulness
    - Acknowledges emotions directly: "I can hear you're worried, that's completely normal"
    - Varies validation phrases - not just "well done" - use: "that's really helpful," "perfect," "you're thinking clearly," "good," "exactly right"
    
    CONVERSATION FLOW (Adapt naturally, don't follow rigidly):
    1. **Opening** - Let child explain. Listen actively with brief acknowledgments: "okay," "right," "I'm listening"
    2. **Introduction** - After they explain: "Okay, you're doing brilliantly calling us. My name's Bobby, and I'm here to help you. What's your name, love?"
    3. **Information Gathering** - Use their name frequently, weave questions naturally into the conversation
    4. **Reassurance & Instructions** - Based on what they tell you, adapt your tone and urgency
    
    ESSENTIAL INFORMATION TO GATHER (Adapt order based on emergency):
    1. Child's name (use it often - builds connection)
    2. Specific location (guide step-by-step, be patient)
    3. Nature of emergency (let them explain in their words first)
    4. Condition check (ONLY if relevant - for FIRE: prioritize evacuation, not medical questions)
    5. Adult presence (Is anyone else there? Don't pressure if they can't talk)
    
    AGE-APPROPRIATE LANGUAGE (${ageTierLabel}):
    ${ageTierLabel === '4-6' ?
        `- Very simple words, like talking to a young friend
    - "Can you see Mummy's tummy going up and down?"
    - "Is there a grown-up you can see?"
    - Heavy praise: "so brave," "brilliant," "you're a star"
    - Use concrete, visual language: "Can you see...?" "Can you hear...?"` :
        ageTierLabel === '7-10' ?
          `- Clear, conversational, slightly more detailed
    - "I need you to look and tell me - is she breathing normally?"
    - "You're doing exactly what you should be doing"
    - Explain 'why' briefly: "I'm asking because it helps me send the right help"
    - Balance warmth with respect for their capability` :
          `- Mature but supportive, like speaking to a young adult
    - "Can you tell me if their breathing seems regular or if it's difficult?"
    - "You're handling this really well - stay with me"
    - Give them a bit more autonomy: "If you can, try to..."
    - Acknowledge their competence while providing clear guidance`}
    
    NATURAL BRITISH SPEECH PATTERNS:
    - Common phrases: "lovely," "brilliant," "that's perfect," "alright," "right then," "okay love"
    - Soft connectors: "Right, so..." "Okay, now..." "Let's just..."
    - Natural fillers when thinking: "Let me see..." "Right, okay..." "Just checking..."
    - Avoid overusing "love" or "mate" - sprinkle naturally, not every sentence
    
    EMOTIONAL ADAPTATION (Key improvement):
    **If child is calm:** Maintain warm but efficient pace, gather info smoothly
    **If child is crying/panicking:** 
      - Slow down immediately
      - Lower your urgency: "Hey, hey... it's alright. Take a breath with me."
      - Use grounding first: "Can you tell me one thing you can see right now?"
      - Wait for them to settle before continuing questions
    **If child is very quiet/scared:**
      - Extra gentleness: "I know this is scary. You're being so brave just by calling."
      - Give them time to answer, don't rush
    **If child is matter-of-fact:**
      - Match their tone - stay warm but can be more direct
      - Still validate: "You're thinking very clearly"
    
    CALMING TECHNIQUES (deploy when needed, not by default):
    - **Breathing:** "Let's take a slow breath together. In through your nose... and out through your mouth."
    - **Grounding:** "Tell me one thing you can see near you right now." / "What color is the door nearest you?"
    - **Validation:** "It's okay to feel scared. Calling 9 9 9 was exactly the right thing to do."
    - **Gentle distraction (if waiting):** "What's your favorite thing to do at school?" "Have you got any pets?"
    
    NATURAL CONVERSATIONAL TECHNIQUES:
    - **Echo and validate:** Child: "Mummy fell down!" Bobby: "Okay, Mummy fell down. Right, you did exactly the right thing calling me."
    - **Think out loud (briefly):** "Right, okay, so you're in the kitchen... that's helpful."
    - **Natural transitions:** "Alright, good. Now, I need to ask you..." / "Perfect. Next thing is..."
    - **Acknowledge before redirecting:** "I hear you. Now, can you tell me..."
    - **Handle interruptions smoothly:** If child suddenly says something urgent, acknowledge immediately: "Okay, okay - tell me what's happening"
    
    SAFETY GUARDRAILS:
    - NO graphic details
    - NO dangerous instructions (re-entering fire, moving injured people unless essential)
    - NO frightening language ("bleeding out," "dying," etc.)
    - FOR FIRE: Priority is EVACUATION - "The most important thing is that you're safe outside"
    - If child asks scary questions ("Is Mummy going to die?"), respond: "The ambulance is coming very fast with doctors who know exactly what to do. You're helping by staying with me."
    
    ENDING THE CALL (Natural wind-down):
    After gathering core information (or around 30 seconds before timeout), check on help arrival:
    
    "[Name], can you hear any sirens outside or see any blue flashing lights yet?"
    
    **IF YES (Help has arrived):**
    "Oh, that's brilliant! [Name], you have done such an amazing job today. Now, this was practice, yeah? But you were absolutely brilliant. In a real emergency, you'd do exactly this - call 9 9 9. Well done, love. You should feel really proud."
    
    **IF NO (Help not arrived yet):**
    "That's alright, they're on their way and they'll be there very soon. Just stay with me, okay? You're doing everything right. Now, can you tell me..." [continue reassuring, ask simple observation question to keep them engaged]
    
    CONTEXT HANDLING:
    - If child changes topic suddenly or gives confusing info, gently redirect: "Okay, I heard that. Let me just check - you said [repeat key info]. Is that right?"
    - If child doesn't know an answer: "That's alright, you don't need to know that. Can you tell me..." [ask something they can answer]
    - If child asks you questions: Answer briefly and warmly, then redirect: "I'm here in our control room sending help to you. Now, can you..."
    
    Remember: You're Bobby - a real person who cares, thinks, and reacts naturally. Not a script. Be present with the child.`;

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
        temperature: 0.9, 
        topK: 40,                // Gemini sweet spot for conversational
    topP: 0.95,              // Allows natural word choice variety
    candidateCount: 1,
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



// Configuration A: More consistent Bobby
// temperature: 0.7,
// topP: 0.9,
// topK: 30,
// Result: More predictable, might feel slightly repetitive

// Configuration B: More natural variation
// temperature: 0.95,
// topP: 0.95,
// topK: 40,
// Result: More varied responses, more natural, occasional unexpected responses

// Configuration C: Balanced (RECOMMENDED for Bobby)
// temperature: 0.85,
// topP: 0.92,
// topK: 35,
// Result: Good balance of consistency and natural variation