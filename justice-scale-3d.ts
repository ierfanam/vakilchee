import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

@customElement('justice-scale-3d')
export class JusticeScale3D extends LitElement {
  @property({type: Boolean})
  isSpeaking = false;

  @property({type: Boolean})
  isUserSpeaking = false;

  @property({type: Object})
  outputNode: AudioNode | null = null;

  @property({type: Object})
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
      opacity: 1;
      transition: opacity 0.5s ease-in-out;
    }
    canvas {
      width: 100%;
      height: 100%;
      display: block;
      outline: none;
    }
  `;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private avatarGroup = new THREE.Group();
  private headGroup = new THREE.Group();
  private officeEnvironment = new THREE.Group();
  private scaleOfJusticeMini = new THREE.Group();
  private dustParticles: THREE.Points | null = null;
  private teethLowerMesh: THREE.Mesh | null = null;
  private eyelashesMesh: THREE.Mesh | null = null;
  private initialTeethY = 0;
  private animationFrameId: number = 0;
  private clock = new THREE.Clock();
  private mouseX = 0;
  private mouseY = 0;
  private targetMouseX = 0;
  private targetMouseY = 0;

  firstUpdated() {
    this.initScene();
    this.setupAudioAnalysers();
    window.addEventListener('mousemove', this.onMouseMove);
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
        this.outputAnalyser.smoothingTimeConstant = 0.7;
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
        this.inputAnalyser.smoothingTimeConstant = 0.7;
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
  }

  private initScene() {
    const canvas = this.shadowRoot?.querySelector('#justiceCanvas') as HTMLCanvasElement;
    if (!canvas) return;

    this.scene = new THREE.Scene();

    // Portrait Camera framing upper chest, shoulders, suit and face
    this.camera = new THREE.PerspectiveCamera(36, window.innerWidth / window.innerHeight, 0.1, 50);
    this.camera.position.set(0, 1.56, 1.15);
    this.camera.lookAt(0, 1.56, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // --- LAW OFFICE LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xfff5ea, 1.6);
    this.scene.add(ambientLight);

    // Main Warm Key Light from Office Chandelier / Window
    const keyLight = new THREE.DirectionalLight(0xfff8ee, 2.4);
    keyLight.position.set(2, 3.5, 2.5);
    this.scene.add(keyLight);

    // Soft Blue-tinted Fill Light (Daylight from office window)
    const windowDaylight = new THREE.DirectionalLight(0xdbeafe, 1.2);
    windowDaylight.position.set(-3, 2.5, 1.5);
    this.scene.add(windowDaylight);

    // Warm Banker's Lamp / Bookshelf Accent Light
    const bankerGlow = new THREE.PointLight(0xfef08a, 18, 4);
    bankerGlow.position.set(-0.75, 1.45, -0.6);
    this.scene.add(bankerGlow);

    // Golden Scale Spotlight
    const scaleSpot = new THREE.PointLight(0xfde047, 12, 3);
    scaleSpot.position.set(0.7, 1.55, -0.5);
    this.scene.add(scaleSpot);

    // Rim light to separate avatar from mahogany background
    const backRimLight = new THREE.DirectionalLight(0xffedd5, 1.5);
    backRimLight.position.set(0, 2.8, -1.8);
    this.scene.add(backRimLight);

    // Build the 3D Law Office Environment
    this.buildLawOfficeEnvironment();
    this.scene.add(this.officeEnvironment);

    this.scene.add(this.avatarGroup);

    // --- LOAD GLB AVATAR ---
    const loader = new GLTFLoader();
    loader.load(
      '/promptplay-male-1717.glb',
      (gltf) => {
        const rawModel = gltf.scene;

        // Separate and structure head and body elements for realistic lifelike movement
        const headMeshNames = [
          'AvatarHead',
          'AvatarEyelashes',
          'AvatarLeftEyeball',
          'AvatarRightEyeball',
          'AvatarTeethLower',
          'AvatarTeethUpper'
        ];

        const children = [...rawModel.children];
        
        // Pivot point at the base of the neck/jaw
        const neckPivotY = 1.55;
        this.headGroup.position.set(0, neckPivotY, 0.02);

        children.forEach((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            if (mesh.material) {
              const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
              mats.forEach(m => {
                if (m instanceof THREE.MeshStandardMaterial) {
                  m.roughness = Math.max(0.4, m.roughness);
                  m.needsUpdate = true;
                }
              });
            }

            if (mesh.name === 'AvatarTeethLower') {
              this.teethLowerMesh = mesh;
              this.initialTeethY = mesh.position.y;
            } else if (mesh.name === 'AvatarEyelashes') {
              this.eyelashesMesh = mesh;
            }

            if (headMeshNames.includes(mesh.name)) {
              // Adjust position relative to head group pivot
              mesh.position.y -= neckPivotY;
              mesh.position.z -= 0.02;
              this.headGroup.add(mesh);
            } else {
              this.avatarGroup.add(mesh);
            }
          } else {
            this.avatarGroup.add(child);
          }
        });

        this.avatarGroup.add(this.headGroup);
      },
      undefined,
      (error) => {
        console.error('Error loading promptplay-male-1717.glb:', error);
      }
    );

    window.addEventListener('resize', this.onWindowResize);
    this.animateScene();
  }

  private buildLawOfficeEnvironment() {
    // --- Materials for Official Law Office ---
    const walnutWoodMat = new THREE.MeshStandardMaterial({
      color: 0x382216,
      roughness: 0.55,
      metalness: 0.08,
    });

    const darkMahoganyMat = new THREE.MeshStandardMaterial({
      color: 0x24140e,
      roughness: 0.45,
      metalness: 0.12,
    });

    const polishedGoldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.92,
    });

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xb8860b,
      roughness: 0.35,
      metalness: 0.85,
    });

    const emeraldGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x064e3b,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.85,
      ior: 1.52,
      transparent: true,
      opacity: 0.9,
    });

    const warmWallMat = new THREE.MeshStandardMaterial({
      color: 0x1f242d,
      roughness: 0.85,
    });

    const leatherBlotterMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.7,
    });

    // 1. Executive Back Wall with Walnut Wainscoting & Relief Mouldings
    const wallGeo = new THREE.PlaneGeometry(8, 5);
    const backWall = new THREE.Mesh(wallGeo, warmWallMat);
    backWall.position.set(0, 1.8, -1.3);
    this.officeEnvironment.add(backWall);

    // Walnut lower wainscoting panel
    const wainscotGeo = new THREE.BoxGeometry(8, 1.4, 0.05);
    const wainscot = new THREE.Mesh(wainscotGeo, walnutWoodMat);
    wainscot.position.set(0, 0.7, -1.27);
    this.officeEnvironment.add(wainscot);

    // Decorative wall wood slats on sides
    for (let i = 0; i < 14; i++) {
      const slatGeo = new THREE.BoxGeometry(0.04, 3.2, 0.03);
      const slat = new THREE.Mesh(slatGeo, walnutWoodMat);
      slat.position.set(-2.8 + i * 0.12, 1.8, -1.26);
      this.officeEnvironment.add(slat);

      const slatRight = new THREE.Mesh(slatGeo, walnutWoodMat);
      slatRight.position.set(1.4 + i * 0.12, 1.8, -1.26);
      this.officeEnvironment.add(slatRight);
    }

    // 2. High-End Built-in Law Library & Bookshelf (Left-Center Background)
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(-1.1, 1.45, -1.05);

    // Shelf frame
    const shelfBackGeo = new THREE.BoxGeometry(1.5, 1.8, 0.05);
    const shelfBack = new THREE.Mesh(shelfBackGeo, darkMahoganyMat);
    shelfGroup.add(shelfBack);

    // Shelf planks
    const plankGeo = new THREE.BoxGeometry(1.54, 0.04, 0.3);
    for (let y = -0.7; y <= 0.8; y += 0.45) {
      const plank = new THREE.Mesh(plankGeo, walnutWoodMat);
      plank.position.set(0, y, 0.12);
      shelfGroup.add(plank);
    }

    // Law Books Generation with leather colors & embossed gold foil spines
    const bookColors = [0x58111a, 0x132238, 0x112e1f, 0x361d10, 0x4a1d08, 0x1e293b];
    const shelfLevels = [-0.48, -0.03, 0.42];

    shelfLevels.forEach((shelfY, lIdx) => {
      let currentX = -0.66;
      while (currentX < 0.6) {
        const bookWidth = 0.035 + Math.random() * 0.025;
        const bookHeight = 0.28 + Math.random() * 0.08;
        const bookDepth = 0.2 + Math.random() * 0.04;
        const color = bookColors[(lIdx * 3 + Math.floor(Math.random() * bookColors.length)) % bookColors.length];

        const bookMat = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.6,
          metalness: 0.05,
        });

        const bookGeo = new THREE.BoxGeometry(bookWidth, bookHeight, bookDepth);
        const bookMesh = new THREE.Mesh(bookGeo, bookMat);
        bookMesh.position.set(currentX + bookWidth / 2, shelfY + bookHeight / 2, 0.12);
        
        // Slight natural leaning on books
        if (Math.random() > 0.85 && currentX < 0.45) {
          bookMesh.rotation.z = (Math.random() - 0.5) * 0.12;
        }

        // Gold spine accent line
        const stripeGeo = new THREE.BoxGeometry(bookWidth * 1.02, 0.015, 0.01);
        const stripe = new THREE.Mesh(stripeGeo, polishedGoldMat);
        stripe.position.set(currentX + bookWidth / 2, shelfY + bookHeight * 0.75, 0.12 + bookDepth / 2 + 0.002);
        shelfGroup.add(stripe);

        shelfGroup.add(bookMesh);
        currentX += bookWidth + 0.006;
      }
    });

    this.officeEnvironment.add(shelfGroup);

    // 3. Classic Banker's Desk Lamp with Emerald Glass Shade (Left Credenza)
    const lampGroup = new THREE.Group();
    lampGroup.position.set(-0.75, 1.28, -0.75);

    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.025, 24), brassMat);
    const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.22, 16), brassMat);
    lampStem.position.y = 0.11;

    const lampArm = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.14, 16), brassMat);
    lampArm.rotation.z = Math.PI / 2;
    lampArm.position.set(0, 0.22, 0);

    const shadeGeo = new THREE.CylinderGeometry(0.055, 0.07, 0.18, 24, 1, false, 0, Math.PI);
    shadeGeo.rotateZ(Math.PI / 2);
    shadeGeo.rotateX(Math.PI / 2);
    const shadeMesh = new THREE.Mesh(shadeGeo, emeraldGlassMat);
    shadeMesh.position.set(0, 0.22, 0);

    const bulbMesh = new THREE.Mesh(new THREE.SphereGeometry(0.025, 16, 16), new THREE.MeshBasicMaterial({ color: 0xfffae0 }));
    bulbMesh.position.set(0, 0.2, 0);

    lampGroup.add(lampBase, lampStem, lampArm, shadeMesh, bulbMesh);
    lampGroup.scale.setScalar(1.2);
    this.officeEnvironment.add(lampGroup);

    // 4. Golden Scale of Justice (ترازوی عدالت) on Right Credenza
    this.scaleOfJusticeMini.position.set(0.82, 1.32, -0.72);
    this.scaleOfJusticeMini.scale.setScalar(0.28);

    const scaleBase = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.32, 0.08, 24), polishedGoldMat);
    const scalePillar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 1.4, 24), polishedGoldMat);
    scalePillar.position.y = 0.7;

    const scaleTopBall = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), polishedGoldMat);
    scaleTopBall.position.y = 1.42;

    const scaleBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.2, 16), polishedGoldMat);
    scaleBeam.rotation.z = Math.PI / 2;
    scaleBeam.position.y = 1.32;

    // Small pans
    const createMiniPan = (offsetX: number) => {
      const panGrp = new THREE.Group();
      panGrp.position.set(offsetX, 1.32, 0);

      const cord1 = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.45, 8), polishedGoldMat);
      cord1.position.set(0.08, -0.22, 0.05);
      cord1.rotation.z = -0.15;

      const cord2 = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.45, 8), polishedGoldMat);
      cord2.position.set(-0.08, -0.22, 0.05);
      cord2.rotation.z = 0.15;

      const panBowl = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), polishedGoldMat);
      panBowl.position.y = -0.45;

      panGrp.add(cord1, cord2, panBowl);
      return panGrp;
    };

    const leftPan = createMiniPan(-0.55);
    const rightPan = createMiniPan(0.55);

    this.scaleOfJusticeMini.add(scaleBase, scalePillar, scaleTopBall, scaleBeam, leftPan, rightPan);
    this.officeEnvironment.add(this.scaleOfJusticeMini);

    // 5. Judicial Gavel and Sounding Block (چکش قضایی چوبی)
    const gavelGroup = new THREE.Group();
    gavelGroup.position.set(0.72, 1.28, -0.55);

    // Round wooden block
    const blockGeo = new THREE.CylinderGeometry(0.1, 0.11, 0.035, 24);
    const soundingBlock = new THREE.Mesh(blockGeo, darkMahoganyMat);

    // Gavel Head & Handle
    const gavelHeadGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.14, 16);
    gavelHeadGeo.rotateZ(Math.PI / 2);
    const gavelHead = new THREE.Mesh(gavelHeadGeo, walnutWoodMat);
    gavelHead.position.set(0.06, 0.08, 0.02);

    // Brass ring on gavel head
    const ringGeo = new THREE.CylinderGeometry(0.036, 0.036, 0.03, 16);
    ringGeo.rotateZ(Math.PI / 2);
    const gavelRing = new THREE.Mesh(ringGeo, brassMat);
    gavelRing.position.set(0.06, 0.08, 0.02);

    const gavelHandleGeo = new THREE.CylinderGeometry(0.01, 0.015, 0.22, 12);
    const gavelHandle = new THREE.Mesh(gavelHandleGeo, walnutWoodMat);
    gavelHandle.rotation.x = Math.PI / 2;
    gavelHandle.rotation.z = 0.4;
    gavelHandle.position.set(0.02, 0.05, 0.1);

    gavelGroup.add(soundingBlock, gavelHead, gavelRing, gavelHandle);
    gavelGroup.scale.setScalar(0.9);
    this.officeEnvironment.add(gavelGroup);

    // 6. Framed Official Bar Association License / Certificate (پروانه وکالت)
    const certGroup = new THREE.Group();
    certGroup.position.set(0.85, 1.85, -1.24);

    const frameOuter = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.72, 0.025), darkMahoganyMat);
    const frameGoldInner = new THREE.Mesh(new THREE.BoxGeometry(0.51, 0.68, 0.028), polishedGoldMat);
    const certParchment = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.62, 0.03), new THREE.MeshStandardMaterial({
      color: 0xfaf5eb,
      roughness: 0.9,
    }));

    // Gold official seal medallion on diploma
    const sealMedallion = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.005, 16), polishedGoldMat);
    sealMedallion.rotation.x = Math.PI / 2;
    sealMedallion.position.set(0, -0.18, 0.018);

    certGroup.add(frameOuter, frameGoldInner, certParchment, sealMedallion);
    this.officeEnvironment.add(certGroup);

    // 7. Executive Leather Desk Surface Foreground Accent
    const deskGroup = new THREE.Group();
    deskGroup.position.set(0, 0.92, -0.15);

    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.06, 1.4), darkMahoganyMat);
    const leatherPad = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.01, 0.8), leatherBlotterMat);
    leatherPad.position.set(0, 0.035, 0.1);

    // Gold corner protectors on desk blotter
    const goldCorner1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.012, 0.08), polishedGoldMat);
    goldCorner1.position.set(-0.76, 0.038, 0.46);
    const goldCorner2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.012, 0.08), polishedGoldMat);
    goldCorner2.position.set(0.76, 0.038, 0.46);

    deskGroup.add(deskTop, leatherPad, goldCorner1, goldCorner2);
    this.officeEnvironment.add(deskGroup);

    // 8. Atmospheric Floating Light Dust Motes (جلوه ذرات نور در فضای دفتر)
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 4;
      positions[i + 1] = 0.8 + Math.random() * 2.2;
      positions[i + 2] = -1.2 + Math.random() * 2.0;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0xffeedb,
      size: 0.015,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });

    this.dustParticles = new THREE.Points(particleGeo, particleMat);
    this.officeEnvironment.add(this.dustParticles);
  }

  private onWindowResize = () => {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animateScene = () => {
    this.animationFrameId = requestAnimationFrame(this.animateScene);
    
    const time = this.clock.getElapsedTime();

    // Audio frequency energy analysis for voice reactivity
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
      rawAudioLevel = (sum / (this.inputData.length * 255)) * 0.8;
    }

    const smoothFactor = this.isSpeaking || this.isUserSpeaking ? 0.35 : 0.08;
    this.smoothedAudioLevel += (rawAudioLevel - this.smoothedAudioLevel) * smoothFactor;

    // Smooth mouse gaze tracking
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

    // Organic Body & Torso Breathing
    let breathSpeed = 1.8;
    let breathAmp = 0.006;

    if (this.isSpeaking) {
      breathSpeed = 4.5;
      breathAmp = 0.012 + this.smoothedAudioLevel * 0.01;
    } else if (this.isUserSpeaking) {
      breathSpeed = 2.4;
      breathAmp = 0.008;
    }

    this.avatarGroup.position.y = Math.sin(time * breathSpeed) * breathAmp;
    this.avatarGroup.rotation.y = THREE.MathUtils.lerp(this.avatarGroup.rotation.y, this.mouseX * 0.08, 0.05);

    // Dynamic Head Movement & Active Listening
    if (this.headGroup) {
      if (this.isSpeaking) {
        // Confident lawyer speaking motion with rhythmic emphasis
        const nodX = Math.sin(time * 6) * 0.02 + (this.smoothedAudioLevel * 0.04);
        const tiltZ = Math.sin(time * 3) * 0.015;
        this.headGroup.rotation.y = THREE.MathUtils.lerp(this.headGroup.rotation.y, this.mouseX * 0.25 + Math.sin(time * 2) * 0.02, 0.1);
        this.headGroup.rotation.x = THREE.MathUtils.lerp(this.headGroup.rotation.x, -this.mouseY * 0.15 + nodX, 0.1);
        this.headGroup.rotation.z = THREE.MathUtils.lerp(this.headGroup.rotation.z, tiltZ, 0.1);
      } else if (this.isUserSpeaking) {
        // Attentive listening posture: slight tilt and lean towards user
        this.headGroup.rotation.y = THREE.MathUtils.lerp(this.headGroup.rotation.y, this.mouseX * 0.2, 0.08);
        this.headGroup.rotation.x = THREE.MathUtils.lerp(this.headGroup.rotation.x, -this.mouseY * 0.12 + 0.04 + Math.sin(time * 2) * 0.01, 0.08);
        this.headGroup.rotation.z = THREE.MathUtils.lerp(this.headGroup.rotation.z, 0.03, 0.08);
      } else {
        // Calm resting state looking towards cursor
        this.headGroup.rotation.y = THREE.MathUtils.lerp(this.headGroup.rotation.y, this.mouseX * 0.22, 0.06);
        this.headGroup.rotation.x = THREE.MathUtils.lerp(this.headGroup.rotation.x, -this.mouseY * 0.12, 0.06);
        this.headGroup.rotation.z = THREE.MathUtils.lerp(this.headGroup.rotation.z, 0, 0.06);
      }
    }

    // Environmental Parallax (Room moves inversely with depth for true 3D spatial effect)
    this.officeEnvironment.position.x = THREE.MathUtils.lerp(this.officeEnvironment.position.x, this.mouseX * -0.05, 0.05);
    this.officeEnvironment.position.y = THREE.MathUtils.lerp(this.officeEnvironment.position.y, this.mouseY * -0.03, 0.05);

    // Dust motes gentle drift
    if (this.dustParticles) {
      this.dustParticles.rotation.y = time * 0.02;
      this.dustParticles.rotation.x = Math.sin(time * 0.01) * 0.02;
    }

    // Gentle realistic tilt on Scale of Justice pans
    if (this.scaleOfJusticeMini) {
      const scaleSway = Math.sin(time * 1.5) * 0.03 + (this.isSpeaking ? Math.sin(time * 4) * 0.02 : 0);
      this.scaleOfJusticeMini.rotation.z = THREE.MathUtils.lerp(this.scaleOfJusticeMini.rotation.z, scaleSway, 0.05);
    }

    // Acoustic Voice Lip-Syncing
    if (this.teethLowerMesh) {
      if (this.isSpeaking) {
        const lipOffset = Math.min(0.018, this.smoothedAudioLevel * 0.03 + (Math.sin(time * 22) > 0.2 ? 0.008 : 0));
        this.teethLowerMesh.position.y = THREE.MathUtils.lerp(this.teethLowerMesh.position.y, this.initialTeethY - lipOffset, 0.4);
      } else {
        this.teethLowerMesh.position.y = THREE.MathUtils.lerp(this.teethLowerMesh.position.y, this.initialTeethY, 0.3);
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  render() {
    return html`
      <div class="canvas-container">
        <canvas id="justiceCanvas"></canvas>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'justice-scale-3d': JusticeScale3D;
  }
}
