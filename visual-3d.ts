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
import {glassVS, glassFS} from './glass-shader';
import {RepulsionParticleSystem} from './interactive-particles';

/**
 * 3D Live Audio Visualizer - Physical Transparent Clear Blue-Tinted Glass
 * A single transparent glass object, highly detailed, standing upright in the center of the image.
 * Made of clear blue-tinted glass with realistic reflections and light refraction,
 * placed on a plain white background, soft shadows underneath, minimalistic and clean composition,
 * studio lighting, centered composition.
 */
@customElement('gdm-live-audio-visuals-3d')
export class GdmLiveAudioVisuals3D extends LitElement {
  private inputAnalyser!: Analyser;
  private outputAnalyser!: Analyser;
  private camera!: THREE.PerspectiveCamera;
  private scene!: THREE.Scene;
  private renderer!: THREE.WebGLRenderer;
  
  // 3D Transparent Clear Blue-Tinted Glass Mesh & Physical Shader
  private glassMesh!: THREE.Mesh;
  private glassMaterial!: THREE.ShaderMaterial;

  // Realistic Soft Ambient Drop Shadow Mesh underneath the Upright Glass
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

    // 3. Create Upright Transparent Glass Sculpture (Capsule / Monument Standing Upright)
    const glassGeometry = new THREE.CapsuleGeometry(1.08, 1.25, 64, 128);
    
    // Clear Blue-Tinted Glass Material with Realistic Reflections & Light Refraction
    this.glassMaterial = new THREE.ShaderMaterial({
      vertexShader: glassVS,
      fragmentShader: glassFS,
      uniforms: {
        time: { value: 0 },
        inputData: { value: new THREE.Vector4(0, 0, 0, 0) },
        outputData: { value: new THREE.Vector4(0, 0, 0, 0) },
        audioIntensity: { value: 0.0 },
        glassColor: { value: new THREE.Color(0xb8e2fc) },       // Clear pale blue tint
        glassCoreColor: { value: new THREE.Color(0x0284c7) },   // Deep luminous azure core
        studioLightColor: { value: new THREE.Color(0xffffff) }, // Pure studio softbox highlights
      },
      transparent: true,
      depthWrite: true,
      side: THREE.FrontSide,
    });

    this.glassMesh = new THREE.Mesh(glassGeometry, this.glassMaterial);
    this.glassMesh.position.set(0, 0.1, 0); // Standing upright in the center
    scene.add(this.glassMesh);

    // 4. Soft Ambient Occlusion Drop Shadow directly underneath on Plain White Background
    const shadowGeo = new THREE.PlaneGeometry(4.2, 4.2);
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
          vec2 uv = (vUv - vec2(0.5)) * vec2(1.0, 1.22);
          float dist = length(uv);
          // Soft Gaussian-like multi-tiered studio contact shadow
          float contactOcclusion = exp(-dist * dist * 36.0) * 0.46;
          float softPenumbra = exp(-dist * dist * 10.5) * 0.28;
          float wideDiffuse = exp(-dist * dist * 3.6) * 0.14;
          
          float alpha = (contactOcclusion + softPenumbra + wideDiffuse) * opacity;
          // Soft studio ground contact shadow on plain white backdrop
          vec3 shadowColor = vec3(0.08, 0.14, 0.22);
          gl_FragColor = vec4(shadowColor, alpha);
        }
      `,
      uniforms: {
        opacity: { value: 0.32 },
      },
      transparent: true,
      depthWrite: false,
    });

    this.shadowMesh = new THREE.Mesh(shadowGeo, this.shadowMaterial);
    this.shadowMesh.position.set(0, -1.82, -0.35);
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

    // Upright rotation around vertical axis (standing upright in center)
    const baseSpeed = 0.0022;
    this.rotation.y += baseSpeed + (this.smoothedAudioIntensity * 0.016);
    this.rotation.x = Math.sin(t * 0.0003) * 0.04;
    this.rotation.z = Math.cos(t * 0.0003) * 0.02;

    if (this.glassMesh) {
      this.glassMesh.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
      
      // Gentle harmonic breathing pulse on voice audio
      const dynamicScale = 1.0 + (this.smoothedAudioIntensity * 0.06);
      this.glassMesh.scale.set(dynamicScale, dynamicScale, dynamicScale);

      // Subtle resting float while preserving upright grounding
      this.glassMesh.position.y = 0.1 + Math.sin(t * 0.001) * 0.025;

      // Update glass physical shader uniforms
      this.glassMaterial.uniforms.time.value = timeSec;
      this.glassMaterial.uniforms.inputData.value.set(inAmp, inFreq1, inFreq2, 0);
      this.glassMaterial.uniforms.outputData.value.set(outAmp, outFreq1, outFreq2, 0);
      this.glassMaterial.uniforms.audioIntensity.value = this.smoothedAudioIntensity;
    }

    if (this.shadowMesh) {
      // Soft grounded shadow underneath upright glass object
      const shadowScale = 1.0 + (this.smoothedAudioIntensity * 0.08) - (this.glassMesh ? (this.glassMesh.position.y - 0.1) * 0.3 : 0);
      this.shadowMesh.scale.set(shadowScale, shadowScale, 1.0);
      this.shadowMaterial.uniforms.opacity.value = 0.32 + (this.smoothedAudioIntensity * 0.1);
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
