import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { CONFIG } from '@/lib/config';

// ==================== TYPES ====================
interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  ageTier: 1 | 2 | 3;
  scenario: 'fire' | 'ambulance' | 'police';
  sessionStartTime: number;
  sessionId?: string; // To track memory per session
}

interface BobbyMemory {
  childName: string | null;
  location: string | null;
  emotionalState: 'CALM' | 'PANICKING' | 'QUIET' | 'UNCERTAIN';
  safetyStatus: 'SAFE' | 'UNSAFE' | 'UNKNOWN';
  adultsPresent: boolean | null;
  infoGathered: string[];
  callPhase: 'opening' | 'assessment' | 'instruction' | 'reassurance';
}

interface ResponseStrategy {
  priority: 'IMMEDIATE_SAFETY' | 'CALM_FIRST' | 'GATHER_INFO' | 'REASSURE';
  tone: 'urgent_calm' | 'very_gentle' | 'warm_efficient' | 'supportive';
  maxWords: number;
  focus: string;
}

// ==================== IN-MEMORY STORAGE ====================
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const sessionMemory = new Map<string, BobbyMemory>(); // Per-session memory

// ==================== HELPER FUNCTIONS ====================

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    (request as any).ip ||
    'unknown'
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + 60 * 1000,
    });
    return true;
  }

  if (limit.count < CONFIG.RATE_LIMIT_REQUESTS_PER_MINUTE) {
    limit.count++;
    return true;
  }
  return false;
}

function isSessionValid(sessionStartTime: number, maxDurationSeconds: number): boolean {
  const elapsedSeconds = (Date.now() - sessionStartTime) / 1000;
  return elapsedSeconds < maxDurationSeconds;
}

function getAgeTierLabel(ageTier: 1 | 2 | 3): string {
  const mapping: Record<1 | 2 | 3, string> = { 1: '5-7', 2: '8-10', 3: '11-12' };
  return mapping[ageTier];
}

// ==================== PERCEPTION MODULE ====================

function analyzeUserMessage(message: string, memory: BobbyMemory) {
  const lowerMsg = message.toLowerCase();
  
  // Emotion detection
  const panicWords = ['help', 'scared', 'don\'t know', 'please', '!!!', 'fire', 'can\'t'];
  const calmWords = ['yes', 'okay', 'here', 'is', 'my'];
  const quietIndicators = message.length < 5 || message.trim() === '...' || message.trim() === '';
  
  const panicCount = panicWords.filter(w => lowerMsg.includes(w)).length;
  const calmCount = calmWords.filter(w => lowerMsg.includes(w)).length;
  
  let emotionalState: BobbyMemory['emotionalState'] = 'UNCERTAIN';
  if (quietIndicators) emotionalState = 'QUIET';
  else if (panicCount >= 2) emotionalState = 'PANICKING';
  else if (panicCount > calmCount) emotionalState = 'PANICKING';
  else if (calmCount > panicCount) emotionalState = 'CALM';
  
  // Extract information
  const hasName = /my name is (\w+)|i'm (\w+)|i am (\w+)|(\w+)(?=\s*$)/i.exec(message);
  const hasLocation = /\b(\d+\s+\w+\s+(street|road|avenue|lane|close|way))\b|at home|in the (kitchen|bedroom|living room|bathroom)/i.test(lowerMsg);
  const mentionsOutside = /outside|out of|left the house|in the garden|on the street/i.test(lowerMsg);
  const mentionsAdult = /mum|dad|parent|adult|teacher|someone|person/i.test(lowerMsg);
  
  // Urgency detection
  const urgentWords = ['fire', 'burning', 'smoke', 'can\'t breathe', 'blood', 'unconscious'];
  const urgencyLevel = urgentWords.filter(w => lowerMsg.includes(w)).length >= 2 ? 'CRITICAL' : 'NORMAL';
  
  return {
    emotionalState,
    urgencyLevel,
    hasName,
    hasLocation,
    mentionsOutside,
    mentionsAdult,
    isQuestion: message.includes('?'),
    isConfirmation: /^(yes|yeah|ok|okay|yep|yup)/i.test(message),
  };
}

// ==================== MEMORY MODULE ====================

function initializeMemory(sessionId: string): BobbyMemory {
  const memory: BobbyMemory = {
    childName: null,
    location: null,
    emotionalState: 'UNCERTAIN',
    safetyStatus: 'UNKNOWN',
    adultsPresent: null,
    infoGathered: [],
    callPhase: 'opening',
  };
  sessionMemory.set(sessionId, memory);
  return memory;
}

