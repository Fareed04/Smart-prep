// Web Audio API Soundscape & Chime Generator for Zen / Focus Mode
// 100% Client-side, zero external assets, works offline

export type SoundscapeType = 'rain' | 'waves' | 'forest' | 'alpha' | 'off';

class ZenAudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: { stop?: () => void; disconnect: () => void }[] = [];
  private currentType: SoundscapeType = 'off';
  private currentVolume: number = 0.5;

  private getContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setVolume(volume: number) {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.currentVolume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.currentVolume;
  }

  public getCurrentSoundscape(): SoundscapeType {
    return this.currentType;
  }

  public stopSoundscape() {
    if (this.masterGain && this.ctx) {
      // Smooth fade out to prevent pop
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(0.001, now + 0.3);
      setTimeout(() => {
        this.cleanupNodes();
        this.currentType = 'off';
      }, 350);
    } else {
      this.cleanupNodes();
      this.currentType = 'off';
    }
  }

  private cleanupNodes() {
    this.activeNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch {
        // ignore disconnect errors
      }
    });
    this.activeNodes = [];
    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch {
        // ignore
      }
      this.masterGain = null;
    }
  }

  public playSoundscape(type: SoundscapeType, volume: number = this.currentVolume) {
    if (type === 'off') {
      this.stopSoundscape();
      return;
    }

    const ctx = this.getContext();
    this.cleanupNodes();

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.5);
    masterGain.connect(ctx.destination);
    this.masterGain = masterGain;
    this.currentType = type;
    this.currentVolume = volume;

    if (type === 'rain') {
      this.createRainSoundscape(ctx, masterGain);
    } else if (type === 'waves') {
      this.createWavesSoundscape(ctx, masterGain);
    } else if (type === 'forest') {
      this.createForestSoundscape(ctx, masterGain);
    } else if (type === 'alpha') {
      this.createAlphaBinauralSoundscape(ctx, masterGain);
    }
  }

  // 1. Rain Soundscape: Pink noise with soft low-pass filter
  private createRainSoundscape(ctx: AudioContext, dest: GainNode) {
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(dest);

    whiteNoise.start();
    this.activeNodes.push(whiteNoise, filter);
  }

  // 2. Ocean Waves: Low-frequency amplitude-modulated brownian noise
  private createWavesSoundscape(ctx: AudioContext, dest: GainNode) {
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 1.5;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const waveFilter = ctx.createBiquadFilter();
    waveFilter.type = 'lowpass';
    waveFilter.frequency.setValueAtTime(450, ctx.currentTime);

    // LFO for periodic wave surging (cycle ~ 10 seconds)
    const waveGain = ctx.createGain();
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.1, ctx.currentTime);

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.35, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(waveGain.gain);

    waveGain.gain.setValueAtTime(0.45, ctx.currentTime);

    noise.connect(waveFilter);
    waveFilter.connect(waveGain);
    waveGain.connect(dest);

    noise.start();
    lfo.start();
    this.activeNodes.push(noise, waveFilter, waveGain, lfo, lfoGain);
  }

  // 3. Forest Breeze: Gentle high-passed wind with subtle modulation
  private createForestSoundscape(ctx: AudioContext, dest: GainNode) {
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.07;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(800, ctx.currentTime);
    bandpass.Q.setValueAtTime(1.2, ctx.currentTime);

    // Soft breeze modulation
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.15, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(250, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(bandpass.frequency);

    noise.connect(bandpass);
    bandpass.connect(dest);

    noise.start();
    lfo.start();
    this.activeNodes.push(noise, bandpass, lfo, lfoGain);
  }

  // 4. Alpha Binaural Beats: 432 Hz in Left, 442 Hz in Right (10 Hz Alpha brainwave for deep concentration)
  private createAlphaBinauralSoundscape(ctx: AudioContext, dest: GainNode) {
    const merger = ctx.createChannelMerger(2);

    // Left oscillator: 432 Hz
    const oscLeft = ctx.createOscillator();
    oscLeft.type = 'sine';
    oscLeft.frequency.setValueAtTime(432, ctx.currentTime);

    const gainLeft = ctx.createGain();
    gainLeft.gain.setValueAtTime(0.2, ctx.currentTime);
    oscLeft.connect(gainLeft);
    gainLeft.connect(merger, 0, 0); // Left channel

    // Right oscillator: 442 Hz (10Hz difference = Alpha state)
    const oscRight = ctx.createOscillator();
    oscRight.type = 'sine';
    oscRight.frequency.setValueAtTime(442, ctx.currentTime);

    const gainRight = ctx.createGain();
    gainRight.gain.setValueAtTime(0.2, ctx.currentTime);
    oscRight.connect(gainRight);
    gainRight.connect(merger, 0, 1); // Right channel

    // Gentle sub-bass drone for warmth
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(108, ctx.currentTime);
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.1, ctx.currentTime);
    subOsc.connect(subGain);
    subGain.connect(merger, 0, 0);
    subGain.connect(merger, 0, 1);

    merger.connect(dest);

    oscLeft.start();
    oscRight.start();
    subOsc.start();
    this.activeNodes.push(oscLeft, oscRight, subOsc, gainLeft, gainRight, subGain, merger);
  }

  // Calming Tibetan Singing Bowl Bell for timer completion
  public playZenChime() {
    const ctx = this.getContext();
    const now = ctx.currentTime;

    const baseFreq = 528; // Solfeggio "Transformation & Miracles" frequency
    const harmonics = [1, 2.01, 3.02, 4.05];
    const harmonicGains = [0.4, 0.2, 0.08, 0.03];

    harmonics.forEach((mult, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * mult, now);

      gain.gain.setValueAtTime(harmonicGains[index] * this.currentVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 3.6);
    });
  }
}

export const zenAudio = new ZenAudioManager();
