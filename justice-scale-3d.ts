import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import * as THREE from 'three';

/**
 * 3D Realistic Scale of Justice (ترازوی عدالت سه‌بعدی)
 * Pure, elegant, physical representation of justice and equilibrium.
 * Dynamically reacts to user voice, AI counsel speech, and cognitive deliberation states.
 */
@customElement('justice-scale-3d')
export class JusticeScale3D extends LitElement {
  @property({ type: Boolean })
  isSpeaking = false;

  @property({ type: Boolean })
  isUserSpeaking = false;

  @property({ type: Boolean })
  isThinking = false;

  @property({ type: Boolean })
  connected = false;

  @property({ type: String })
  currentTone = 'formal';

  @property({ type: String })
  transcriptText = '';

  @property({ type: Object })
  outputNode: AudioNode | null = null;

  @property({ type: Object })
  inputNode: AudioNode | null = null;

  private outputAnalyser: AnalyserNode | null = null;
  private inputAnalyser: AnalyserNode | null = null;
  private outputData: Uint8Array | null = null;
  private inputData: Uint8Array | null = null;
  private smoothedAudioLevel = 0;

  static styles = css`
    :host {
      display: block;
      position: absolute;
      inset: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 5;
      overflow: hidden;
    }

    .canvas-container {
      width: 100%;
      height: 100%;
      pointer-events: none;
      position: relative;
    }

    canvas {
      width: 100%;
      height: 100%;
      display: block;
      outline: none;
      pointer-events: auto;
      cursor: default;
    }
  `;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;

  // Scale of Justice Structure
  private scaleGroup = new THREE.Group();
  private balanceArmGroup = new THREE.Group();
  private leftPanGroup = new THREE.Group();
  private rightPanGroup = new THREE.Group();
  private needlePointer!: THREE.Mesh;
  private shadowMesh!: THREE.Mesh;

  // Animation Timers & Physics
  private animationFrameId = 0;
  private clock = new THREE.Clock();
  private mouseX = 0;
  private mouseY = 0;
  private targetMouseX = 0;
  private targetMouseY = 0;

  // Dynamic beam angle and angular physics
  private beamAngle = 0;
  private targetBeamAngle = 0;
  private beamVelocity = 0;

