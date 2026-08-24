/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Vertex Shader for Pure Geometric Spherical Volume with Harmonic Acoustic Ripples
export const stoneVS = `
precision highp float;

uniform float time;
uniform vec4 inputData;
uniform vec4 outputData;
uniform float audioIntensity;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;
varying vec3 vLocalPosition;
varying vec2 vUv;
varying float vAcousticWave;

void main() {
  vUv = uv;
  vLocalPosition = position;
  
  // Calculate subtle spherical surface wave ripples on sound (keeps perfect spherical silhouette)
  float distFromPole = length(position.xy);
  float wave1 = sin(distFromPole * 14.0 - time * 6.0) * (0.008 + audioIntensity * 0.035);
  float wave2 = cos(position.y * 12.0 + position.z * 8.0 - time * 4.0) * (0.006 + audioIntensity * 0.025);
  float acousticWave = wave1 + wave2;
  vAcousticWave = acousticWave;

  // Very subtle radial displacement that preserves the crisp spherical geometry
  vec3 displacedPos = position + normal * acousticWave;

  vNormal = normalize(normalMatrix * normal);
  
  vec4 worldPos = modelMatrix * vec4(displacedPos, 1.0);
  vWorldPosition = worldPos.xyz;
  
  vec4 mvPosition = modelViewMatrix * vec4(displacedPos, 1.0);
  vViewPosition = -mvPosition.xyz;
  
  gl_Position = projectionMatrix * mvPosition;
}
`;

// Fragment Shader for Highly Realistic 3D Volumetric Matte Stone Sphere
export const stoneFS = `
precision highp float;

uniform float time;
uniform float audioIntensity;
uniform vec3 stoneBaseColor;
uniform vec3 stoneVeinColor;
uniform vec3 stoneShadowColor;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;
varying vec3 vLocalPosition;
varying vec2 vUv;
varying float vAcousticWave;

// Procedural 3D Simplex-like noise for rich mineral bump map
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// Multi-scale stone texture
float stoneFBM(vec3 p) {
  float f = 0.0;
  f += 0.500 * snoise(p * 2.0);
  f += 0.250 * snoise(p * 4.2);
  f += 0.125 * snoise(p * 9.5);
  f += 0.0625 * snoise(p * 22.0);
  return f;
}

// Micro grain noise for tactile matte surface feel
float microGrain(vec3 p) {
  vec3 q = p * 60.0;
  return fract(sin(dot(q, vec3(12.9898, 78.233, 45.543))) * 43758.5453);
}

void main() {
  vec3 V = normalize(vViewPosition);
  
  // 1. Procedural High-Definition Normal Perturbation (Stone Micro-Roughness)
  vec3 p = vLocalPosition;
  float eps = 0.012;
  float nCenter = stoneFBM(p);
  float nRight  = stoneFBM(p + vec3(eps, 0.0, 0.0));
  float nUp     = stoneFBM(p + vec3(0.0, eps, 0.0));
  float nDeep   = stoneFBM(p + vec3(0.0, 0.0, eps));
  
  vec3 bumpGrad = vec3(nRight - nCenter, nUp - nCenter, nDeep - nCenter) / eps;
  
  // Modulate bump with sound energy: waves subtly disturb the stone surface normal
  bumpGrad += vec3(vAcousticWave * 8.0);

  // Combine geometric normal with micro-bump normal for rich 3D tactile depth
  vec3 N = normalize(vNormal - bumpGrad * 0.14);

  // 2. Realistic 3D Volumetric Spherical Lighting
  // Strong Key Light (Creates distinctive light-to-shadow gradient across spherical curvature)
  vec3 keyLight = normalize(vec3(0.65, 0.85, 0.75));
  float NdotL_Key = max(dot(N, keyLight), 0.0);
  // Smooth spherical diffuse falloff with wrap
  float diffuseKey = pow(NdotL_Key * 0.8 + 0.2, 1.3);

  // Cool Soft Fill Light (Illuminates opposite hemisphere with soft contrast)
  vec3 fillLight = normalize(vec3(-0.8, 0.2, 0.5));
  float NdotL_Fill = max(dot(N, fillLight), 0.0);
  float diffuseFill = pow(NdotL_Fill * 0.7 + 0.3, 1.2) * 0.35;

  // Bottom Bounce Light (Reflected up from white environment canvas)
  vec3 bounceLight = normalize(vec3(0.0, -1.0, 0.2));
  float NdotL_Bounce = max(dot(N, bounceLight), 0.0);
  float diffuseBounce = pow(NdotL_Bounce * 0.6 + 0.4, 1.1) * 0.22;

  // 3. Spherical Ambient Occlusion & Volumetric Curvature
  float NdotV = max(dot(N, V), 0.0);
  // Darker core shadow on terminator line for true 3D spherical volume depth
  float terminatorShadow = smoothstep(0.0, 0.45, NdotL_Key);
  
  // Fresnel Grazing Rim (Soft velvety rim light on spherical perimeter)
  float rim = pow(1.0 - NdotV, 2.8) * 0.35;

  // 4. Matte Stone Texture Color Blending
  float mineralVein = smoothstep(-0.25, 0.35, nCenter);
  vec3 baseAlbedo = mix(stoneBaseColor, stoneVeinColor, mineralVein);

  // Add micro tactile grain
  float grain = microGrain(p);
  baseAlbedo += (grain - 0.5) * 0.045;

  // Audio acoustic resonance tint on ripples
  float wavePeak = smoothstep(0.015, 0.05, abs(vAcousticWave));
  vec3 acousticAlbedo = mix(baseAlbedo, vec3(0.72, 0.62, 0.48), wavePeak * (0.05 + audioIntensity * 0.4));

  // 5. Final Shading Composition
  vec3 litColor = acousticAlbedo * (diffuseKey * 0.95 * terminatorShadow + diffuseFill + diffuseBounce + 0.12);
  
  // Ambient Occlusion / Shadow side darkening (gives solid 3D mass against white background)
  litColor = mix(stoneShadowColor, litColor, clamp(terminatorShadow * 1.2 + 0.2, 0.0, 1.0));
  
  // Add subtle velvety rim for crisp 3D spherical separation
  litColor += vec3(0.85, 0.88, 0.92) * rim;

  // Ultra-matte soft highlight
  vec3 halfVec = normalize(keyLight + V);
  float matteSpec = pow(max(dot(N, halfVec), 0.0), 8.0) * 0.07;
  litColor += vec3(matteSpec);

  gl_FragColor = vec4(litColor, 1.0);
}
`;
