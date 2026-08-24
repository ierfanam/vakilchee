/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Vertex Shader for Ultra-Realistic Soap Bubble with Internal Dormant/Surging Electric Plasma
export const bubbleElectricVS = `
precision highp float;

uniform float time;
uniform vec4 inputData;
uniform vec4 outputData;
uniform float plasmaIntensity; // Smoothed dynamic voice-plasma factor

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;
varying vec3 vLocalPosition;
varying vec2 vUv;
varying float vDisplacement;
varying float vVoiceSurge;

// Simplex noise for fluid surface tension wobble
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

void main() {
  vUv = uv;
  vLocalPosition = position;
  vVoiceSurge = plasmaIntensity;
  
  // Organic bubble surface wobble (gentle in silence, agitated when lawyer speaks)
  float wobbleSpeed = 0.6 + plasmaIntensity * 2.8;
  float noiseVal = snoise(position * 2.2 + vec3(time * wobbleSpeed));
  float noiseHigh = snoise(position * 5.2 + vec3(time * (wobbleSpeed * 2.2)));
  
  // Audio shockwave vibration across bubble membrane
  float displacement = (noiseVal * 0.02 + noiseHigh * 0.008) * (0.8 + plasmaIntensity * 3.5);
  vDisplacement = displacement;
  
  vec3 newPosition = position + normal * displacement;
  
  vNormal = normalize(normalMatrix * normal);
  
  vec4 worldPos = modelMatrix * vec4(newPosition, 1.0);
  vWorldPosition = worldPos.xyz;
  
  vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
  vViewPosition = -mvPosition.xyz;
  
  gl_Position = projectionMatrix * mvPosition;
}
`;

