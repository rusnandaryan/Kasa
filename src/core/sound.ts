/**
 * Web Audio API synthesizer for Kasa POS.
 * 100% offline, zero external sound assets, non-blocking audio feedback.
 */
const SOUND_MUTE_KEY = 'kasa_sound_muted_v1';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.isMuted = window.localStorage.getItem(SOUND_MUTE_KEY) === '1';
      } catch {
        // Storage unavailable, default to sound on
      }
    }
  }

  private setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(SOUND_MUTE_KEY, muted ? '1' : '0');
    } catch {
      // Ignore storage errors
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Tactile click/blip when item is added to cart or barcode scanned.
   */
  public playBlip() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(820, ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.06);
    } catch {
      // Browser autoplay policy graceful fallback
    }
  }

  /**
   * Cheerful success chime when transaction payment completes.
   */
  public playSuccess() {
    if (this.isMuted) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const playTone = (freq: number, start: number, duration: number) => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.09, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + duration);
      };

      playTone(523.25, now, 0.1);         // C5
      playTone(659.25, now + 0.08, 0.1);  // E5
      playTone(783.99, now + 0.16, 0.22); // G5
    } catch {
      // Browser autoplay policy graceful fallback
    }
  }

  public toggleMute(): boolean {
    const next = !this.isMuted;
    this.setMuted(next);
    return next;
  }

  public setMutedState(muted: boolean) {
    this.setMuted(muted);
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}

export const sound = new SoundEngine();

