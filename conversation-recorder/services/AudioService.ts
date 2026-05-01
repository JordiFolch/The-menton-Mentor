import { Audio } from 'expo-av';

let recording: Audio.Recording | null = null;
let amplitudeCallback: ((amp: number) => void) | null = null;
let amplitudeInterval: ReturnType<typeof setInterval> | null = null;

export async function requestAudioPermissions(): Promise<boolean> {
  const { status } = await Audio.requestPermissionsAsync();
  return status === 'granted';
}

export async function startRecording(
  onAmplitude: (amp: number) => void
): Promise<void> {
  if (amplitudeInterval) {
    clearInterval(amplitudeInterval);
    amplitudeInterval = null;
  }
  amplitudeCallback = onAmplitude;

  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });

  const { recording: rec } = await Audio.Recording.createAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );
  recording = rec;

  amplitudeInterval = setInterval(async () => {
    if (!recording) return;
    const status = await recording.getStatusAsync();
    if (status.isRecording && status.metering !== undefined) {
      const normalized = Math.max(0, Math.min(1, (status.metering + 60) / 60));
      amplitudeCallback?.(normalized);
    }
  }, 80);
}

export async function stopRecording(): Promise<string | null> {
  if (amplitudeInterval) {
    clearInterval(amplitudeInterval);
    amplitudeInterval = null;
  }
  amplitudeCallback = null;

  if (!recording) return null;

  await recording.stopAndUnloadAsync();
  const uri = recording.getURI();
  recording = null;

  await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
  return uri ?? null;
}

export function isRecordingActive(): boolean {
  return recording !== null;
}
