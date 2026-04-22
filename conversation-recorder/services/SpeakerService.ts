import { Speaker, Segment } from '../types';
import { kmeans, clusterMeans } from '../utils/kmeans';
import { theme } from '../constants/theme';

let pitchHistory: { segmentId: string; pitch: number }[] = [];

export function recordPitch(segmentId: string, pitch: number): void {
  pitchHistory.push({ segmentId, pitch });
}

export function clearPitchHistory(): void {
  pitchHistory = [];
}

export function assignSpeakers(
  segments: Segment[],
  numSpeakers: number
): { segments: Segment[]; speakers: Speaker[] } {
  const validSegments = segments.filter((seg) => {
    const pitches = pitchHistory
      .filter((p) => p.segmentId === seg.id)
      .map((p) => p.pitch);
    return pitches.length > 0;
  });

  if (validSegments.length === 0) {
    const speakers = buildSpeakers(numSpeakers, []);
    return { segments, speakers };
  }

  const segmentPitches = validSegments.map((seg) => {
    const pitches = pitchHistory
      .filter((p) => p.segmentId === seg.id)
      .map((p) => p.pitch);
    return pitches.reduce((s, v) => s + v, 0) / pitches.length;
  });

  const k = Math.min(numSpeakers, validSegments.length);
  const assignments = kmeans(segmentPitches, k);
  const means = clusterMeans(segmentPitches, assignments, k);
  const speakers = buildSpeakers(numSpeakers, means);

  const updatedSegments = segments.map((seg) => {
    const idx = validSegments.findIndex((vs) => vs.id === seg.id);
    if (idx < 0) return seg;
    const cluster = assignments[idx];
    return {
      ...seg,
      speakerId: speakers[cluster % speakers.length].id,
      pitchMean: segmentPitches[idx],
    };
  });

  return { segments: updatedSegments, speakers };
}

function buildSpeakers(numSpeakers: number, means: number[]): Speaker[] {
  return Array.from({ length: numSpeakers }, (_, i) => ({
    id: `speaker-${i}`,
    name: `Parlant ${i + 1}`,
    color: theme.speakerColors[i % theme.speakerColors.length],
    pitchMean: means[i] ?? 0,
    pitchSamples: [],
  }));
}

export function reassignSegmentSpeaker(
  segments: Segment[],
  segmentId: string,
  newSpeakerId: string
): Segment[] {
  return segments.map((seg) =>
    seg.id === segmentId ? { ...seg, speakerId: newSpeakerId } : seg
  );
}