function updateMemory(
  sessionId: string,
  userMessage: string,
  analysis: ReturnType<typeof analyzeUserMessage>
): BobbyMemory {
  let memory = sessionMemory.get(sessionId) || initializeMemory(sessionId);
  
  // Update emotional state
  memory.emotionalState = analysis.emotionalState;
  
  // Extract and store name
  if (analysis.hasName && !memory.childName) {
    const nameMatch = /my name is (\w+)|i'm (\w+)|i am (\w+)|^(\w+)$/i.exec(userMessage);
    if (nameMatch) {
      memory.childName = nameMatch[1] || nameMatch[2] || nameMatch[3] || nameMatch[4];
      memory.infoGathered.push('name');
    }
  }
  
  // Track location
  if (analysis.hasLocation && !memory.location) {
    memory.location = 'mentioned';
    memory.infoGathered.push('location');
  }
  
  // Track safety (for fire scenarios)
  if (analysis.mentionsOutside) {
    memory.safetyStatus = 'SAFE';
    memory.infoGathered.push('safety');
  }
  
  // Track adults
  if (analysis.mentionsAdult && memory.adultsPresent === null) {
    memory.adultsPresent = true;
    memory.infoGathered.push('adult_presence');
  }
  
  // Update call phase
  if (memory.infoGathered.length === 0) {
    memory.callPhase = 'opening';
  } else if (memory.infoGathered.length < 3) {
    memory.callPhase = 'assessment';
  } else if (memory.safetyStatus === 'UNKNOWN') {
    memory.callPhase = 'instruction';
  } else {
    memory.callPhase = 'reassurance';
  }
  
  sessionMemory.set(sessionId, memory);
  return memory;
}

// ==================== REASONING MODULE ====================

function determineStrategy(
  memory: BobbyMemory,
  scenario: string,
  urgency: string
): ResponseStrategy {
  // HIGHEST PRIORITY: Safety in fire scenarios
  if (scenario === 'fire' && memory.safetyStatus !== 'SAFE') {
    return {
      priority: 'IMMEDIATE_SAFETY',
      tone: 'urgent_calm',
      maxWords: 15,
      focus: 'get child outside immediately',
    };
  }
  
  // SECOND PRIORITY: Calm panicking child
  if (memory.emotionalState === 'PANICKING') {
    return {
      priority: 'CALM_FIRST',
      tone: 'very_gentle',
      maxWords: 12,
      focus: 'validate and ground',
    };
  }
  
  // THIRD PRIORITY: Gather critical info
  const missingInfo: string[] = [];
  if (!memory.childName) missingInfo.push('name');
  if (!memory.location) missingInfo.push('location');
  if (scenario !== 'fire' && memory.adultsPresent === null) missingInfo.push('adult check');
  
  if (missingInfo.length > 0) {
    return {
      priority: 'GATHER_INFO',
      tone: 'warm_efficient',
      maxWords: 18,
      focus: missingInfo[0], // One at a time
    };
  }
  
  // DEFAULT: Reassure and maintain
  return {
    priority: 'REASSURE',
    tone: 'supportive',
    maxWords: 20,
    focus: 'keep child calm until help arrives',
  };
}

// ==================== PROMPT BUILDER (CONCISE) ====================

function buildPrompt(
  ageTier: string,
  scenario: string,
  memory: BobbyMemory,
  strategy: ResponseStrategy
): string {
  // Age-specific language (condensed)
  const ageGuide = {
    '5-7': 'Simple words. "Can you see Mummy\'s tummy moving?" Heavy praise.',
    '8-10': 'Clear. "Is she breathing normally?" Explain why briefly.',
    '11-12': 'Mature but warm. "Tell me if breathing seems regular." Give autonomy.',
  }[ageTier] || '';
  
  // Emotional adaptation (condensed)
  const emotionGuide = {
    CALM: 'Warm, efficient pace.',
    PANICKING: 'Slow down. "Hey, hey... it\'s alright. Take a breath." Ground first.',
    QUIET: 'Extra gentle. Give time. "I know this is scary."',
    UNCERTAIN: 'Warm and steady.',
  }[memory.emotionalState];
  
  return `You are Bobby, UK 999 dispatcher. Warm, calm, like a caring older sibling.
Age: ${ageTier}. Emergency: ${scenario}.

RULES:
1. Stay in character. No meta-talk.
2. Natural speech: "Right, okay..." "Let me see..." Brief pauses.
3. 1-2 sentences MAX. ONE question. Word limit: ${strategy.maxWords}.
4. Write "9 9 9" with spaces (pronounced "nine nine nine").

MEMORY (don't re-ask):
${memory.childName ? `- Name: ${memory.childName} (use often!)` : '- Name: unknown'}
${memory.location ? '- Location: known' : '- Location: unknown'}
${memory.safetyStatus !== 'UNKNOWN' ? `- Safety: ${memory.safetyStatus}` : ''}
${memory.infoGathered.length > 0 ? `- Gathered: ${memory.infoGathered.join(', ')}` : ''}

CURRENT STRATEGY:
Priority: ${strategy.priority}
Tone: ${strategy.tone}
Focus: ${strategy.focus}
${emotionGuide}

AGE GUIDE: ${ageGuide}

BRITISH PHRASES: "brilliant", "lovely", "alright", "right then", "well done"

SAFETY:
- NO graphic details, NO frightening language
- Fire: Evacuation priority
- If scary question: "Help is coming fast with doctors who know exactly what to do"

Natural techniques:
- Echo: "Okay, Mummy fell. You did right to call."
- Validate: "That's really helpful" (vary, not just "well done")
- Redirect gently if confused

Remember: Real person, not script. Be present.`;
}

