import { PitchDetector } from 'pitchy';

const SAMPLE_RATE = 44100;
const MIN_PITCH = 70;
const MAX_PITCH = 400;

export function detectPitch(samples: Float32Array): number | null {
  if (samples.length < 2048) return null;

  const detector = PitchDetector.forFloat32Array(samples.length);
  const [pitch, clarity] = detector.findPitch(samples, SAMPLE_RATE);

  if (clarity < 0.85 || pitch < MIN_PITCH || pitch > MAX_PITCH) return null;
  return pitch;
}

export function averagePitch(pitchValues: number[]): number {
  const valid = pitchValues.filter((p) => p > 0);
  if (valid.length === 0) return 0;
  return valid.reduce((s, v) => s + v, 0) / valid.length;
}