  firstUpdated() {
    this.initScene();
    this.setupAudioAnalysers();
    window.addEventListener('mousemove', this.onMouseMove, { passive: true });
  }

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('outputNode') || changedProperties.has('inputNode')) {
      this.setupAudioAnalysers();
    }
  }

  private setupAudioAnalysers() {
    if (this.outputNode && !this.outputAnalyser) {
      try {
        const audioCtx = this.outputNode.context;
        this.outputAnalyser = audioCtx.createAnalyser();
        this.outputAnalyser.fftSize = 64;
        this.outputAnalyser.smoothingTimeConstant = 0.65;
        this.outputNode.connect(this.outputAnalyser);
        this.outputData = new Uint8Array(this.outputAnalyser.frequencyBinCount);
      } catch (e) {
        console.warn('JusticeScale3D output analyser notice:', e);
      }
    }

    if (this.inputNode && !this.inputAnalyser) {
      try {
        const audioCtx = this.inputNode.context;
        this.inputAnalyser = audioCtx.createAnalyser();
        this.inputAnalyser.fftSize = 64;
        this.inputAnalyser.smoothingTimeConstant = 0.65;
        this.inputNode.connect(this.inputAnalyser);
        this.inputData = new Uint8Array(this.inputAnalyser.frequencyBinCount);
      } catch (e) {
        console.warn('JusticeScale3D input analyser notice:', e);
      }
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.renderer?.dispose();
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('mousemove', this.onMouseMove);
  }

  private onMouseMove = (event: MouseEvent) => {
    this.targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
    this.targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  private initScene() {
    const canvas = this.shadowRoot?.querySelector('#scaleCanvas') as HTMLCanvasElement;
    if (!canvas) return;

    this.scene = new THREE.Scene();

    // Perspective Camera focusing cleanly on the centered Scale of Justice
    this.camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 50);
    this.camera.position.set(0, 0.05, 3.8);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;

    // --- REFINED LIGHTING HIGHLIGHTING METALLIC CRAFTSMANSHIP ---
    const ambientLight = new THREE.AmbientLight(0xfff8ee, 1.4);
    this.scene.add(ambientLight);

    // Warm Key Light
    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.6);
    keyLight.position.set(3, 4, 3.5);
    this.scene.add(keyLight);

    // Soft Cool Fill Light for metallic rim definition
    const fillLight = new THREE.DirectionalLight(0xe0f2fe, 1.2);
    fillLight.position.set(-3.5, 2, 2.5);
    this.scene.add(fillLight);

    // Back Top Rim Light highlighting the balance beam and pan edges
    const rimLight = new THREE.DirectionalLight(0xffedd5, 1.8);
    rimLight.position.set(0, 3, -2);
    this.scene.add(rimLight);

    // Build the 3D Scale of Justice
    this.buildScaleOfJustice();
    this.scene.add(this.scaleGroup);

    window.addEventListener('resize', this.onWindowResize);
    this.animateScene();
  }

  private buildScaleOfJustice() {
    // Premium Metallic PBR Materials
    const polishedGoldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.22,
      metalness: 0.94,
    });

    const warmBrassMat = new THREE.MeshStandardMaterial({
      color: 0xc8963e,
      roughness: 0.32,
      metalness: 0.88,
    });

    const darkBronzeMat = new THREE.MeshStandardMaterial({
      color: 0x5c4033,
      roughness: 0.45,
      metalness: 0.8,
    });

    // 1. Base Structure (tiered circular pedestal)
    const baseGroup = new THREE.Group();
    baseGroup.position.set(0, -0.92, 0);

    const baseTier1 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.62, 0.08, 48),
      darkBronzeMat
    );
    const baseTier2 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.46, 0.52, 0.06, 48),
      polishedGoldMat
    );
    baseTier2.position.y = 0.07;
    const baseTier3 = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.42, 0.05, 48),
      warmBrassMat
    );
    baseTier3.position.y = 0.125;
    const baseCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.22, 0.06, 32),
      polishedGoldMat
    );
    baseCollar.position.y = 0.18;

    baseGroup.add(baseTier1, baseTier2, baseTier3, baseCollar);
    this.scaleGroup.add(baseGroup);

    // 2. Soft Contact Drop Shadow on the floor
    const shadowGeo = new THREE.PlaneGeometry(1.6, 1.6);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.15,
    });
    this.shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowMesh.rotation.x = -Math.PI / 2;
    this.shadowMesh.position.set(0, -0.96, 0);
    this.scaleGroup.add(this.shadowMesh);

    // 3. Central Vertical Column (Fluted Pillar)
    const pillarGroup = new THREE.Group();
    pillarGroup.position.set(0, -0.92 + 0.21, 0);

    const lowerShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.11, 0.35, 32),
      polishedGoldMat
    );
    lowerShaft.position.y = 0.175;

    const midRing = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.022, 16, 32), polishedGoldMat);
    midRing.rotation.x = Math.PI / 2;
    midRing.position.y = 0.36;

    const mainPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.078, 1.05, 32),
      warmBrassMat
    );
    mainPillar.position.y = 0.9;

    const upperRing = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.02, 16, 32), polishedGoldMat);
    upperRing.rotation.x = Math.PI / 2;
    upperRing.position.y = 1.44;

    const fulcrumBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.075, 0.16, 32),
      polishedGoldMat
    );
    fulcrumBase.position.y = 1.52;

    pillarGroup.add(lowerShaft, midRing, mainPillar, upperRing, fulcrumBase);
    this.scaleGroup.add(pillarGroup);

    // 4. Central Fulcrum Finial & Crown atop the pillar
    const fulcrumY = -0.92 + 0.21 + 1.6;
    const fulcrumTop = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 24), polishedGoldMat);
    fulcrumTop.position.set(0, fulcrumY + 0.06, 0);

    const finialSpire = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.22, 24), polishedGoldMat);
    finialSpire.position.set(0, fulcrumY + 0.22, 0);

    this.scaleGroup.add(fulcrumTop, finialSpire);

    // 5. Balance Arm (شاهین ترازو) - Pivots around fulcrum
    this.balanceArmGroup.position.set(0, fulcrumY, 0);

    // Central pivot cylinder
    const pivotPin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.14, 24),
      polishedGoldMat
    );
    pivotPin.rotation.x = Math.PI / 2;
    this.balanceArmGroup.add(pivotPin);

    // Center equilibrium pointer (عقربه نشانگر تعادل)
    const needleGeo = new THREE.ConeGeometry(0.02, 0.36, 16);
    this.needlePointer = new THREE.Mesh(needleGeo, polishedGoldMat);
    this.needlePointer.position.set(0, -0.18, 0.06);
    this.needlePointer.rotation.z = Math.PI;
    this.balanceArmGroup.add(this.needlePointer);

    // Horizontal Balance Beams (tapered and arched)
    const armHalfLength = 0.95;

    const leftArmGeo = new THREE.CylinderGeometry(0.02, 0.045, armHalfLength, 20);
    leftArmGeo.rotateZ(Math.PI / 2);
    leftArmGeo.translate(-armHalfLength / 2, 0, 0);
    const leftArm = new THREE.Mesh(leftArmGeo, polishedGoldMat);

    const rightArmGeo = new THREE.CylinderGeometry(0.045, 0.02, armHalfLength, 20);
    rightArmGeo.rotateZ(Math.PI / 2);
    rightArmGeo.translate(armHalfLength / 2, 0, 0);
    const rightArm = new THREE.Mesh(rightArmGeo, polishedGoldMat);

    // Decorative Beam Finials & End Hooks
    const leftHookBall = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 16), polishedGoldMat);
    leftHookBall.position.set(-armHalfLength, 0, 0);

    const rightHookBall = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 16), polishedGoldMat);
    rightHookBall.position.set(armHalfLength, 0, 0);

    const hookRingGeo = new THREE.TorusGeometry(0.035, 0.008, 12, 24);
    const leftHookRing = new THREE.Mesh(hookRingGeo, polishedGoldMat);
    leftHookRing.position.set(-armHalfLength, -0.04, 0);

    const rightHookRing = new THREE.Mesh(hookRingGeo, polishedGoldMat);
    rightHookRing.position.set(armHalfLength, -0.04, 0);

    this.balanceArmGroup.add(
      leftArm,
      rightArm,
      leftHookBall,
      rightHookBall,
      leftHookRing,
      rightHookRing
    );

    // 6. Suspended Weighing Pans (کفه‌های ترازو)
    const createSuspendedPan = (isLeft: boolean) => {
      const panContainer = new THREE.Group();
      panContainer.position.set(isLeft ? -armHalfLength : armHalfLength, -0.05, 0);

      const chainLength = 0.65;
      const panRadius = 0.32;
      const panDepth = 0.12;

      // 3 suspension cords/chains
      const chainMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        roughness: 0.3,
        metalness: 0.9,
      });

      const cordAngles = [0, (Math.PI * 2) / 3, (Math.PI * 4) / 3];
      cordAngles.forEach((angle) => {
        const rimX = Math.cos(angle) * (panRadius * 0.92);
        const rimZ = Math.sin(angle) * (panRadius * 0.92);

        const cordGeo = new THREE.CylinderGeometry(0.0045, 0.0045, chainLength, 8);
        const cordMesh = new THREE.Mesh(cordGeo, chainMat);

        // Position cord midpoint and angle toward rim
        cordMesh.position.set(rimX / 2, -chainLength / 2, rimZ / 2);

        // Compute orientation toward attachment point
        const dir = new THREE.Vector3(rimX, -chainLength, rimZ).normalize();
        const axis = new THREE.Vector3(0, 1, 0).cross(dir).normalize();
        const quat = new THREE.Quaternion().setFromAxisAngle(
          axis,
          Math.acos(new THREE.Vector3(0, 1, 0).dot(dir))
        );
        cordMesh.quaternion.copy(quat);

        panContainer.add(cordMesh);
      });

      // Weighing Bowl (کفه عمیق و زیبا)
      const bowlGeo = new THREE.SphereGeometry(
        panRadius,
        32,
        18,
        0,
        Math.PI * 2,
        Math.PI / 2 + 0.18,
        Math.PI / 2 - 0.18
      );
      const bowlMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        roughness: 0.22,
        metalness: 0.95,
        side: THREE.DoubleSide,
      });
      const bowlMesh = new THREE.Mesh(bowlGeo, bowlMat);
      bowlMesh.position.set(0, -chainLength, 0);

      // Polished rim ring on pan
      const rimTorus = new THREE.Mesh(
        new THREE.TorusGeometry(panRadius * 0.92, 0.012, 12, 32),
        polishedGoldMat
      );
      rimTorus.rotation.x = Math.PI / 2;
      rimTorus.position.set(0, -chainLength, 0);

      panContainer.add(bowlMesh, rimTorus);
      return panContainer;
    };

    this.leftPanGroup = createSuspendedPan(true);
    this.rightPanGroup = createSuspendedPan(false);

    this.balanceArmGroup.add(this.leftPanGroup, this.rightPanGroup);
    this.scaleGroup.add(this.balanceArmGroup);

    // Initial scale placement
    this.scaleGroup.position.set(0, 0, 0);
  }

  private onWindowResize = () => {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  private animateScene = () => {
    this.animationFrameId = requestAnimationFrame(this.animateScene);

    const time = this.clock.getElapsedTime();

    // 1. Acoustic Frequency & Amplitude Analysis
    let rawAudioLevel = 0;
    if (this.outputAnalyser && this.outputData && this.isSpeaking) {
      this.outputAnalyser.getByteFrequencyData(this.outputData);
      let sum = 0;
      for (let i = 0; i < this.outputData.length; i++) sum += this.outputData[i];
      rawAudioLevel = sum / (this.outputData.length * 255);
    } else if (this.inputAnalyser && this.inputData && this.isUserSpeaking) {
      this.inputAnalyser.getByteFrequencyData(this.inputData);
      let sum = 0;
      for (let i = 0; i < this.inputData.length; i++) sum += this.inputData[i];
      rawAudioLevel = (sum / (this.inputData.length * 255)) * 0.85;
    }

    const attackFactor = this.isSpeaking || this.isUserSpeaking ? 0.35 : 0.08;
    this.smoothedAudioLevel += (rawAudioLevel - this.smoothedAudioLevel) * attackFactor;

    // 2. Smooth Mouse Tracking for Gentle Parallax
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.04;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.04;

    // 3. Physical Weighing Balance Dynamics (شاهین و کفه‌ها)
    // - Idle state: serene, dignified harmonic equilibrium sway
    // - User speaking: evidence and claims weigh on the user's pan (left pan dips slightly)
    // - AI Counsel speaking: legal authority and rationale tilt the right pan, oscillating rhythmically with speech
    // - Thinking state: slow contemplative oscillation seeking balance between law and fact
    let naturalTilt = 0;

    if (this.isSpeaking) {
      // AI Counsel speaking: slight tilt to right pan with speech cadence oscillations
      const speechFluctuation = Math.sin(time * 3.5) * 0.06 + Math.sin(time * 7.2) * 0.03;
      naturalTilt = 0.09 + speechFluctuation * (0.5 + this.smoothedAudioLevel * 1.5);
    } else if (this.isUserSpeaking) {
      // User presenting facts: left pan dips thoughtfully under the weight of the client's testimony
      const userFluctuation = Math.sin(time * 2.8) * 0.05;
      naturalTilt = -0.11 + userFluctuation * (0.5 + this.smoothedAudioLevel * 1.2);
    } else if (this.isThinking) {
      // Judicial deliberation: weighing alternatives smoothly back and forth
      naturalTilt = Math.sin(time * 1.8) * 0.07;
    } else {
      // Living equilibrium breathing
      naturalTilt = Math.sin(time * 0.9) * 0.025;
    }

    this.targetBeamAngle = naturalTilt;

    // Spring-damper physics for realistic balance inertia
    const springForce = (this.targetBeamAngle - this.beamAngle) * 6.5;
    this.beamVelocity += springForce * 0.016;
    this.beamVelocity *= 0.92; // damping
    this.beamAngle += this.beamVelocity;

    // Apply beam rotation
    this.balanceArmGroup.rotation.z = this.beamAngle;

    // Keep suspended pans hanging vertically due to gravity (counter-rotate)
    this.leftPanGroup.rotation.z = -this.beamAngle * 0.95;
    this.rightPanGroup.rotation.z = -this.beamAngle * 0.95;

    // Gentle pan swing inertia
    const panSway = Math.sin(time * 2.1) * (0.01 + this.smoothedAudioLevel * 0.02);
    this.leftPanGroup.rotation.x = panSway;
    this.rightPanGroup.rotation.x = -panSway;

    // 4. Subtle 3D Stage Parallax & Breathing Rotation
    this.scaleGroup.rotation.y = THREE.MathUtils.lerp(
      this.scaleGroup.rotation.y,
      this.mouseX * 0.22 + Math.sin(time * 0.4) * 0.04,
      0.05
    );
    this.scaleGroup.rotation.x = THREE.MathUtils.lerp(
      this.scaleGroup.rotation.x,
      -this.mouseY * 0.12,
      0.05
    );

    // Subtle breathing float on vertical axis
    this.scaleGroup.position.y = Math.sin(time * 1.2) * 0.018;

    this.renderer.render(this.scene, this.camera);
  };

  render() {
    return html`
      <div class="canvas-container">
        <canvas id="scaleCanvas"></canvas>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'justice-scale-3d': JusticeScale3D;
  }
}
