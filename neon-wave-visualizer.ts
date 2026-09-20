/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

@customElement('neon-wave-visualizer')
export class NeonWaveVisualizer extends LitElement {
  @property({ type: Object })
  outputNode: AudioNode | null = null;

  @property({ type: Object })
  inputNode: AudioNode | null = null;

  @property({ type: Boolean })
  isSpeaking = false;

  @property({ type: Boolean })
  isUserSpeaking = false;

  @property({ type: Boolean })
  isConnected = true;

  @property({ type: String })
  toneBadge = '';

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;

  private outputAnalyser: AnalyserNode | null = null;
  private inputAnalyser: AnalyserNode | null = null;

  private outputFreqData: Uint8Array | null = null;
  private outputTimeData: Uint8Array | null = null;
  private inputFreqData: Uint8Array | null = null;

  private smoothedVolume = 0;
  private smoothedBass = 0;
  private smoothedMid = 0;
  private smoothedTreble = 0;

  private phase = 0;
  private particles: Particle[] = [];
  private resizeObserver: ResizeObserver | null = null;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90vw;
      max-width: 820px;
      height: 380px;
      z-index: 10;
      pointer-events: none;
      user-select: none;
    }

    .visualizer-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    canvas {
      width: 100%;
      height: 100%;
      display: block;
      filter: drop-shadow(0 0 24px rgba(0, 242, 254, 0.25));
    }

    .wave-status-pill {
      position: absolute;
      bottom: 20px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 18px;
      background: rgba(13, 21, 39, 0.75);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(0, 242, 254, 0.3);
      border-radius: 20px;
      color: #e2e8f0;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.2px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 15px rgba(0, 242, 254, 0.2);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      direction: rtl;
    }

    .wave-status-pill.speaking {
      border-color: rgba(0, 242, 254, 0.8);
      color: #38bdf8;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 24px rgba(0, 242, 254, 0.45);
      background: rgba(13, 21, 39, 0.88);
    }

    .wave-status-pill.user-speaking {
      border-color: rgba(245, 158, 11, 0.8);
      color: #fcd34d;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 24px rgba(245, 158, 11, 0.45);
      background: rgba(13, 21, 39, 0.88);
    }

    .pulse-neon-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #00f2fe;
      box-shadow: 0 0 10px #00f2fe, 0 0 20px #00f2fe;
      animation: neonPulse 1.5s infinite alternate ease-in-out;
    }

    .pulse-neon-dot.amber {
      background: #f59e0b;
      box-shadow: 0 0 10px #f59e0b, 0 0 20px #f59e0b;
    }

    .pulse-neon-dot.green {
      background: #10b981;
      box-shadow: 0 0 10px #10b981, 0 0 20px #10b981;
    }

    @keyframes neonPulse {
      0% {
        transform: scale(0.85);
        opacity: 0.7;
      }
      100% {
        transform: scale(1.25);
        opacity: 1;
      }
    }

    @media (max-width: 768px) {
      :host {
        height: 300px;
        width: 95vw;
      }
      .wave-status-pill {
        bottom: 8px;
        font-size: 11px;
        padding: 5px 14px;
      }
    }
  `;

  firstUpdated() {
    this.canvas = this.shadowRoot?.querySelector('#neonWaveCanvas') as HTMLCanvasElement;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.setupResizeObserver();
      this.initParticles();
    }
    this.setupAudioAnalysers();
    this.startAnimation();
  }

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('outputNode') || changedProperties.has('inputNode')) {
      this.setupAudioAnalysers();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  private setupResizeObserver() {
    if (!this.canvas) return;
    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize();
    });
    this.resizeObserver.observe(this);
    this.handleResize();
  }

  private handleResize() {
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = this.getBoundingClientRect();
    const width = Math.max(300, rect.width || 800);
    const height = Math.max(200, rect.height || 380);

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;

    if (this.ctx) {
      this.ctx.resetTransform?.();
      this.ctx.scale(dpr, dpr);
    }
  }

  private setupAudioAnalysers() {
    if (this.outputNode && !this.outputAnalyser) {
      try {
        const audioCtx = this.outputNode.context;
        this.outputAnalyser = audioCtx.createAnalyser();
        this.outputAnalyser.fftSize = 256;
        this.outputAnalyser.smoothingTimeConstant = 0.82;
        this.outputNode.connect(this.outputAnalyser);

        const bufferLength = this.outputAnalyser.frequencyBinCount;
        this.outputFreqData = new Uint8Array(bufferLength);
        this.outputTimeData = new Uint8Array(bufferLength);
      } catch (e) {
        console.warn('NeonWaveVisualizer output analyser init notice:', e);
      }
    }

    if (this.inputNode && !this.inputAnalyser) {
      try {
        const audioCtx = this.inputNode.context;
        this.inputAnalyser = audioCtx.createAnalyser();
        this.inputAnalyser.fftSize = 256;
        this.inputAnalyser.smoothingTimeConstant = 0.8;
        this.inputNode.connect(this.inputAnalyser);

        const bufferLength = this.inputAnalyser.frequencyBinCount;
        this.inputFreqData = new Uint8Array(bufferLength);
      } catch (e) {
        console.warn('NeonWaveVisualizer input analyser init notice:', e);
      }
    }
  }

  private initParticles() {
    this.particles = [];
    const colors = ['#00f2fe', '#4facfe', '#ffd700', '#f43f5e', '#a855f7', '#38bdf8'];
    for (let i = 0; i < 45; i++) {
      this.particles.push({
        x: Math.random() * 800,
        y: Math.random() * 380,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 2.5 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.7 + 0.2,
        life: Math.random() * 100,
        maxLife: Math.random() * 100 + 100,
      });
    }
  }

  private startAnimation() {
    const loop = () => {
      this.renderWave();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  private renderWave() {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const width = this.canvas.width / dpr;
    const height = this.canvas.height / dpr;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    // Audio Analysis & Frequency Extraction
    let rawVolume = 0;
    let rawBass = 0;
    let rawMid = 0;
    let rawTreble = 0;

    if (this.outputAnalyser && this.outputFreqData && this.outputTimeData) {
      this.outputAnalyser.getByteFrequencyData(this.outputFreqData);
      this.outputAnalyser.getByteTimeDomainData(this.outputTimeData);

      let sum = 0;
      const len = this.outputFreqData.length;
      for (let i = 0; i < len; i++) {
        sum += this.outputFreqData[i];
      }
      rawVolume = sum / (len * 255);

      // Bass (indices 0..12)
      let bassSum = 0;
      const bassCount = Math.min(12, len);
      for (let i = 0; i < bassCount; i++) bassSum += this.outputFreqData[i];
      rawBass = bassSum / (bassCount * 255);

      // Mids (indices 13..45)
      let midSum = 0;
      const midCount = Math.min(45, len) - 12;
      for (let i = 12; i < 12 + midCount; i++) midSum += this.outputFreqData[i];
      rawMid = midSum / (midCount * 255);

      // Treble (indices 46..100)
      let trebleSum = 0;
      const trebleCount = Math.min(100, len) - 45;
      for (let i = 45; i < 45 + trebleCount; i++) trebleSum += this.outputFreqData[i];
      rawTreble = trebleSum / (trebleCount * 255);
    }

    // Combine with User Mic Input if user is speaking
    if (this.inputAnalyser && this.inputFreqData) {
      this.inputAnalyser.getByteFrequencyData(this.inputFreqData);
      let userSum = 0;
      for (let i = 0; i < this.inputFreqData.length; i++) {
        userSum += this.inputFreqData[i];
      }
      const userVol = userSum / (this.inputFreqData.length * 255);
      if (userVol > 0.05) {
        rawVolume = Math.max(rawVolume, userVol * 1.2);
        rawMid = Math.max(rawMid, userVol);
      }
    }

    // Smooth values for fluid organic animation
    const smoothingFactor = this.isSpeaking || this.isUserSpeaking ? 0.22 : 0.08;
    this.smoothedVolume += (rawVolume - this.smoothedVolume) * smoothingFactor;
    this.smoothedBass += (rawBass - this.smoothedBass) * smoothingFactor;
    this.smoothedMid += (rawMid - this.smoothedMid) * smoothingFactor;
    this.smoothedTreble += (rawTreble - this.smoothedTreble) * smoothingFactor;

    const baseIntensity = Math.max(0.06, this.smoothedVolume);
    const waveAmpScale = this.isSpeaking ? 1.6 : this.isUserSpeaking ? 1.3 : 0.65;
    const finalAmplitude = (baseIntensity * 90 + 8) * waveAmpScale;

    // Advance phase smoothly
    this.phase += 0.028 + baseIntensity * 0.07;

    // --- 1. Draw Central Glowing Core & Radial Aura ---
    const glowRadius = Math.min(width, height) * (0.28 + this.smoothedBass * 0.35);
    const radialGlow = ctx.createRadialGradient(
      width / 2,
      centerY,
      5,
      width / 2,
      centerY,
      glowRadius
    );
    const glowColor = this.isSpeaking
      ? 'rgba(0, 242, 254, '
      : this.isUserSpeaking
        ? 'rgba(245, 158, 11, '
        : 'rgba(56, 189, 248, ';
    radialGlow.addColorStop(0, `${glowColor}${0.28 + this.smoothedVolume * 0.4})`);
    radialGlow.addColorStop(0.4, `${glowColor}${0.12 + this.smoothedVolume * 0.2})`);
    radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.save();
    ctx.fillStyle = radialGlow;
    ctx.beginPath();
    ctx.arc(width / 2, centerY, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- 2. Draw Ambient Floating Particles ---
    this.renderParticles(ctx, width, height, centerY, baseIntensity);

    // --- 3. Draw Multi-Layered Neon Waves ---
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    // Wave 1: Neon Cyan Ribbon (Leading Voice Formant)
    this.drawNeonWaveLine(ctx, {
      width,
      centerY,
      amplitude: finalAmplitude * 1.15,
      frequency: 0.012 + this.smoothedMid * 0.008,
      phase: this.phase,
      color: '#00f2fe',
      glowColor: 'rgba(0, 242, 254, 0.85)',
      glowBlur: 24,
      lineWidth: 3.2 + this.smoothedBass * 2.5,
      harmonics: 2.2,
      harmonicAmp: 0.35 + this.smoothedTreble * 0.45,
    });

    // Wave 2: Radiant Golden / Amber Ribbon (Warm Vocal Harmonic)
    this.drawNeonWaveLine(ctx, {
      width,
      centerY,
      amplitude: finalAmplitude * 0.85,
      frequency: 0.016 + this.smoothedBass * 0.006,
      phase: -this.phase * 1.15 + 1.2,
      color: '#ffd700',
      glowColor: 'rgba(255, 215, 0, 0.85)',
      glowBlur: 20,
      lineWidth: 2.6 + this.smoothedMid * 2.0,
      harmonics: 3.1,
      harmonicAmp: 0.4,
    });

    // Wave 3: Neon Magenta / Electric Violet Ribbon (Deep Resonance)
    this.drawNeonWaveLine(ctx, {
      width,
      centerY,
      amplitude: finalAmplitude * 0.7,
      frequency: 0.009 + this.smoothedTreble * 0.009,
      phase: this.phase * 0.85 + 2.4,
      color: '#d946ef',
      glowColor: 'rgba(217, 70, 239, 0.8)',
      glowBlur: 18,
      lineWidth: 2.4 + this.smoothedTreble * 2.0,
      harmonics: 1.8,
      harmonicAmp: 0.5,
    });

    // Wave 4: Emerald Green / Cyan Secondary Pulse Ribbon
    this.drawNeonWaveLine(ctx, {
      width,
      centerY,
      amplitude: finalAmplitude * 0.55,
      frequency: 0.019,
      phase: -this.phase * 1.35 + 3.6,
      color: '#10b981',
      glowColor: 'rgba(16, 185, 129, 0.75)',
      glowBlur: 16,
      lineWidth: 2.0,
      harmonics: 4.2,
      harmonicAmp: 0.3,
    });

    // Wave 5: Ultra-Fine White-Hot Core Wave (Center Precision Filament)
    this.drawNeonWaveLine(ctx, {
      width,
      centerY,
      amplitude: finalAmplitude * 0.95,
      frequency: 0.014 + this.smoothedMid * 0.01,
      phase: this.phase * 1.05 + 0.4,
      color: '#ffffff',
      glowColor: 'rgba(255, 255, 255, 0.95)',
      glowBlur: 12,
      lineWidth: 1.6,
      harmonics: 2.8,
      harmonicAmp: 0.25,
    });

    ctx.restore();
  }

  private drawNeonWaveLine(
    ctx: CanvasRenderingContext2D,
    config: {
      width: number;
      centerY: number;
      amplitude: number;
      frequency: number;
      phase: number;
      color: string;
      glowColor: string;
      glowBlur: number;
      lineWidth: number;
      harmonics: number;
      harmonicAmp: number;
    }
  ) {
    const { width, centerY, amplitude, frequency, phase, color, glowColor, glowBlur, lineWidth, harmonics, harmonicAmp } = config;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = 'transparent';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = glowBlur;

    ctx.beginPath();
    const step = 4;
    const halfWidth = width / 2;

    for (let x = 0; x <= width; x += step) {
      // Natural Gaussian taper towards edges so wave starts and ends smoothly at center baseline
      const normalizedDist = (x - halfWidth) / halfWidth;
      const envelope = Math.exp(-Math.pow(normalizedDist * 2.2, 2));

      // Primary sine + secondary harmonic ripple
      const primarySin = Math.sin(x * frequency + phase);
      const harmonicSin = Math.sin(x * frequency * harmonics + phase * 1.6);
      const yOffset = (primarySin + harmonicSin * harmonicAmp) * amplitude * envelope;

      const y = centerY + yOffset;

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
    ctx.restore();
  }

  private renderParticles(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    centerY: number,
    baseIntensity: number
  ) {
    ctx.save();
    for (const p of this.particles) {
      p.x += p.vx * (1 + baseIntensity * 3.5);
      p.y += p.vy * (1 + baseIntensity * 3.5);
      p.life++;

      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;
      if (p.y < centerY - 120) p.y = centerY + 120;
      if (p.y > centerY + 120) p.y = centerY - 120;

      if (p.life > p.maxLife) {
        p.life = 0;
        p.x = width / 2 + (Math.random() - 0.5) * (width * 0.6);
        p.y = centerY + (Math.random() - 0.5) * 80;
      }

      const progress = p.life / p.maxLife;
      const currentAlpha = p.alpha * Math.sin(progress * Math.PI) * (0.6 + baseIntensity * 1.5);

      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, Math.min(1, currentAlpha));
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 + baseIntensity * 0.8), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  render() {
    const isSpeakingNow = this.isSpeaking;
    const isUserSpeakingNow = this.isUserSpeaking;

    return html`
      <div class="visualizer-wrapper" id="neonVisualizerWrapper">
        <canvas id="neonWaveCanvas"></canvas>

        <div
          class="wave-status-pill ${isSpeakingNow ? 'speaking' : isUserSpeakingNow ? 'user-speaking' : ''}"
          id="waveStatusPill">
          <div
            class="pulse-neon-dot ${isSpeakingNow ? '' : isUserSpeakingNow ? 'amber' : 'green'}"></div>
          <span>
            ${isSpeakingNow
        ? '🎙️ در حال گفتگوی هوشمند...'
        : isUserSpeakingNow
          ? '🎧 در حال شنیدن صدای شما...'
          : this.isConnected
            ? '✨ آماده مکالمه صوتی'
            : 'اتصال صوتی برقرار نیست'}
          </span>
        </div>
      </div>
    `;
  }
}
