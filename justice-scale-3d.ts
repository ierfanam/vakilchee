import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import * as THREE from 'three';

@customElement('justice-scale-3d')
export class JusticeScale3D extends LitElement {
  @property({type: Boolean})
  isSpeaking = false;

  @property({type: Boolean})
  isUserSpeaking = false;

  static styles = css`
    :host {
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none; /* Let clicks pass through */
      z-index: 0; /* Place it behind the UI */
      overflow: hidden;
    }
    .canvas-container {
      width: 100%;
      height: 100%;
      opacity: 0.65; /* Subtle opacity so it doesn't distract from UI */
      transition: opacity 1s ease-in-out;
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
  private scaleGroup!: THREE.Group;
  private animationFrameId: number = 0;
  private clock = new THREE.Clock();

  firstUpdated() {
    this.initScene();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.renderer?.dispose();
    window.removeEventListener('resize', this.onWindowResize);
  }

  private initScene() {
    const canvas = this.shadowRoot?.querySelector('#justiceCanvas') as HTMLCanvasElement;
    if (!canvas) return;

    this.scene = new THREE.Scene();
    
    // Add soft fog matching the clean white background
    this.scene.fog = new THREE.FogExp2(0xffffff, 0.025);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    // Position the camera slightly low looking up for an imposing legal feeling
    this.camera.position.set(0, -2, 22);
    this.camera.lookAt(0, 2, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // --- MATERIALS ---
    // Glassmorphism Material for the main scale body (darker for contrast on white)
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      emissive: 0x111111,
      metalness: 0.2,
      roughness: 0.1,
      transmission: 0.9, 
      ior: 1.6,
      thickness: 2.0,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.5,
    });

    // Gold/Brass Material for accents and strings
    const goldMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 1.0,
      roughness: 0.15,
    });

    this.scaleGroup = new THREE.Group();

    // --- GEOMETRY ---
    // 1. Base
    const baseGeo = new THREE.CylinderGeometry(1.8, 2.4, 0.6, 32);
    const base = new THREE.Mesh(baseGeo, glassMaterial);
    base.position.y = -6;
    this.scaleGroup.add(base);

    const baseTopGeo = new THREE.CylinderGeometry(1.4, 1.8, 0.4, 32);
    const baseTop = new THREE.Mesh(baseTopGeo, goldMaterial);
    baseTop.position.y = -5.5;
    this.scaleGroup.add(baseTop);

    // 2. Main Pillar
    const pillarGeo = new THREE.CylinderGeometry(0.3, 0.5, 10, 32);
    const pillar = new THREE.Mesh(pillarGeo, glassMaterial);
    pillar.position.y = -0.3;
    this.scaleGroup.add(pillar);

    // 3. Top Cap & Pivot
    const capGeo = new THREE.SphereGeometry(0.7, 32, 32);
    const cap = new THREE.Mesh(capGeo, goldMaterial);
    cap.position.y = 5.2;
    this.scaleGroup.add(cap);

    const pivotGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 16);
    const pivot = new THREE.Mesh(pivotGeo, glassMaterial);
    pivot.rotation.x = Math.PI / 2;
    pivot.position.y = 4.3;
    this.scaleGroup.add(pivot);

    // 4. Crossbeam (The balancing arm)
    const beamGeo = new THREE.CylinderGeometry(0.15, 0.15, 9, 32);
    const beam = new THREE.Mesh(beamGeo, goldMaterial);
    beam.rotation.z = Math.PI / 2;
    beam.position.y = 4.3;
    this.scaleGroup.add(beam);

    // 5. Pans and Strings (Helper function)
    const createPan = (xOffset: number) => {
      const panGroup = new THREE.Group();
      
      // Strings (using a thin cylinder oriented via lookAt)
      const createString = (tx: number, ty: number, tz: number) => {
        const length = Math.sqrt(tx*tx + ty*ty + tz*tz);
        const geo = new THREE.CylinderGeometry(0.015, 0.015, length, 8);
        geo.rotateX(Math.PI / 2); // Align with Z axis for lookAt
        geo.translate(0, 0, length / 2); // Origin at top
        const mesh = new THREE.Mesh(geo, goldMaterial);
        mesh.lookAt(tx, ty, tz);
        return mesh;
      };

      const dropLength = -4.5;
      const panRadius = 1.5;
      
      const string1 = createString(0, dropLength, panRadius);
      const string2 = createString( panRadius * 0.866, dropLength, -panRadius * 0.5);
      const string3 = createString(-panRadius * 0.866, dropLength, -panRadius * 0.5);
      
      panGroup.add(string1, string2, string3);

      // Pan itself
      // Sphere cut in half. thetaStart = Math.PI/2 keeps the bottom half
      const panGeo = new THREE.SphereGeometry(panRadius, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
      const pan = new THREE.Mesh(panGeo, glassMaterial);
      // The bottom of the strings reach `dropLength`, which is the edge of the pan.
      pan.position.y = dropLength;
      
      panGroup.add(pan);
      panGroup.position.set(xOffset, 4.3, 0);
      return panGroup;
    };

    const leftPan = createPan(-4.3);
    const rightPan = createPan(4.3);
    
    this.scaleGroup.add(leftPan);
    this.scaleGroup.add(rightPan);

    this.scene.add(this.scaleGroup);

    // --- LIGHTS ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 3.0);
    dirLight.position.set(10, 15, 10);
    this.scene.add(dirLight);

    // Warm light for gold
    const goldLight = new THREE.PointLight(0xffeebb, 200, 50);
    goldLight.position.set(8, 6, 5);
    this.scene.add(goldLight);

    // Subtle cool rim light
    const fillLight = new THREE.PointLight(0xddddff, 100, 20);
    fillLight.position.set(-8, 2, -5);
    this.scene.add(fillLight);

    window.addEventListener('resize', this.onWindowResize);
    
    // Kick off animation
    this.animate();
  }

  private onWindowResize = () => {
    if (!this.camera || !this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    
    const time = this.clock.getElapsedTime();
    
    // Base floating effect
    let floatAmplitude = 0.6;
    let rotationSpeed = 0.2;

    // Reactivity
    if (this.isSpeaking) {
      floatAmplitude = 1.0;
      rotationSpeed = 0.4;
    } else if (this.isUserSpeaking) {
      floatAmplitude = 0.8;
      rotationSpeed = 0.3;
    }
    
    // Gentle floating effect
    this.scaleGroup.position.y = Math.sin(time * 0.6) * floatAmplitude;
    
    // Majestic slow rotation
    this.scaleGroup.rotation.y = time * rotationSpeed;
    
    // Subtle tilt for 3D depth perception
    let tiltZ = Math.sin(time * 0.4) * 0.05;
    if (this.isSpeaking) tiltZ += Math.sin(time * 8) * 0.03;
    else if (this.isUserSpeaking) tiltZ += Math.sin(time * 12) * 0.02;

    this.scaleGroup.rotation.z = tiltZ;
    this.scaleGroup.rotation.x = Math.cos(time * 0.5) * 0.03;

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
