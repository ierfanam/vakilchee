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

  static styles = css`
    :host {
      display: block;
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }
    .canvas-container {
      width: 100%;
      height: 100%;
      opacity: 0.95;
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
  private avatarModel: THREE.Group | null = null;
  private mixer: THREE.AnimationMixer | null = null;
  private animations: THREE.AnimationClip[] = [];
  private jawBone: THREE.Bone | null = null;
  private headBone: THREE.Bone | null = null;
  private spineBone: THREE.Bone | null = null;
  private morphMeshes: { mesh: THREE.Mesh; index: number }[] = [];
  private animationFrameId: number = 0;
  private clock = new THREE.Clock();
  private mouseX = 0;
  private mouseY = 0;
  private targetMouseX = 0;
  private targetMouseY = 0;

  firstUpdated() {
    this.initScene();
    window.addEventListener('mousemove', this.onMouseMove);
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
    this.scene.fog = new THREE.FogExp2(0xffffff, 0.015);

    this.camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 1.2, 4.5);
    this.camera.lookAt(0, 1.0, 0);

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;

    // --- LIGHTS ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);

    const fillLight = new THREE.PointLight(0x38bdf8, 50, 15);
    fillLight.position.set(-4, 3, 3);
    this.scene.add(fillLight);

    const warmLight = new THREE.PointLight(0xffd700, 40, 15);
    warmLight.position.set(4, 2, 3);
    this.scene.add(warmLight);

    // --- LOAD GLB AVATAR ---
    const loader = new GLTFLoader();
    loader.load(
      '/promptplay-male-1717.glb',
      (gltf) => {
        this.avatarModel = gltf.scene;
        
        const box = new THREE.Box3().setFromObject(this.avatarModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        this.avatarModel.position.x -= center.x;
        this.avatarModel.position.y -= box.min.y;
        this.avatarModel.position.z -= center.z;

        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const scaleFactor = 2.4 / maxDim;
          this.avatarModel.scale.setScalar(scaleFactor);
        }

        this.avatarModel.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material) {
              if (Array.isArray(mesh.material)) {
                mesh.material.forEach(mat => {
                  mat.needsUpdate = true;
                });
              } else {
                mesh.material.needsUpdate = true;
              }
            }

            if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
              const keys = Object.keys(mesh.morphTargetDictionary);
              for (const key of keys) {
                if (key.toLowerCase().includes('jaw') || key.toLowerCase().includes('mouth') || key.toLowerCase().includes('open') || key.toLowerCase().includes('viseme')) {
                  const idx = mesh.morphTargetDictionary[key];
                  this.morphMeshes.push({ mesh, index: idx });
                }
              }
            }
          }

          if ((child as THREE.Bone).isBone) {
            const boneName = child.name.toLowerCase();
            if (boneName.includes('jaw') || boneName.includes('mouth')) {
              this.jawBone = child as THREE.Bone;
            } else if (boneName.includes('head') || boneName.includes('neck')) {
              this.headBone = child as THREE.Bone;
            } else if (boneName.includes('spine') || boneName.includes('chest')) {
              this.spineBone = child as THREE.Bone;
            }
          }
        });

        this.scene.add(this.avatarModel);

        if (gltf.animations && gltf.animations.length > 0) {
          this.animations = gltf.animations;
          this.mixer = new THREE.AnimationMixer(this.avatarModel);
          const action = this.mixer.clipAction(this.animations[0]);
          action.play();
        }
      },
      undefined,
      (error) => {
        console.error('An error occurred loading promptplay-male-1717.glb:', error);
      }
    );

    window.addEventListener('resize', this.onWindowResize);
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
    
    const delta = this.clock.getDelta();
    const time = this.clock.getElapsedTime();

    if (this.mixer) {
      this.mixer.update(delta);
    }

    this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

    if (this.avatarModel) {
      let breathSpeed = 2.0;
      let breathAmount = 0.02;

      if (this.isSpeaking) {
        breathSpeed = 8.0;
        breathAmount = 0.05;
        this.avatarModel.rotation.y = THREE.MathUtils.lerp(this.avatarModel.rotation.y, this.mouseX * 0.3 + Math.sin(time * 3) * 0.05, 0.1);
        this.avatarModel.rotation.x = THREE.MathUtils.lerp(this.avatarModel.rotation.x, -this.mouseY * 0.2, 0.1);
      } else if (this.isUserSpeaking) {
        breathSpeed = 3.0;
        breathAmount = 0.03;
        this.avatarModel.rotation.y = THREE.MathUtils.lerp(this.avatarModel.rotation.y, this.mouseX * 0.2, 0.1);
        this.avatarModel.rotation.x = THREE.MathUtils.lerp(this.avatarModel.rotation.x, 0.05 + Math.sin(time * 2) * 0.02, 0.1);
      } else {
        this.avatarModel.rotation.y = THREE.MathUtils.lerp(this.avatarModel.rotation.y, this.mouseX * 0.25, 0.08);
        this.avatarModel.rotation.x = THREE.MathUtils.lerp(this.avatarModel.rotation.x, -this.mouseY * 0.15, 0.08);
      }

      this.avatarModel.position.y = Math.sin(time * breathSpeed) * breathAmount;

      if (this.isSpeaking) {
        const lipSyncVal = (Math.sin(time * 25) * 0.5 + 0.5) * 0.8 + Math.random() * 0.2;
        
        if (this.jawBone) {
          this.jawBone.rotation.x = THREE.MathUtils.lerp(this.jawBone.rotation.x, 0.15 + lipSyncVal * 0.25, 0.3);
        }

        for (const item of this.morphMeshes) {
          if (item.mesh.morphTargetInfluences) {
            item.mesh.morphTargetInfluences[item.index] = THREE.MathUtils.lerp(
              item.mesh.morphTargetInfluences[item.index],
              lipSyncVal,
              0.4
            );
          }
        }
      } else {
        if (this.jawBone) {
          this.jawBone.rotation.x = THREE.MathUtils.lerp(this.jawBone.rotation.x, 0, 0.2);
        }
        for (const item of this.morphMeshes) {
          if (item.mesh.morphTargetInfluences) {
            item.mesh.morphTargetInfluences[item.index] = THREE.MathUtils.lerp(
              item.mesh.morphTargetInfluences[item.index],
              0,
              0.3
            );
          }
        }
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
