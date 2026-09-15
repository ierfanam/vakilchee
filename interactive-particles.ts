/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Particle {
  originX: number;
  originY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  color: string;
  wanderAngle: number;
  wanderSpeed: number;
}

export class RepulsionParticleSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private width = 0;
  private height = 0;
  private dpr = 1;
  private animId = 0;
  private isRunning = false;

  // Pointer state (mouse / touch)
  private pointerX = -9999;
  private pointerY = -9999;
  private targetPointerX = -9999;
  private targetPointerY = -9999;
  private pointerRadius = 175; // Default radius of repulsive influence
  private isPointerActive = false;
  private pointerStrength = 3.8;
  private lastMoveTime = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false }) || canvas.getContext('2d')!;
    this.initEvents();
    this.resize();
  }

  private initEvents() {
    const onPointerMove = (clientX: number, clientY: number, forceRadius?: number) => {
      const rect = this.canvas.getBoundingClientRect();
      this.targetPointerX = clientX - rect.left;
      this.targetPointerY = clientY - rect.top;
      this.isPointerActive = true;
      this.lastMoveTime = performance.now();
      if (forceRadius) {
        this.pointerRadius = forceRadius;
      }
    };

    window.addEventListener(
      'mousemove',
      (e: MouseEvent) => {
        onPointerMove(e.clientX, e.clientY, 175);
      },
      { passive: true }
    );

    window.addEventListener('mouseleave', () => {
      this.isPointerActive = false;
      this.targetPointerX = -9999;
      this.targetPointerY = -9999;
    });

    window.addEventListener(
      'touchstart',
      (e: TouchEvent) => {
        if (e.touches.length > 0) {
          const touch = e.touches[0];
          onPointerMove(touch.clientX, touch.clientY, 210);
        }
      },
      { passive: true }
    );

    window.addEventListener(
      'touchmove',
      (e: TouchEvent) => {
        if (e.touches.length > 0) {
          const touch = e.touches[0];
          onPointerMove(touch.clientX, touch.clientY, 210);
        }
      },
      { passive: true }
    );

    window.addEventListener('touchend', () => {
      this.isPointerActive = false;
      this.targetPointerX = -9999;
      this.targetPointerY = -9999;
    });

    window.addEventListener('resize', () => this.resize(), { passive: true });
  }

  public resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.initParticles();
  }

  private initParticles() {
    this.particles = [];
    // Target precisely 7,000 ultra-fine micro-particles as requested
    const targetCount = 7000;

    const cols = Math.ceil(Math.sqrt((targetCount * this.width) / this.height));
    const rows = Math.ceil(targetCount / cols);
    const cellW = this.width / cols;
    const cellH = this.height / rows;

    // Palette of refined, high-resolution micro-particles on white background
    const colors = [
      'rgba(15, 23, 42, 0.45)', // Deep Slate
      'rgba(30, 41, 59, 0.38)', // Slate
      'rgba(51, 65, 85, 0.32)', // Cool Gray
      'rgba(2, 132, 199, 0.50)', // Electric Blue Accent
      'rgba(14, 165, 233, 0.42)', // Vivid Cyan
      'rgba(20, 184, 166, 0.35)', // Teal Accent
      'rgba(71, 85, 105, 0.28)', // Light Slate
    ];

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        // Organic jitter inside cell
        const originX = (i + 0.15 + Math.random() * 0.7) * cellW;
        const originY = (j + 0.15 + Math.random() * 0.7) * cellH;

        // Random micro size (0.65px to 1.5px) for 7000 high-density particles
        const sizeRand = Math.random();
        const size = sizeRand < 0.7 ? 0.7 + Math.random() * 0.35 : 1.05 + Math.random() * 0.45;
        const color = colors[Math.floor(Math.random() * colors.length)];

        this.particles.push({
          originX,
          originY,
          x: originX + (Math.random() - 0.5) * 4,
          y: originY + (Math.random() - 0.5) * 4,
          vx: 0,
          vy: 0,
          size,
          baseAlpha: 0.3 + Math.random() * 0.4,
          color,
          wanderAngle: Math.random() * Math.PI * 2,
          wanderSpeed: 0.08 + Math.random() * 0.12,
        });
      }
    }
  }

  public start() {
    if (!this.isRunning) {
      this.isRunning = true;
      this.animate();
    }
  }

  public stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animId);
  }

  private animate = () => {
    if (!this.isRunning) return;

    // Smooth pointer interpolation
    if (this.isPointerActive) {
      this.pointerX += (this.targetPointerX - this.pointerX) * 0.28;
      this.pointerY += (this.targetPointerY - this.pointerY) * 0.28;
    } else {
      this.pointerX = -9999;
      this.pointerY = -9999;
    }

    const ctx = this.ctx;
    const dpr = this.dpr;
    const width = this.width;
    const height = this.height;

    // Clear background with crisp pristine white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width * dpr, height * dpr);

    const pr = this.pointerRadius;
    const prSq = pr * pr;
    const px = this.pointerX;
    const py = this.pointerY;
    const hasPointer = px > -1000 && py > -1000;
    const pStrength = this.pointerStrength;

    const len = this.particles.length;
    for (let i = 0; i < len; i++) {
      const p = this.particles[i];

      // 1. Ambient gentle micro-wander
      p.wanderAngle += (Math.random() - 0.5) * 0.1;
      const wanderX = Math.cos(p.wanderAngle) * p.wanderSpeed;
      const wanderY = Math.sin(p.wanderAngle) * p.wanderSpeed;

      // 2. Cursor / Finger Repulsion Physics
      if (hasPointer) {
        const dx = p.x - px;
        const dy = p.y - py;
        const distSq = dx * dx + dy * dy;

        if (distSq < prSq && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          // Normalized distance from center (0 at cursor, 1 at edge)
          const normDist = dist / pr;

          // Repulsion force: non-linear inverse power, significantly stronger at the center!
          // (1 - normDist)^2.4 gives extreme repulsion right under the cursor and smooth decay
          const forceFactor = Math.pow(1.0 - normDist, 2.4) * pStrength;

          const angle = Math.atan2(dy, dx);
          p.vx += Math.cos(angle) * forceFactor * 1.8;
          p.vy += Math.sin(angle) * forceFactor * 1.8;
        }
      }

      // 3. Spring Restitution Force (Pull back to origin)
      const springX = (p.originX - p.x) * 0.042;
      const springY = (p.originY - p.y) * 0.042;
      p.vx += springX + wanderX * 0.1;
      p.vy += springY + wanderY * 0.1;

      // 4. Air Resistance / Damping
      p.vx *= 0.88;
      p.vy *= 0.88;

      // 5. Position update
      p.x += p.vx;
      p.y += p.vy;

      // 6. Draw micro-particle
      const renderX = p.x * dpr;
      const renderY = p.y * dpr;
      const r = p.size * dpr;

      ctx.beginPath();
      ctx.arc(renderX, renderY, r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }

    this.animId = requestAnimationFrame(this.animate);
  };
}
