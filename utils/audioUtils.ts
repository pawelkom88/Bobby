// Audio processing utilities for Deepgram Voice Agent

import {logger} from "@/lib/logger";

export function createAudioBuffer(
  audioContext: AudioContext,
  data: ArrayBuffer,
  sampleRate = 24000
) {
  const audioDataView = new Int16Array(data);
  if (audioDataView.length === 0) {
    logger.error('Received audio data is empty.');
    return;
  }

  // Create a buffer with 1 channel
  const buffer = audioContext.createBuffer(1, audioDataView.length, sampleRate);
  const channelData = buffer.getChannelData(0);

  // Convert linear16 PCM to float [-1, 1]
  for (let i = 0; i < audioDataView.length; i++) {
    channelData[i] = audioDataView[i] / 32768;
  }

  return buffer;
}

export function playAudioBuffer(
  audioContext: AudioContext,
  buffer: AudioBuffer,
  startTimeRef: React.RefObject<number>,
  analyser?: AnalyserNode
) {
  const source = audioContext.createBufferSource();
  source.buffer = buffer;

  if (analyser) {
    source.connect(analyser);
    analyser.connect(audioContext.destination);
  } else {
    source.connect(audioContext.destination);
  }

  const currentTime = audioContext.currentTime;

  // Ensure we schedule slightly in the future if we fell behind
  if (startTimeRef.current < currentTime) {
    startTimeRef.current = currentTime;
  }

  source.start(startTimeRef.current);
  startTimeRef.current += buffer.duration;

  return source;
}

export function downsample(
  buffer: Float32Array,
  fromSampleRate: number,
  toSampleRate: number
) {
  if (fromSampleRate === toSampleRate) {
    return buffer;
  }
  const sampleRateRatio = fromSampleRate / toSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    let accum = 0,
      count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = accum / count;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

export function convertFloat32ToInt16(buffer: Float32Array) {
  let l = buffer.length;
  const buf = new Int16Array(l);
  while (l--) {
    buf[l] = Math.min(1, buffer[l]) * 0x7fff;
  }
  return buf;
}
