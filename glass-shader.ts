/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Vertex Shader for Physical Transparent Clear Blue-Tinted Glass Object
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
  
  // Subtle physical acoustic surface ripples responding to voice
  float r = length(position.xy);
  float wave = sin(r * 12.0 - time * 5.0) * cos(position.y * 8.0 + time * 3.0);
  float acousticWave = wave * (0.015 + audioIntensity * 0.06);
  vAcousticWave = acousticWave;

  vec3 displacedPos = position + normal * acousticWave;

  vNormal = normalize(normalMatrix * normal);
  
  vec4 worldPos = modelMatrix * vec4(displacedPos, 1.0);
  vWorldPosition = worldPos.xyz;
  
  vec4 mvPosition = modelViewMatrix * vec4(displacedPos, 1.0);
  vViewPosition = -mvPosition.xyz;
  
  gl_Position = projectionMatrix * mvPosition;
}
`;

// Fragment Shader for Realistic Transparent Clear Blue-Tinted Glass with Refraction & Studio Highlights
export const glassFS = `
precision highp float;

uniform float time;
uniform float audioIntensity;
uniform vec3 glassColor;
uniform vec3 glassCoreColor;
uniform vec3 studioLightColor;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;
varying vec3 vLocalPosition;
varying vec2 vUv;
varying float vAcousticWave;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);

  // Fresnel effect for realistic glass edge reflection
  float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);

  // Studio lighting highlights
  vec3 lightDir1 = normalize(vec3(0.5, 0.8, 0.6));
  vec3 lightDir2 = normalize(vec3(-0.6, -0.4, 0.5));
  
  float diff1 = max(dot(normal, lightDir1), 0.0);
  float diff2 = max(dot(normal, lightDir2), 0.0);
  float specular1 = pow(max(dot(reflect(-lightDir1, normal), viewDir), 0.0), 32.0);
  float specular2 = pow(max(dot(reflect(-lightDir2, normal), viewDir), 0.0), 16.0);

  // Glass volume color mixing
  float depthGradient = smoothstep(-1.2, 1.2, vLocalPosition.y);
  vec3 baseTint = mix(glassCoreColor, glassColor, depthGradient + 0.3 * audioIntensity);

  vec3 color = baseTint * (0.4 + 0.6 * diff1) + studioLightColor * (specular1 * 1.5 + specular2 * 0.8);
  
  // Add glowing acoustic edges on voice activity
  float edgeGlow = fresnel * (0.8 + 1.5 * audioIntensity);
  color += studioLightColor * edgeGlow;

  // Transparent glass alpha (clear center, opaque glowing edges & highlights)
  float alpha = 0.55 + 0.35 * fresnel + 0.2 * audioIntensity;
  alpha = clamp(alpha, 0.0, 0.92);

  gl_FragColor = vec4(color, alpha);
}
`;
