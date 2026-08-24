/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// tslint:disable:organize-imports
// tslint:disable:ban-malformed-import-paths
// tslint:disable:no-new-decorators

import {LitElement, css, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';
import {Analyser} from './analyser';
import * as THREE from 'three';
import {stoneVS, stoneFS} from './stone-shader';
import {RepulsionParticleSystem} from './interactive-particles';

/**
 * 3D Live Audio Visualizer - Realistic Volumetric Spherical Matte Stone Aurb
 * Features realistic 3D spherical depth, soft ambient contact occlusion shadow,
 * high-fidelity stone procedural PBR shading, and harmonic acoustic audio reaction.
 */
@customElement('gdm-live-audio-visuals-3d')
export class GdmLiveAudioVisuals3D extends LitElement {
  private inputAnalyser!: Analyser;
  private outputAnalyser!: Analyser;
  private camera!: THREE.PerspectiveCamera;
  private scene!: THREE.Scene;
  private renderer!: THREE.WebGLRenderer;
  
  // 3D Spherical Matte Stone Mesh & Custom Shader
  private stoneMesh!: THREE.Mesh;
  private stoneMaterial!: THREE.ShaderMaterial;

  // Realistic Soft Ambient Drop Shadow Mesh underneath the 3D Sphere
  private shadowMesh!: THREE.Mesh;
  private shadowMaterial!: THREE.ShaderMaterial;

  // 7,000 Interactive Repulsion Particles System on White Canvas
  private particleSystem!: RepulsionParticleSystem;
  
  private prevTime = 0;
  private rotation = new THREE.Vector3(0, 0, 0);

  // Smooth audio interpolation for realistic physical response
  private smoothedAudioIntensity = 0.0;

  private _outputNode!: AudioNode;

  @property()
  set outputNode(node: AudioNode) {
    this._outputNode = node;
    this.outputAnalyser = new Analyser(this._outputNode);
  }

  get outputNode() {
    return this._outputNode;
  }

  private _inputNode!: AudioNode;

  @property()
  set inputNode(node: AudioNode) {
    this._inputNode = node;
    this.inputAnalyser = new Analyser(this._inputNode);
  }

  get inputNode() {
    return this._inputNode;
  }

  private canvas3D!: HTMLCanvasElement;
  private canvasBg!: HTMLCanvasElement;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      position: absolute;
      inset: 0;
      overflow: hidden;
      background: #ffffff;
    }

    .bg-particles-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      pointer-events: auto;
    }

    .orb-3d-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 2;
      pointer-events: none;
    }
  `;

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.particleSystem) {
      this.particleSystem.stop();
    }
  }

  private init() {
    // 1. Initialize 2D White Background with 7,000 Micro-Particles
    this.particleSystem = new RepulsionParticleSystem(this.canvasBg);
    this.particleSystem.start();

    // 2. Initialize Three.js 3D Scene
    const scene = new THREE.Scene();
    this.scene = scene;

    const camera = new THREE.PerspectiveCamera(
      48,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 0, 4.3);
    this.camera = camera;

    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvas3D,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Transparent background over particles
    this.renderer = renderer;

    // 3. Create Ultra-Smooth High-Precision 3D Sphere Geometry (192 x 192 segments)
    const sphereRadius = 1.38;
    const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 192, 192);
    
    // Realistic Matte Stone Color Scheme (Sculptural slate/basalt with warm mineral veins)
    this.stoneMaterial = new THREE.ShaderMaterial({
      vertexShader: stoneVS,
      fragmentShader: stoneFS,
      uniforms: {
        time: { value: 0 },
        inputData: { value: new THREE.Vector4(0, 0, 0, 0) },
        outputData: { value: new THREE.Vector4(0, 0, 0, 0) },
        audioIntensity: { value: 0.0 },
        stoneBaseColor: { value: new THREE.Color(0x282e3a) },       // Deep matte slate
        stoneVeinColor: { value: new THREE.Color(0x4a5568) },       // Mineral granite veins
        stoneShadowColor: { value: new THREE.Color(0x131720) },     // Deep 3D core shadow
      },
      transparent: false,
      depthWrite: true,
      side: THREE.FrontSide,
    });

    this.stoneMesh = new THREE.Mesh(sphereGeometry, this.stoneMaterial);
    scene.add(this.stoneMesh);

    // 4. Soft Volumetric Ambient Drop Shadow beneath the Sphere for Tangible 3D Grounding
    const shadowGeo = new THREE.PlaneGeometry(3.6, 3.6);
    this.shadowMaterial = new THREE.ShaderMaterial({
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float opacity;
        void main() {
          float dist = length(vUv - vec2(0.5));
          // Soft Gaussian-like circular shadow falloff
          float alpha = exp(-dist * dist * 18.0) * opacity;
          gl_FragColor = vec4(vec3(0.08, 0.1, 0.15), alpha);
        }
      `,
      uniforms: {
        opacity: { value: 0.28 },
      },
      transparent: true,
      depthWrite: false,
    });

    this.shadowMesh = new THREE.Mesh(shadowGeo, this.shadowMaterial);
    this.shadowMesh.position.set(0, -1.82, -0.4);
    this.shadowMesh.rotation.x = -Math.PI * 0.46;
    scene.add(this.shadowMesh);

    // Handle Window Resizing
    const onWindowResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      const newDpr = Math.min(window.devicePixelRatio, 2);
      renderer.setSize(width, height);
      renderer.setPixelRatio(newDpr);

      if (this.particleSystem) {
        this.particleSystem.resize();
      }
    };

    window.addEventListener('resize', onWindowResize);
    this.animation();
  }

  private animation = () => {
    requestAnimationFrame(this.animation);

    if (this.inputAnalyser) this.inputAnalyser.update();
    if (this.outputAnalyser) this.outputAnalyser.update();

    const t = performance.now();
    this.prevTime = t;

    const inData = this.inputAnalyser ? this.inputAnalyser.data : new Uint8Array(32);
    const outData = this.outputAnalyser ? this.outputAnalyser.data : new Uint8Array(32);

    const inAmp = inData[0] / 255;
    const inFreq1 = inData[1] / 255;
    const inFreq2 = inData[2] / 255;

    const outAmp = outData[0] / 255;
    const outFreq1 = outData[1] / 255;
    const outFreq2 = outData[2] / 255;

    // Combined audio level (lawyer voice out + user mic in)
    const targetIntensity = Math.max(outAmp * 1.5, inAmp * 0.9);

    // Smooth organic attack and physical decay
    const attack = 0.3;
    const decay = 0.07;
    if (targetIntensity > this.smoothedAudioIntensity) {
      this.smoothedAudioIntensity += (targetIntensity - this.smoothedAudioIntensity) * attack;
    } else {
      this.smoothedAudioIntensity += (targetIntensity - this.smoothedAudioIntensity) * decay;
    }

    const timeSec = t * 0.001;

    // Natural 3D continuous spherical rotation (calm tumbling)
    const baseSpeed = 0.0016;
    this.rotation.y += baseSpeed + (this.smoothedAudioIntensity * 0.012);
    this.rotation.x = Math.sin(t * 0.0004) * 0.12;
    this.rotation.z = Math.cos(t * 0.0003) * 0.08;

    if (this.stoneMesh) {
      this.stoneMesh.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
      
      // Spherical harmonic breathing scale on voice audio
      const dynamicScale = 1.0 + (this.smoothedAudioIntensity * 0.075);
      this.stoneMesh.scale.setScalar(dynamicScale);

      // Subtle dynamic hovering float
      this.stoneMesh.position.y = Math.sin(t * 0.0012) * 0.04;

      // Update shader uniforms
      this.stoneMaterial.uniforms.time.value = timeSec;
      this.stoneMaterial.uniforms.inputData.value.set(inAmp, inFreq1, inFreq2, 0);
      this.stoneMaterial.uniforms.outputData.value.set(outAmp, outFreq1, outFreq2, 0);
      this.stoneMaterial.uniforms.audioIntensity.value = this.smoothedAudioIntensity;
    }

    if (this.shadowMesh) {
      // Scale shadow in synchrony with spherical breathing & hovering
      const shadowScale = 1.0 + (this.smoothedAudioIntensity * 0.1) - (this.stoneMesh ? this.stoneMesh.position.y * 0.4 : 0);
      this.shadowMesh.scale.set(shadowScale, shadowScale, 1.0);
      this.shadowMaterial.uniforms.opacity.value = 0.26 + (this.smoothedAudioIntensity * 0.12);
    }

    this.renderer.render(this.scene, this.camera);
  };

  protected firstUpdated() {
    this.canvasBg = this.shadowRoot!.querySelector('.bg-particles-canvas') as HTMLCanvasElement;
    this.canvas3D = this.shadowRoot!.querySelector('.orb-3d-canvas') as HTMLCanvasElement;
    this.init();
  }

  protected render() {
    return html`
      <canvas class="bg-particles-canvas"></canvas>
      <canvas class="orb-3d-canvas"></canvas>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gdm-live-audio-visuals-3d': GdmLiveAudioVisuals3D;
  }
}
