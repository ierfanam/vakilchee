/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LitElement, css, html } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('dynamic-audio-visualizer')
export class DynamicAudioVisualizer extends LitElement {
  @property({ type: Object })
  outputNode: AudioNode | null = null;

  @property({ type: Object })
  inputNode: AudioNode | null = null;

  @property({ type: Boolean })
  isSpeaking = false;

  @property({ type: Boolean })
  isUserSpeaking = false;

  @state()
  private currentPeakHz = 0;

  @state()
  private currentIntensityPercent = 0;

  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;

  private outputAnalyser: AnalyserNode | null = null;
  private inputAnalyser: AnalyserNode | null = null;

  private outputFreqData: Uint8Array | null = null;
  private outputTimeData: Uint8Array | null = null;
  private inputFreqData: Uint8Array | null = null;
  private inputTimeData: Uint8Array | null = null;

  private smoothedVolume = 0;
  private smoothedBass = 0;
  private smoothedMid = 0;
  private smoothedTreble = 0;
  private smoothedSpectrum: number[] = new Array(24).fill(0);

  private phase = 0;
  private resizeObserver: ResizeObserver | null = null;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      max-width: 640px;
      margin: 0 auto;
      pointer-events: none;
      user-select: none;
      direction: rtl;
      font-family: 'Courier Prime', 'Courier New', monospace, 'Vazirmatn' !important;
      font-weight: 300 !important;
      z-index: 50;
    }

    .visualizer-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      padding: 8px 12px;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
    }

    .spectrum-canvas-wrapper {
      position: relative;
      width: 100%;
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    canvas {
      width: 100%;
      height: 100%;
      display: block;
      background: transparent;
    }

    .metrics-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      max-width: 520px;
      font-size: 11px;
      color: #000000;
      opacity: 0.85;
      padding: 0 4px;
      gap: 12px;
    }

    .metric-group {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .metric-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      display: inline-block;
      transition: background-color 0.3s ease;
    }

    .metric-dot.lawyer {
      background-color: #0284c7;
      box-shadow: 0 0 6px rgba(2, 132, 199, 0.6);
    }

    .metric-dot.user {
      background-color: #16a34a;
      box-shadow: 0 0 6px rgba(22, 163, 74, 0.6);
    }

    .metric-dot.idle {
      background-color: #94a3b8;
    }

    .metric-value {
      font-family: monospace, 'Courier Prime', sans-serif;
      font-size: 11.5px;
      font-weight: 400;
      letter-spacing: 0.5px;
    }

    .intensity-progress-track {
      width: 70px;
      height: 3px;
      background: rgba(0, 0, 0, 0.08);
      border-radius: 2px;
      overflow: hidden;
      display: inline-flex;
    }

    .intensity-progress-fill {
      height: 100%;
      background: #000000;
      transition: width 0.08s ease;
    }

    @media (max-width: 640px) {
      .spectrum-canvas-wrapper {
        height: 55px;
      }
      .metrics-bar {
        font-size: 10px;
        gap: 6px;
      }
      .intensity-progress-track {
        width: 45px;
      }
    }
  `;

  firstUpdated() {
    this.canvas = this.shadowRoot?.querySelector('#spectrumCanvas') as HTMLCanvasElement;
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.setupResizeObserver();
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
    const width = Math.max(260, rect.width || 500);
    const height = 70;

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
        this.outputAnalyser.fftSize = 128;
        this.outputAnalyser.smoothingTimeConstant = 0.75;
        this.outputNode.connect(this.outputAnalyser);

        const bufferLength = this.outputAnalyser.frequencyBinCount;
        this.outputFreqData = new Uint8Array(bufferLength);
        this.outputTimeData = new Uint8Array(bufferLength);
      } catch (e) {
        console.warn('DynamicAudioVisualizer output analyser init notice:', e);
      }
    }

    if (this.inputNode && !this.inputAnalyser) {
      try {
        const audioCtx = this.inputNode.context;
        this.inputAnalyser = audioCtx.createAnalyser();
        this.inputAnalyser.fftSize = 128;
        this.inputAnalyser.smoothingTimeConstant = 0.75;
        this.inputNode.connect(this.inputAnalyser);

        const bufferLength = this.inputAnalyser.frequencyBinCount;
        this.inputFreqData = new Uint8Array(bufferLength);
        this.inputTimeData = new Uint8Array(bufferLength);
      } catch (e) {
        console.warn('DynamicAudioVisualizer input analyser init notice:', e);
      }
    }
  }

  private startAnimation() {
    let lastMetricUpdateTime = 0;

    const loop = (timestamp: number) => {
      this.renderVisualizer();

      if (timestamp - lastMetricUpdateTime > 120) {
        lastMetricUpdateTime = timestamp;
        this.updateMetrics();
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  private updateMetrics() {
    this.currentIntensityPercent = Math.min(100, Math.round(this.smoothedVolume * 100));

    // Estimate dominant frequency in Hz
    const nyquist = 12000;
    const maxBandIdx = this.smoothedSpectrum.indexOf(Math.max(...this.smoothedSpectrum));
    const estimatedHz = Math.round(
      ((maxBandIdx + 1) / this.smoothedSpectrum.length) * (nyquist / 3)
    );
    this.currentPeakHz = this.smoothedVolume > 0.05 ? Math.max(80, estimatedHz) : 0;
  }

  private renderVisualizer() {
    if (!this.canvas || !this.ctx) return;
    const ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const width = this.canvas.width / dpr;
    const height = this.canvas.height / dpr;
    const centerY = height / 2;

    ctx.clearRect(0, 0, width, height);

    let rawVolume = 0;
    let rawBass = 0;
    let rawMid = 0;
    let rawTreble = 0;
    const rawBands: number[] = new Array(24).fill(0);

    const isOutputActive = this.outputAnalyser && this.outputFreqData && this.isSpeaking;
    const isInputActive = this.inputAnalyser && this.inputFreqData && this.isUserSpeaking;

    if (this.outputAnalyser && this.outputFreqData && this.outputTimeData) {
      this.outputAnalyser.getByteFrequencyData(this.outputFreqData);
      this.outputAnalyser.getByteTimeDomainData(this.outputTimeData);

      if (this.isSpeaking) {
        let sum = 0;
        const len = this.outputFreqData.length;
        for (let i = 0; i < len; i++) sum += this.outputFreqData[i];
        rawVolume = sum / (len * 255);

        // Group into 24 frequency bands
        const step = Math.floor(len / 24) || 1;
        for (let b = 0; b < 24; b++) {
          let bandSum = 0;
          for (let s = 0; s < step; s++) {
            const idx = Math.min(len - 1, b * step + s);
            bandSum += this.outputFreqData[idx];
          }
          rawBands[b] = bandSum / (step * 255);
        }

        // Bass, Mids, Treble
        rawBass = (rawBands[0] + rawBands[1] + rawBands[2] + rawBands[3]) / 4;
        rawMid =
          (rawBands[4] + rawBands[5] + rawBands[6] + rawBands[7] + rawBands[8] + rawBands[9]) / 6;
        rawTreble = (rawBands[10] + rawBands[11] + rawBands[12] + rawBands[13] + rawBands[14]) / 5;
      }
    }

    if (this.inputAnalyser && this.inputFreqData && this.inputTimeData) {
      this.inputAnalyser.getByteFrequencyData(this.inputFreqData);
      this.inputAnalyser.getByteTimeDomainData(this.inputTimeData);

      if (this.isUserSpeaking) {
        let userSum = 0;
        const len = this.inputFreqData.length;
        for (let i = 0; i < len; i++) userSum += this.inputFreqData[i];
        const userVol = userSum / (len * 255);

        if (userVol > 0.02) {
          rawVolume = Math.max(rawVolume, userVol * 1.3);
          const step = Math.floor(len / 24) || 1;
          for (let b = 0; b < 24; b++) {
            let bandSum = 0;
            for (let s = 0; s < step; s++) {
              const idx = Math.min(len - 1, b * step + s);
              bandSum += this.inputFreqData[idx];
            }
            rawBands[b] = Math.max(rawBands[b], bandSum / (step * 255));
          }
          rawBass = (rawBands[0] + rawBands[1] + rawBands[2] + rawBands[3]) / 4;
          rawMid =
            (rawBands[4] + rawBands[5] + rawBands[6] + rawBands[7] + rawBands[8] + rawBands[9]) / 6;
          rawTreble =
            (rawBands[10] + rawBands[11] + rawBands[12] + rawBands[13] + rawBands[14]) / 5;
        }
      }
    }

    // Smooth values for fluid organic animation
    const smoothing = this.isSpeaking || this.isUserSpeaking ? 0.28 : 0.08;
    this.smoothedVolume += (rawVolume - this.smoothedVolume) * smoothing;
    this.smoothedBass += (rawBass - this.smoothedBass) * smoothing;
    this.smoothedMid += (rawMid - this.smoothedMid) * smoothing;
    this.smoothedTreble += (rawTreble - this.smoothedTreble) * smoothing;

    for (let b = 0; b < 24; b++) {
      this.smoothedSpectrum[b] += (rawBands[b] - this.smoothedSpectrum[b]) * smoothing;
    }

    this.phase += 0.04 + this.smoothedVolume * 0.08;

    // Determine colors
    const activeColor = this.isSpeaking ? '#0284c7' : this.isUserSpeaking ? '#16a34a' : '#64748b';

    // --- 1. Draw Symmetric Frequency Spectrum Bars ---
    const barCount = 24;
    const barWidth = Math.max(3, (width - (barCount - 1) * 3) / barCount);
    const spacing = (width - barCount * barWidth) / (barCount - 1);

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + spacing);
      const intensity = this.smoothedSpectrum[i];
      const minHeight = 4;
      const maxHeight = height * 0.75;
      const barHeight = Math.max(
        minHeight,
        intensity * maxHeight + Math.sin(this.phase + i * 0.3) * 2
      );
      const y = centerY - barHeight / 2;

      // Opacity scales with frequency energy
      const alpha = 0.25 + intensity * 0.75;

      ctx.fillStyle = activeColor;
      ctx.globalAlpha = alpha;

      // Draw rounded bar
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 2, 2]);
      ctx.fill();
    }

    // --- 2. Draw Center Harmonized Waveform Line Overlay ---
    ctx.globalAlpha = 0.85;
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();

    const waveAmp = this.smoothedVolume * 22 + 2;
    const stepX = 4;

    for (let x = 0; x <= width; x += stepX) {
      const normX = (x / width) * 2 - 1;
      const envelope = Math.exp(-normX * normX * 3.0);
      const freqMultiplier = 0.02 + this.smoothedMid * 0.015;
      const yOffset =
        Math.sin(x * freqMultiplier + this.phase) * waveAmp * envelope +
        Math.cos(x * freqMultiplier * 2.2 - this.phase * 1.5) * (waveAmp * 0.4) * envelope;
      const y = centerY + yOffset;

      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    ctx.globalAlpha = 1.0;
  }

  render() {
    const isLawyer = this.isSpeaking;
    const isUser = this.isUserSpeaking;

    const statusText = isLawyer
      ? 'فرکانس و شدت صدای وکیل (خروجی)'
      : isUser
        ? 'فرکانس و شدت صدای کاربر (میکروفون)'
        : 'ویژوالایزر فرکانس و شدت صدا (آماده)';

    return html`
      <div class="visualizer-container" id="dynamicVisualizerContainer">
        <div class="spectrum-canvas-wrapper">
          <canvas id="spectrumCanvas"></canvas>
        </div>

        <div class="metrics-bar">
          <div class="metric-group">
            <span class="metric-dot ${isLawyer ? 'lawyer' : isUser ? 'user' : 'idle'}"></span>
            <span>${statusText}</span>
          </div>

          <div class="metric-group">
            <span>فرکانس غالب:</span>
            <span class="metric-value"
              >${this.currentPeakHz > 0 ? `${this.currentPeakHz} Hz` : '---'}</span
            >
          </div>

          <div class="metric-group">
            <span>شدت:</span>
            <div class="intensity-progress-track">
              <div
                class="intensity-progress-fill"
                style="width: ${this.currentIntensityPercent}%; background: ${isLawyer ? '#0284c7' : isUser ? '#16a34a' : '#94a3b8'};"
              ></div>
            </div>
            <span class="metric-value">${this.currentIntensityPercent}%</span>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'dynamic-audio-visualizer': DynamicAudioVisualizer;
  }
}