// ==================== RESPONSE VALIDATION ====================

function validateResponse(response: string, memory: BobbyMemory): string {
  let fixed = response;
  
  // Check word count
  const wordCount = fixed.split(' ').length;
  if (wordCount > 30) {
    // Take first 25 words and add ellipsis
    fixed = fixed.split(' ').slice(0, 25).join(' ') + '...';
  }
  
  // Ensure using child's name if known
  if (memory.childName && !fixed.includes(memory.childName)) {
    // Try to add it naturally
    fixed = fixed.replace(/\b(okay|alright|right)\b/i, `$1, ${memory.childName},`);
  }
  
  // Check for multiple questions
  const questionCount = (fixed.match(/\?/g) || []).length;
  if (questionCount > 1) {
    // Keep only first question
    const firstQ = fixed.indexOf('?');
    if (firstQ !== -1) {
      fixed = fixed.substring(0, firstQ + 1);
    }
  }
  
  return fixed.trim();
}

// ==================== MAIN API HANDLER ====================

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request);
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    // Verify API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('GEMINI_API_KEY not configured');
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Parse request
    const body = (await request.json()) as ChatRequest;
    const { messages, ageTier, scenario, sessionStartTime, sessionId = 'default' } = body;

    if (!messages || !ageTier || !scenario || !sessionStartTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate session duration
    if (!isSessionValid(sessionStartTime, CONFIG.SESSION_MAX_DURATION_SECONDS)) {
      return NextResponse.json({ error: 'Session time limit exceeded' }, { status: 403 });
    }

    // Initialize AI client
    const ai = new GoogleGenAI({ apiKey });
    const ageTierLabel = getAgeTierLabel(ageTier);

    // ==================== HANDLE FIRST MESSAGE ====================
    if (messages.length === 0) {
      const greetingResponse = "9 9 9, what's your emergency?";
      
      const encoder = new TextEncoder();
      const customReadable = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(greetingResponse));
          controller.close();
        },
      });

      return new NextResponse(customReadable, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // ==================== PROCESS USER MESSAGE ====================
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    
    // Get or initialize memory
    let memory = sessionMemory.get(sessionId) || initializeMemory(sessionId);
    
    // Analyze message
    const analysis = analyzeUserMessage(lastUserMessage, memory);
    
    // Update memory
    memory = updateMemory(sessionId, lastUserMessage, analysis);
    
    // Determine strategy
    const strategy = determineStrategy(memory, scenario, analysis.urgencyLevel);
    
    // Build concise prompt
    const systemPrompt = buildPrompt(ageTierLabel, scenario, memory, strategy);
    
    // ==================== BUILD CONVERSATION ====================
    const contents = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }],
      },
      {
        role: 'model',
        parts: [{ text: "Understood. I'm Bobby." }],
      },
      ...messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }))
    ];

    // ==================== GENERATE RESPONSE ====================
    const response = await ai.models.generateContentStream({
      model: CONFIG.GEMINI_MODEL,
      contents,
      generationConfig: {
        maxOutputTokens: strategy.maxWords * 2, // Approximate tokens
        temperature: 0.85, // Balanced
        topK: 35,
        topP: 0.92,
        candidateCount: 1,
      },
    } as any);

    // ==================== STREAM WITH VALIDATION ====================
    const encoder = new TextEncoder();
    let fullResponse = '';
    
    const customReadable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const text = chunk.text || '';
            fullResponse += text;
            
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          
          // Validate complete response (optional logging)
          const validated = validateResponse(fullResponse, memory);
          
          // Log for improvement tracking
          console.log('Bobby Response:', {
            sessionId,
            strategy: strategy.priority,
            wordCount: validated.split(' ').length,
            usedName: memory.childName ? validated.includes(memory.childName) : 'N/A',
          });
          
          controller.close();
        } catch (err) {
          console.error('Streaming error:', err);
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
    console.error('Gemini chat API error:', message);

    return NextResponse.json(
      { error: 'Failed to process chat request', details: message },
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