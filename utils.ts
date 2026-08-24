/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import {Blob} from '@google/genai';

function encode(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function resampleTo16kHz(audioData: Float32Array, inputSampleRate: number): Float32Array {
  if (inputSampleRate === 16000 || !inputSampleRate) {
    return audioData;
  }
  const ratio = inputSampleRate / 16000;
  const newLength = Math.round(audioData.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const originPos = i * ratio;
    const index = Math.floor(originPos);
    const decimal = originPos - index;
    const nextIndex = Math.min(index + 1, audioData.length - 1);
    result[i] = audioData[index] * (1 - decimal) + audioData[nextIndex] * decimal;
  }
  return result;
}

function createBlob(data: Float32Array, inputSampleRate = 16000): Blob {
  const resampled = inputSampleRate !== 16000 ? resampleTo16kHz(data, inputSampleRate) : data;
  const l = resampled.length;
  const int16 = new Int16Array(l);
  
  // Calculate RMS energy for gentle noise floor attenuation
  let sumSquares = 0;
  for (let i = 0; i < l; i++) {
    sumSquares += resampled[i] * resampled[i];
  }
  const rms = Math.sqrt(sumSquares / (l || 1));
  const isNearSilent = rms < 0.0008; // quiet room background noise threshold

  for (let i = 0; i < l; i++) {
    let sample = resampled[i];
    if (isNearSilent) {
      sample *= 0.2; // soft noise gate
    }
    // convert float32 -1 to 1 to int16 -32768 to 32767
    int16[i] = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
  }

  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const numSamples = Math.floor(data.byteLength / 2);
  const buffer = ctx.createBuffer(
    numChannels,
    Math.max(1, Math.floor(numSamples / numChannels)),
    sampleRate,
  );

  const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const dataFloat32 = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    dataFloat32[i] = dataView.getInt16(i * 2, true) / 32768.0;
  }

  if (numChannels === 1) {
    buffer.copyToChannel(dataFloat32, 0);
  } else {
    const channelLength = Math.floor(numSamples / numChannels);
    for (let c = 0; c < numChannels; c++) {
      const channelData = new Float32Array(channelLength);
      for (let i = 0, j = c; i < channelLength && j < numSamples; i++, j += numChannels) {
        channelData[i] = dataFloat32[j];
      }
      buffer.copyToChannel(channelData, c);
    }
  }

  return buffer;
}

export {createBlob, decode, decodeAudioData, encode};
