export interface Speaker {
  id: string;
  name: string;
  color: string;
  pitchMean: number;
  pitchSamples: number[];
}

export interface Segment {
  id: string;
  text: string;
  speakerId: string;
  startTime: number;
  language: string;
  pitchMean?: number;
}

export interface Session {
  id: string;
  title: string;
  createdAt: string;
  duration: number;
  segments: Segment[];
  speakers: Speaker[];
  detectedLanguage: string;
}
