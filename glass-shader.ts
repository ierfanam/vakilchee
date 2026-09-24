/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Physical Clear Blue-Tinted Glass Shader with Realistic Reflections, 
 * Chromatic Light Refraction, Studio Lighting, and Caustic Depth.
 */

export const glassVS = `
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

  // Gentle acoustic wave along the upright vertical axis and circumference
  float distFromPole = length(position.xz);
  float wave1 = sin(position.y * 7.5 - time * 3.5) * (0.004 + audioIntensity * 0.025);
  float wave2 = cos(distFromPole * 10.0 + position.y * 5.0 - time * 4.0) * (0.003 + audioIntensity * 0.018);
  float acousticWave = wave1 + wave2;
  vAcousticWave = acousticWave;

  // Preserve upright sculpted form with subtle harmonic refraction displacement
  vec3 displacedPos = position + normal * acousticWave;

  vNormal = normalize(normalMatrix * normal);
  
  vec4 worldPos = modelMatrix * vec4(displacedPos, 1.0);
  vWorldPosition = worldPos.xyz;
  
  vec4 mvPosition = modelViewMatrix * vec4(displacedPos, 1.0);
  vViewPosition = -mvPosition.xyz;
  
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const glassFS = `
precision highp float;

uniform float time;
uniform float audioIntensity;
uniform vec3 glassColor;       // Clear blue tint base: rgb(180, 225, 255)
uniform vec3 glassCoreColor;   // Deep refraction blue: rgb(20, 130, 230)
uniform vec3 studioLightColor; // Pure studio highlight: rgb(255, 255, 255)

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;
varying vec3 vLocalPosition;
varying vec2 vUv;
varying float vAcousticWave;

// Studio environment map synthesis for clean minimalistic white studio
vec3 evaluateStudioEnvironment(vec3 ray) {
  // Plain white studio floor & ceiling with soft diffused softbox lights
  float y = ray.y;
  
  // Base plain white studio backdrop
  vec3 env = vec3(0.97, 0.98, 0.99);

  // Soft horizon floor gradient
  if (y < -0.1) {
    float floorDist = clamp(-y, 0.0, 1.0);
    env = mix(vec3(0.96, 0.97, 0.98), vec3(0.92, 0.93, 0.95), floorDist * 0.7);
  }

  // Key Studio Softbox 1 (Top-Right, large photographic diffuser)
  vec3 softbox1Dir = normalize(vec3(0.65, 0.75, 0.55));
  float sb1Dot = max(dot(ray, softbox1Dir), 0.0);
  float softbox1 = pow(sb1Dot, 12.0) * 1.6 + pow(sb1Dot, 3.5) * 0.45;
  env += vec3(1.0, 1.0, 1.0) * softbox1;

  // Key Studio Softbox 2 (Top-Left, cool fill light)
  vec3 softbox2Dir = normalize(vec3(-0.75, 0.60, 0.40));
  float sb2Dot = max(dot(ray, softbox2Dir), 0.0);
  float softbox2 = pow(sb2Dot, 16.0) * 1.2 + pow(sb2Dot, 4.0) * 0.35;
  env += vec3(0.92, 0.96, 1.0) * softbox2;

  // Studio Rim Light (Back-Top, razor crisp contour)
  vec3 rimDir = normalize(vec3(0.0, 0.85, -0.75));
  float rimDot = max(dot(ray, rimDir), 0.0);
  float rimLight = pow(rimDot, 24.0) * 2.2;
  env += vec3(0.95, 0.98, 1.0) * rimLight;

  return env;
}

