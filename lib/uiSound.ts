'use client';

/**
 * Lightweight UI click sound using the Web Audio API.
 * - Safe on SSR (guards window)
 * - Resumes AudioContext on first user gesture
 * - Very short envelope to avoid annoyance
 */

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    if (!sharedAudioContext) {
      const Ctor = (window.AudioContext ||
        (window as any).webkitAudioContext) as typeof AudioContext | undefined;
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
 * Play a one-shot "conversation ended" sound.
 * If NEXT_PUBLIC_UI_SOUND_END_URL is provided, it will be used.
 * Otherwise, fall back to a short descending blip.
 */
export async function playEndConversationSound(
  enabled: boolean
): Promise<void> {
  if (!enabled || typeof window === 'undefined') {
    return;
  }
  const envUrl = '/end.aac';
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

/**
 * Play a one-shot "fanfare" sound for successful completion.
 * Uses lazy-loaded fanfare.mp3 file from public/sfx directory.
 */
export async function playFanfareSound(enabled: boolean): Promise<void> {
  if (!enabled || typeof window === 'undefined') {
    return;
  }

  // Try to play fanfare.mp3 from sfx directory (lazy-loaded)
  const candidates = ['/sfx/fanfare.mp3', '/fanfare.mp3'];

  for (const url of candidates) {
    try {
      // Lazy load audio on-demand
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = url;
      audio.volume = 0.5;
      await audio.play();
      return;
    } catch {
      // Try next candidate
    }
  }

  // Fallback to Web Audio triumphant sound
  const ac = getAudioContext();
  if (!ac) return;

  try {
    if (ac.state === 'suspended') {
      await ac.resume();
    }
    const now = ac.currentTime;

    // Create a short triumphant chord progression
    const notes = [523.25, 659.25, 783.99]; // C, E, G (C major chord)

    notes.forEach((freq, index) => {
      const osc = ac.createOscillator();
      const gain = ac.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + index * 0.1);

      gain.gain.setValueAtTime(0.0001, now + index * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.08, now + index * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.1 + 0.4);

      osc.connect(gain);
      gain.connect(ac.destination);

      osc.start(now + index * 0.1);
      osc.stop(now + index * 0.1 + 0.5);
    });
  } catch {
    // Ignore audio errors
  }
}
