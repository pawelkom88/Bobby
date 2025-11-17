'use client';

/**
 * Lightweight UI click sound using the Web Audio API.
 * - Safe on SSR (guards window)
 * - Resumes AudioContext on first user gesture
 * - Very short envelope to avoid annoyance
 */

let sharedAudioContext: AudioContext | null = null;
let connectingAudioEl: HTMLAudioElement | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    if (!sharedAudioContext) {
      const Ctor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
      if (!Ctor) {
        return null;
      }
      sharedAudioContext = new Ctor();
    }
    return sharedAudioContext;
  } catch {
    return null;
  }
}

/**
 * Play a short "click" blip.
 */
export async function playUiClick(enabled: boolean): Promise<void> {
  if (!enabled) {
    return;
  }
  const audioContext = getAudioContext();
  if (!audioContext) {
    return;
  }
  try {
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    const now = audioContext.currentTime;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    // Subtle "tick" style: short triangle blip with quick decay
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.05);

    // Envelope
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.15, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  } catch {
    // Ignore audio errors silently for UI sounds
  }
}

/**
 * Start looping "connecting" sound. Returns a stop function.
 * If NEXT_PUBLIC_UI_SOUND_CONNECTING_URL is provided, it will be used as the loop source.
 * Otherwise, the function will fall back to a soft repeating blip using Web Audio.
 */
export function startConnectingSound(enabled: boolean): () => void {
  if (!enabled || typeof window === 'undefined') {
    return () => {};
  }

  // Helper: stop and clear any existing element
  const stopExisting = () => {
    if (connectingAudioEl) {
      try {
        connectingAudioEl.pause();
      } catch {}
      connectingAudioEl.src = '';
      connectingAudioEl.onended = null;
      connectingAudioEl.onerror = null;
      connectingAudioEl = null;
    }
  };

  // Candidate URLs (AAC preferred, MP3 fallback)
  const envUrl = process.env.NEXT_PUBLIC_UI_SOUND_CONNECTING_URL || '';
  const candidates: string[] = [];
  const pushIfNotExists = (u: string) => {
    if (u && !candidates.includes(u)) candidates.push(u);
  };

  if (envUrl) {
    pushIfNotExists(envUrl);
    // Try to infer alternate extension
    if (envUrl.endsWith('.aac')) {
      pushIfNotExists(envUrl.replace(/\.aac$/i, '.mp3'));
    } else if (envUrl.endsWith('.mp3')) {
      pushIfNotExists(envUrl.replace(/\.mp3$/i, '.aac'));
    }
  }
  // Default public paths
  pushIfNotExists('/connecting.aac');
  pushIfNotExists('/connecting.mp3');
  // Also try common sfx directory
  pushIfNotExists('/sfx/connecting.aac');
  pushIfNotExists('/sfx/connecting.mp3');

  // Attempt to play candidates sequentially
  const audio = new Audio();
  audio.loop = true;
  audio.volume = 0.4;
  let idx = 0;
  let stopped = false;

  const tryNext = () => {
    if (stopped) return;
    if (idx >= candidates.length) {
      // Fallback to Web Audio blip loop
      startWebAudioLoop();
      return;
    }
    const url = candidates[idx++];
    // Quick type-based skip if clearly unsupported
    const type = url.endsWith('.aac') ? 'audio/aac' : url.endsWith('.mp3') ? 'audio/mpeg' : '';
    if (type && audio.canPlayType && !audio.canPlayType(type)) {
      tryNext();
      return;
    }
    audio.src = url;
    // Start playing; may fail due to permissions or unsupported codec
    audio.play().then(() => {
      connectingAudioEl = audio;
    }).catch(() => {
      tryNext();
    });
  };

  // Web Audio loop fallback
  const startWebAudioLoop = () => {
    const ac = getAudioContext();
    if (!ac) {
      return;
    }
    let timeoutId: number | null = null;
    const scheduleBlip = async () => {
      if (stopped) return;
      try {
        if (ac.state === 'suspended') {
          await ac.resume();
        }
        const now = ac.currentTime;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
  
        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.12);
  
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
  
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } catch {
        // ignore
      } finally {
        if (!stopped) {
          timeoutId = window.setTimeout(scheduleBlip, 350);
        }
      }
    };
    scheduleBlip();
    // Merge stop function to clear loop
    stop = () => {
      stopped = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  };

  tryNext();

  let stop = () => {
    stopped = true;
    audio.onended = null;
    audio.onerror = null;
    stopExisting();
  };

  return () => {
    stop();
  };
}

/**
 * Play a one-shot "conversation ended" sound.
 * If NEXT_PUBLIC_UI_SOUND_END_URL is provided, it will be used.
 * Otherwise, fall back to a short descending blip.
 */
export async function playEndConversationSound(enabled: boolean): Promise<void> {
  if (!enabled || typeof window === 'undefined') {
    return;
  }
  const envUrl = process.env.NEXT_PUBLIC_UI_SOUND_END_URL || '';
  const candidates: string[] = [];
  const pushIfNotExists = (u: string) => {
    if (u && !candidates.includes(u)) candidates.push(u);
  };
  if (envUrl) {
    pushIfNotExists(envUrl);
    if (envUrl.endsWith('.aac')) {
      pushIfNotExists(envUrl.replace(/\.aac$/i, '.mp3'));
    } else if (envUrl.endsWith('.mp3')) {
      pushIfNotExists(envUrl.replace(/\.mp3$/i, '.aac'));
    }
  }
  pushIfNotExists('/end.aac');
  pushIfNotExists('/end.mp3');
  pushIfNotExists('/sfx/end.aac');
  pushIfNotExists('/sfx/end.mp3');
  for (const url of candidates) {
    try {
      const el = new Audio(url);
      el.volume = 0.3;
      await el.play();
      return;
    } catch {
      // try next
    }
  }

  const ac = getAudioContext();
  if (!ac) return;
  try {
    if (ac.state === 'suspended') {
      await ac.resume();
    }
    const now = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.25);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  } catch {
    // ignore
  }
}


