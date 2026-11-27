"use client";

export type SoundEffect =
  | "click"
  | "hover"
  | "success"
  | "toggleOn"
  | "toggleOff"
  | "open"
  | "close"
  | "error";

const VALID_EFFECTS = new Set<SoundEffect>([
  "click",
  "hover",
  "success",
  "toggleOn",
  "toggleOff",
  "open",
  "close",
  "error",
]);

let audioCtx: AudioContext | null = null;
let soundEnabled = true;
let lastPlayTime = 0;
let lastHoverTime = 0;
let lastSemanticTime = 0;

export function setGlobalSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled;
}

export function getGlobalSoundEnabled(): boolean {
  return soundEnabled;
}

export function isSoundEffect(value: string | null): value is SoundEffect {
  return value !== null && VALID_EFFECTS.has(value as SoundEffect);
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  options: {
    type: OscillatorType;
    freqStart: number;
    freqEnd: number;
    durationSec: number;
    gainPeak: number;
    delaySec?: number;
  }
) {
  const start = ctx.currentTime + (options.delaySec ?? 0);
  const stop = start + options.durationSec;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = options.type;
  osc.frequency.setValueAtTime(options.freqStart, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, options.freqEnd), stop);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(options.gainPeak, start + Math.min(0.004, options.durationSec * 0.25));
  gain.gain.exponentialRampToValueAtTime(0.0001, stop);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(start);
  osc.stop(stop + 0.005);
}

export function triggerSound(effect: SoundEffect): void {
  if (typeof window === "undefined" || !soundEnabled) return;

  const now = performance.now();

  if (effect === "hover") {
    if (now - lastHoverTime < 90) return;
    lastHoverTime = now;
  } else if (effect === "click") {
    if (now - lastSemanticTime < 60 || now - lastPlayTime < 35) return;
    lastPlayTime = now;
  } else {
    lastSemanticTime = now;
    lastPlayTime = now;
  }

  const ctx = getAudioContext();
  if (!ctx || ctx.state !== "running") return;

  try {
    switch (effect) {
      case "click":
        playTone(ctx, {
          type: "triangle",
          freqStart: 920,
          freqEnd: 360,
          durationSec: 0.022,
          gainPeak: 0.055,
        });
        playTone(ctx, {
          type: "sine",
          freqStart: 2200,
          freqEnd: 1400,
          durationSec: 0.012,
          gainPeak: 0.025,
        });
        break;
      case "hover":
        playTone(ctx, {
          type: "sine",
          freqStart: 1380,
          freqEnd: 1520,
          durationSec: 0.014,
          gainPeak: 0.014,
        });
        break;
      case "success":
        playTone(ctx, {
          type: "sine",
          freqStart: 659,
          freqEnd: 659,
          durationSec: 0.085,
          gainPeak: 0.055,
        });
        playTone(ctx, {
          type: "triangle",
          freqStart: 988,
          freqEnd: 988,
          durationSec: 0.16,
          gainPeak: 0.055,
          delaySec: 0.045,
        });
        break;
      case "toggleOn":
        playTone(ctx, {
          type: "triangle",
          freqStart: 520,
          freqEnd: 880,
          durationSec: 0.055,
          gainPeak: 0.048,
        });
        break;
      case "toggleOff":
        playTone(ctx, {
          type: "triangle",
          freqStart: 760,
          freqEnd: 440,
          durationSec: 0.055,
          gainPeak: 0.045,
        });
        break;
      case "open":
        playTone(ctx, {
          type: "sine",
          freqStart: 340,
          freqEnd: 640,
          durationSec: 0.11,
          gainPeak: 0.042,
        });
        break;
      case "close":
        playTone(ctx, {
          type: "sine",
          freqStart: 560,
          freqEnd: 300,
          durationSec: 0.095,
          gainPeak: 0.038,
        });
        break;
      case "error":
        playTone(ctx, {
          type: "triangle",
          freqStart: 195,
          freqEnd: 130,
          durationSec: 0.115,
          gainPeak: 0.055,
        });
        playTone(ctx, {
          type: "triangle",
          freqStart: 175,
          freqEnd: 115,
          durationSec: 0.11,
          gainPeak: 0.045,
          delaySec: 0.08,
        });
        break;
    }
  } catch {
    // ignore Web Audio synthesis failures cleanly
  }
}
