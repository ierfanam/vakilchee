/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import type {Blob} from '@google/genai';

/** Encode bytes as base64 without creating an unnecessarily large argument list. */
function encode(bytes: Uint8Array): string {
  const CHUNK_SIZE = 0x8000;
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
    const chunk = bytes.subarray(offset, Math.min(offset + CHUNK_SIZE, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function resampleTo16kHz(audioData: Float32Array, inputSampleRate: number): Float32Array {
  if (!inputSampleRate || inputSampleRate === 16000 || audioData.length === 0) {
    return audioData;
  }

  const ratio = inputSampleRate / 16000;
  const newLength = Math.max(1, Math.round(audioData.length / ratio));
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const originPos = i * ratio;
    const index = Math.min(Math.floor(originPos), audioData.length - 1);
    const decimal = originPos - index;
    const nextIndex = Math.min(index + 1, audioData.length - 1);
    result[i] = audioData[index] * (1 - decimal) + audioData[nextIndex] * decimal;
  }

  return result;
}

function createBlob(data: Float32Array, inputSampleRate = 16000): Blob {
  const resampled = resampleTo16kHz(data, inputSampleRate);
  const int16 = new Int16Array(resampled.length);

  // Gentle attenuation for genuinely silent input; preserve normal speech unchanged.
  let sumSquares = 0;
  for (const sample of resampled) {
    sumSquares += sample * sample;
  }
  const rms = Math.sqrt(sumSquares / Math.max(1, resampled.length));
  const isNearSilent = rms < 0.0008;

  for (let i = 0; i < resampled.length; i++) {
    const sample = isNearSilent ? resampled[i] * 0.2 : resampled[i];
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
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) {
    throw new Error('Invalid audio sample rate.');
  }
  if (!Number.isInteger(numChannels) || numChannels < 1) {
    throw new Error('Invalid audio channel count.');
  }
  if (data.byteLength % 2 !== 0) {
    throw new Error('PCM audio data must contain complete 16-bit samples.');
  }

  const numSamples = data.byteLength / 2;
  const frames = Math.max(1, Math.floor(numSamples / numChannels));
  const buffer = ctx.createBuffer(numChannels, frames, sampleRate);
  const dataView = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const dataFloat32 = new Float32Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    dataFloat32[i] = dataView.getInt16(i * 2, true) / 32768;
  }

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = new Float32Array(frames);
    for (let frame = 0; frame < frames; frame++) {
      const sourceIndex = frame * numChannels + channel;
      channelData[frame] = sourceIndex < numSamples ? dataFloat32[sourceIndex] : 0;
    }
    buffer.copyToChannel(channelData, channel);
  }

  return buffer;
}

export {createBlob, decode, decodeAudioData, encode};
