/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Vertex shader for the Point Cloud Sphere
export const pointCloudVS = `
precision highp float;

attribute vec3 position;
attribute vec2 uv;
attribute float pointIndex;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;

uniform float time;
uniform vec4 inputData;
uniform vec4 outputData;
uniform float pixelRatio;
uniform float basePointSize;

varying vec3 vNormal;
varying vec3 vPosition;
varying float vIntensity;
varying float vDistance;

#define PI 3.14159265359

vec3 calcPointDeformation(vec3 pos, vec2 uvCoord) {
  vec3 dir = normalize(pos);
  
  // Wave harmonics based on sound frequency bands
  float inAmp = inputData.x * inputData.y;
  float outAmp = outputData.x * outputData.y;
  
  float latWave = sin(pos.y * 4.0 + time * 3.0);
  float lonWave = cos(pos.x * 4.0 + time * 2.5);
  float radialWave = sin(pos.z * 5.0 + time * 4.0);
  
  // Audio reactive harmonic displacement
  float displacement = 
    (inAmp * 0.45 * (latWave + lonWave)) +
    (outAmp * 0.75 * (radialWave * sin(pos.y * 6.0 + time * 5.0) + latWave * 0.5));
    
  // Gentle breathing idle displacement
  float idleBreath = sin(time * 1.5 + pos.y * 2.0) * 0.025;
  
  return pos + dir * (displacement + idleBreath);
}

void main() {
  vec3 deformed = calcPointDeformation(position, uv);
  vPosition = deformed;
  
  vec3 norm = normalize(deformed);
  vNormal = normalMatrix * norm;
  
  vec4 mvPosition = modelViewMatrix * vec4(deformed, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  
  vDistance = -mvPosition.z;
  
  // Point size attenuation with distance and audio responsiveness
  float audioScale = 1.0 + (outputData.x * 0.8) + (inputData.x * 0.5);
  float size = (basePointSize * pixelRatio) / (-mvPosition.z * 0.28);
  
  // Clamping size for pristine crisp rendering
  gl_PointSize = clamp(size * audioScale, 2.0 * pixelRatio, 16.0 * pixelRatio);
  
  // Calculate luminescence intensity based on depth & audio
  float depthFactor = smoothstep(-1.2, 1.2, deformed.z);
  vIntensity = depthFactor * 0.7 + 0.3 + (outputData.x * 0.5);
}
`;

// Fragment shader for the luminous Point Cloud Sphere dots
export const pointCloudFS = `
precision highp float;

uniform vec3 primaryColor;
uniform vec3 secondaryColor;
uniform vec3 coreColor;
uniform float time;
uniform vec4 outputData;

varying vec3 vNormal;
varying vec3 vPosition;
varying float vIntensity;
varying float vDistance;

void main() {
  // Compute circular point sprite coordinate
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);
  
  if (dist > 0.5) {
    discard;
  }
  
  // Crisp circular edge with soft glowing halo
  float circleAlpha = smoothstep(0.5, 0.15, dist);
  float coreGlow = exp(-dist * 5.5);
  
  // Dynamic color gradient between deep electric cyan, vibrant turquoise, and luminous white core
  vec3 dotColor = mix(secondaryColor, primaryColor, vIntensity);
  vec3 finalColor = mix(dotColor, coreColor, coreGlow * 0.85 + (outputData.x * 0.3));
  
  // Depth opacity: front points are crisp and bright, rear points have gentle translucency
  float alpha = circleAlpha * (vIntensity * 0.75 + 0.25);
  
  gl_FragColor = vec4(finalColor, alpha);
}
`;
