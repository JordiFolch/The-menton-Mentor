import Voice, {
  SpeechResultsEvent,
  SpeechErrorEvent,
  SpeechStartEvent,
} from '@react-native-voice/voice';

type ResultCallback = (text: string, isFinal: boolean) => void;
type ErrorCallback = (error: string) => void;

let currentLocale = 'es-ES';
let onResult: ResultCallback | null = null;
let onError: ErrorCallback | null = null;
let isListening = false;

export function setupSpeechService(
  resultCb: ResultCallback,
  errorCb: ErrorCallback
): void {
  onResult = resultCb;
  onError = errorCb;

  Voice.onSpeechResults = (e: SpeechResultsEvent) => {
    const text = e.value?.[0] ?? '';
    if (text && onResult) onResult(text, true);
  };

  Voice.onSpeechPartialResults = (e: SpeechResultsEvent) => {
    const text = e.value?.[0] ?? '';
    if (text && onResult) onResult(text, false);
  };

  Voice.onSpeechError = (e: SpeechErrorEvent) => {
    const msg = e.error?.message ?? 'Unknown error';
    if (msg.includes('7') || msg.includes('No match')) {
      restartListening();
      return;
    }
    if (onError) onError(msg);
  };

  Voice.onSpeechEnd = () => {
    if (isListening) restartListening();
  };
}

export async function startListening(locale: string): Promise<void> {
  currentLocale = locale;
  isListening = true;
  try {
    await Voice.start(locale);
  } catch {
    // Ignore start errors, will be caught by onSpeechError
  }
}

export async function stopListening(): Promise<void> {
  isListening = false;
  try {
    await Voice.stop();
    await Voice.destroy();
  } catch {
    // Ignore stop errors
  }
}

export async function switchLocale(locale: string): Promise<void> {
  if (locale === currentLocale) return;
  currentLocale = locale;
  if (isListening) {
    try {
      await Voice.stop();
      await Voice.start(locale);
    } catch {
      // Ignore
    }
  }
}

export function destroySpeechService(): void {
  onResult = null;
  onError = null;
  isListening = false;
  Voice.destroy().catch(() => {});
}

async function restartListening(): Promise<void> {
  if (!isListening) return;
  try {
    await Voice.start(currentLocale);
  } catch {
    // Ignore
  }
}