void main() {
  vec3 V = normalize(vViewPosition);
  vec3 N = normalize(vNormal);

  // Optical wave perturbation on glass surface
  vec3 perturbedNormal = normalize(N + vec3(
    sin(vLocalPosition.y * 12.0 + time * 2.5) * (0.015 + audioIntensity * 0.05),
    cos(vLocalPosition.x * 12.0 + time * 2.5) * (0.015 + audioIntensity * 0.05),
    vAcousticWave * 2.5
  ));

  float NdotV = clamp(dot(perturbedNormal, V), 0.0, 1.0);

  // 1. Realistic Fresnel Reflection (Schlick's approximation for crown glass, IOR ~ 1.52)
  float F0 = 0.045; // Reflectance at normal incidence
  float fresnel = F0 + (1.0 - F0) * pow(1.0 - NdotV, 4.8);

  // 2. Realistic Chromatic Dispersion Refraction (Red, Green, Blue refract at slightly different angles)
  float etaR = 1.0 / 1.495; // Red IOR
  float etaG = 1.0 / 1.515; // Green IOR
  float etaB = 1.0 / 1.535; // Blue IOR

  vec3 refractR = refract(-V, perturbedNormal, etaR);
  vec3 refractG = refract(-V, perturbedNormal, etaG);
  vec3 refractB = refract(-V, perturbedNormal, etaB);

  // Sample virtual studio environment along dispersed refraction rays
  float envR = evaluateStudioEnvironment(refractR).r;
  float envG = evaluateStudioEnvironment(refractG).g;
  float envB = evaluateStudioEnvironment(refractB).b;
  vec3 refractedLight = vec3(envR, envG, envB);

  // 3. Volumetric Beer-Lambert Absorption inside Clear Blue-Tinted Glass
  // Thicker optical path through glass center absorbs red and enhances clear blue tint
  float opticalThickness = pow(1.0 - NdotV, 1.4) * 1.5 + (1.0 - NdotV * 0.65);
  
  // Clear blue tint color gradient: pristine pale sky blue to vivid crystalline azure
  vec3 transmittedTint = mix(
    vec3(0.86, 0.94, 0.99), // Very clear light blue
    glassCoreColor,          // Deep cyan-blue optical core
    clamp(opticalThickness * 0.65, 0.0, 1.0)
  );

  // Combine refraction with internal clear blue absorption
  vec3 internalVolume = refractedLight * transmittedTint;

  // Internal optical caustics shimmer
  float causticPattern = sin(vLocalPosition.x * 16.0 + vLocalPosition.y * 12.0 + time * 1.8) *
                         cos(vLocalPosition.z * 16.0 - vLocalPosition.y * 8.0 + time * 1.4);
  float caustics = smoothstep(0.3, 0.85, causticPattern) * (0.15 + audioIntensity * 0.45);
  internalVolume += vec3(0.3, 0.75, 1.0) * caustics * (1.0 - NdotV);

  // 4. Exterior Studio Surface Reflection
  vec3 reflectDir = reflect(-V, perturbedNormal);
  vec3 reflectedStudio = evaluateStudioEnvironment(reflectDir);

  // 5. Crisp Specular Studio Lighting Highlights
  // Key Studio Softbox 1 Highlight
  vec3 L1 = normalize(vec3(0.65, 0.85, 0.65));
  vec3 H1 = normalize(L1 + V);
  float NdotH1 = max(dot(perturbedNormal, H1), 0.0);
  float spec1_sharp = pow(NdotH1, 140.0) * 2.8;
  float spec1_soft  = pow(NdotH1, 24.0) * 0.45;
  vec3 specHighlight1 = vec3(1.0, 1.0, 1.0) * (spec1_sharp + spec1_soft);

  // Key Studio Softbox 2 Fill Highlight
  vec3 L2 = normalize(vec3(-0.75, 0.65, 0.45));
  vec3 H2 = normalize(L2 + V);
  float NdotH2 = max(dot(perturbedNormal, H2), 0.0);
  float spec2 = pow(NdotH2, 90.0) * 1.6;
  vec3 specHighlight2 = vec3(0.85, 0.94, 1.0) * spec2;

  // Razor Top Rim Glint
  vec3 L3 = normalize(vec3(0.0, 1.0, 0.1));
  vec3 H3 = normalize(L3 + V);
  float spec3 = pow(max(dot(perturbedNormal, H3), 0.0), 180.0) * 3.2;
  vec3 rimGlint = vec3(1.0, 1.0, 1.0) * spec3;

  // 6. Final Glass Surface & Volume Blending
  // Mix internal clear blue refracted light with exterior studio reflection via Fresnel
  vec3 finalColor = mix(internalVolume, reflectedStudio, fresnel);

  // Add crisp studio specular highlights
  finalColor += specHighlight1 + specHighlight2 + rimGlint;

  // Delicate blue-tinted glass contour rim enhancement
  float glassRim = pow(1.0 - NdotV, 3.2);
  finalColor += vec3(0.15, 0.65, 1.0) * glassRim * 0.6;

  // Glass transparency: slightly more transparent in the center, more opaque at glancing angles
  float alpha = clamp(0.78 + fresnel * 0.22, 0.72, 0.98);

  gl_FragColor = vec4(finalColor, alpha);
}
`;