// Fragment Shader for Iridescent Bubble Membrane with Dynamic Dormant / Plasma Surge Electric Discharge
export const bubbleElectricFS = `
precision highp float;

uniform float time;
uniform vec4 inputData;
uniform vec4 outputData;
uniform vec2 resolution;
uniform float plasmaIntensity; // 0.0 in absolute silence -> 1.0+ during active lawyer speech

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;
varying vec3 vLocalPosition;
varying vec2 vUv;
varying float vDisplacement;
varying float vVoiceSurge;

// Fractal noise functions for lightning arcs
float hash(float n) { return fract(sin(n) * 43758.5453123); }
float hash2(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

float noise2D(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float n = i.x + i.y * 57.0;
  return mix(
    mix(hash(n + 0.0), hash(n + 1.0), f.x),
    mix(hash(n + 57.0), hash(n + 58.0), f.x),
    f.y
  );
}

float fbm2D(vec2 p) {
  float total = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 5; i++) {
    total += noise2D(p) * amp;
    p *= 2.02;
    amp *= 0.5;
  }
  return total;
}

// Generates intense jagged lightning bolt line
float lightningArc(vec2 uv, float seed, float speed, float sharpness) {
  float t = time * speed + seed * 100.0;
  float stepT = floor(t * 18.0); // Discrete rapid lightning jumps
  
  // Fractal displacement along vertical axis
  float curve = fbm2D(vec2(uv.y * 3.8 + stepT, seed * 17.3)) * 0.75 - 0.375;
  curve += (noise2D(vec2(uv.y * 14.0, stepT * 2.0)) - 0.5) * 0.2;
  
  float dist = abs(uv.x - curve);
  
  // Intense razor-sharp lightning core with glowing plasma halo
  float core = (0.0035 * sharpness) / (dist + 0.0035 * sharpness);
  float glow = 0.038 / (dist + 0.042);
  
  return core * 1.6 + glow * 0.9;
}

// Iridescent rainbow palette for soap bubble thin-film interference
vec3 palette(float t) {
  vec3 a = vec3(0.5, 0.5, 0.5);
  vec3 b = vec3(0.5, 0.5, 0.5);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.0, 0.33, 0.67);
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  vec3 viewDir = normalize(vViewPosition);
  vec3 normal = normalize(vNormal);
  
  float surge = clamp(plasmaIntensity, 0.0, 2.0);
  
  // -------------------------------------------------------------
  // 1. SOAP BUBBLE MEMBRANE MATERIAL (Image 844493676476228.jpg)
  // -------------------------------------------------------------
  float NdotV = max(dot(normal, viewDir), 0.0);
  
  // Fresnel reflectivity on bubble rim
  float fresnel = pow(1.0 - NdotV, 3.4);
  float rim = pow(1.0 - NdotV, 1.6);
  
  // Thin-film interference iridescence (magenta, turquoise, gold, violet)
  float iridIndex = dot(normal, vec3(0.0, 1.0, 0.0)) * 0.45 + NdotV * 0.55 + vDisplacement * 5.0 + time * 0.04;
  vec3 iridColor = palette(iridIndex);
  
  // Secondary chromatic shift on glancing angles
  vec3 glancingIrid = palette(fresnel * 2.2 + 0.18);
  
  // Studio specular reflection highlights
  vec3 lightDir1 = normalize(vec3(0.65, 0.85, 0.85));
  vec3 lightDir2 = normalize(vec3(-0.85, 0.35, 0.5));
  vec3 halfVec1 = normalize(lightDir1 + viewDir);
  vec3 halfVec2 = normalize(lightDir2 + viewDir);
  
  float spec1 = pow(max(dot(normal, halfVec1), 0.0), 36.0) * 1.9;
  float spec2 = pow(max(dot(normal, halfVec2), 0.0), 72.0) * 2.4;
  float broadSpec = pow(max(dot(normal, halfVec1), 0.0), 6.0) * 0.38;
  
  // -------------------------------------------------------------
  // 2. DYNAMIC ELECTRIC PLASMA SHADER (Image 4081455908211551.jpg)
  // Silence = Dormant (Subtle resting glow / faint filament)
  // Speech Out = Explosive High-Voltage Neon Plasma Surge
  // -------------------------------------------------------------
  vec2 arcUV = vec2(vLocalPosition.x * 1.25 + sin(vLocalPosition.y * 3.5 + time * 3.5) * 0.08, vLocalPosition.y * 0.95);
  
  // Main vertical lightning discharge
  float speedMod = 0.6 + surge * 1.8;
  float sharpness = 0.5 + surge * 0.9;
  
  float bolt1 = lightningArc(vec2(arcUV.x, arcUV.y), 1.12, speedMod, sharpness);
  
  // Branching lightning arcs (multiply strongly when sound is active)
  vec2 branchUV1 = vec2(arcUV.x * 1.45 + (arcUV.y * 0.42), arcUV.y * 1.2);
  float bolt2 = lightningArc(branchUV1, 3.45, speedMod * 1.3, sharpness);
  
  vec2 branchUV2 = vec2(arcUV.x * 1.35 - (arcUV.y * 0.38), arcUV.y * 1.15);
  float bolt3 = lightningArc(branchUV2, 7.89, speedMod * 1.15, sharpness);
  
  // Surface electric crawl & high-frequency micro-sparks
  float sparkNoise = fbm2D(vUv * 9.0 + vec2(time * (2.0 + surge * 4.0), -time * (1.5 + surge * 3.0)));
  float surfaceSparks = smoothstep(0.76 - surge * 0.12, 0.92, sparkNoise) * (0.8 + surge * 3.2);
  
  // Dormant vs. Active State Transition:
  // In pure silence: surge ~ 0 -> dormant state (faint minimal filament 0.04)
  // When lawyer speaks: surge goes from 0.3 -> 1.5 -> dramatic plasma eruption!
  float dormantElectricity = (bolt1 * 0.035 + surfaceSparks * 0.015);
  float activePlasmaSurge = (bolt1 * 1.15 + bolt2 * 0.85 + bolt3 * 0.85 + surfaceSparks * 0.65) * (surge * 2.6);
  
  float totalLightning = dormantElectricity + activePlasmaSurge;
  
  // Plasma Colors (Cyan, Deep Electric Blue, Pure White Ion Core)
  vec3 electricWhiteCore = vec3(1.0, 1.0, 1.0);
  vec3 electricNeonCyan = vec3(0.0, 0.96, 1.0);
  vec3 electricDeepBlue = vec3(0.02, 0.32, 0.98);
  
  // Dynamic plasma tone: dormant is deep subdued blue, surging shifts to incandescent cyan & blazing white
  vec3 electricPlasma = mix(electricDeepBlue, electricNeonCyan, clamp(surge * 0.7 + totalLightning * 0.3, 0.0, 1.0));
  electricPlasma = mix(electricPlasma, electricWhiteCore, clamp((surge * totalLightning * 0.45) - 0.25, 0.0, 1.0));
  
  // Central Core Plasma Glow (Fills bubble interior during speech)
  float centerDist = length(vLocalPosition.xy);
  float centralDormant = exp(-centerDist * 2.8) * 0.04;
  float centralSpeechGlow = exp(-centerDist * 1.6) * (surge * 1.35);
  vec3 interiorCoreGlow = electricNeonCyan * (centralDormant + centralSpeechGlow);
  
  // -------------------------------------------------------------
  // 3. COMPOSITE SHADER OUTPUT
  // -------------------------------------------------------------
  // Bubble surface reflections
  vec3 bubbleRimColor = mix(iridColor, glancingIrid, fresnel) * (fresnel * 1.35 + 0.12);
  vec3 bubbleSpecColor = vec3(1.0) * (spec1 + spec2 + broadSpec);
  
  // Bubble glass transparency (crystal clear center in silence, illuminated by plasma during speech)
  float bubbleAlpha = clamp(fresnel * 0.82 + (spec1 + spec2) * 0.88 + totalLightning * 0.75 + surge * 0.25 + 0.06, 0.0, 0.98);
  
  // Final composite: Iridescent Soap Bubble + Glowing Internal Electric Plasma
  vec3 finalColor = bubbleRimColor + bubbleSpecColor + (electricPlasma * totalLightning * 1.7) + interiorCoreGlow;

  gl_FragColor = vec4(finalColor, bubbleAlpha);
}
`;
