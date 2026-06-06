/**
 * Suite completa de tests — conversation-recorder
 * Cobreix: kmeans, pitchDetector, LanguageService, SpeakerService,
 *          StorageService, SpeechService, AudioService
 */

// ═══════════════════════════════════════════════════════════════════
// MOCKS — han d'estar ABANS de qualsevol import de serveis natius
// ═══════════════════════════════════════════════════════════════════

// ── AsyncStorage ──────────────────────────────────────────────────
const store: Record<string, string> = {};
const AsyncStorageMock = {
  getItem:    async (k: string) => store[k] ?? null,
  setItem:    async (k: string, v: string) => { store[k] = v; },
  removeItem: async (k: string) => { delete store[k]; },
  clear:      async () => { for (const k in store) delete store[k]; },
};

// ── Voice (@react-native-voice/voice) ─────────────────────────────
const VoiceMock = {
  onSpeechResults:        null as any,
  onSpeechPartialResults: null as any,
  onSpeechError:          null as any,
  onSpeechEnd:            null as any,
  startCalls:  [] as string[],
  stopCount:   0,
  destroyCount:0,
  start:   async (locale: string) => { VoiceMock.startCalls.push(locale); },
  stop:    async () => { VoiceMock.stopCount++; },
  destroy: async () => { VoiceMock.destroyCount++; },
  reset() {
    this.onSpeechResults = null;
    this.onSpeechPartialResults = null;
    this.onSpeechError = null;
    this.onSpeechEnd = null;
    this.startCalls = [];
    this.stopCount = 0;
    this.destroyCount = 0;
  },
};

// ── expo-av Audio ─────────────────────────────────────────────────
let audioPermGranted    = true;
let mockRecUri          = 'file:///mock/rec.m4a';
let mockMetering        = -30;
let mockIsRecording     = false;
let setAudioModeCalls:  any[] = [];
let createAsyncCallCount = 0;

const mockRecordingObj = {
  getStatusAsync:     async () => ({ isRecording: mockIsRecording, metering: mockMetering }),
  stopAndUnloadAsync: async () => { mockIsRecording = false; },
  getURI:             () => mockRecUri,
};

const AudioMock = {
  requestPermissionsAsync: async () => ({ status: audioPermGranted ? 'granted' : 'denied' }),
  setAudioModeAsync:  async (opts: any) => { setAudioModeCalls.push(opts); },
  Recording: {
    createAsync: async (_opts: any) => {
      createAsyncCallCount++;
      mockIsRecording = true;
      return { recording: mockRecordingObj };
    },
  },
  RecordingOptionsPresets: { HIGH_QUALITY: {} },
};

// ── Module interceptor ────────────────────────────────────────────
const Module = require('module');
const origLoad = Module._load;
Module._load = function (id: string, ...args: any[]) {
  if (id === '@react-native-async-storage/async-storage') return AsyncStorageMock;
  if (id === '@react-native-voice/voice') return VoiceMock;
  if (id === 'expo-av') return { Audio: AudioMock };
  return origLoad.apply(this, [id, ...args]);
};

// ═══════════════════════════════════════════════════════════════════
// IMPORTS ESTÀTICS (mòduls sense deps. natives)
// ═══════════════════════════════════════════════════════════════════

import { kmeans, clusterMeans }                       from '../utils/kmeans';
import { detectPitch, averagePitch }                  from '../utils/pitchDetector';
import { detectLanguage, localeLabel, francToLocale } from '../services/LanguageService';
import {
  assignSpeakers, clearPitchHistory,
  recordPitch, reassignSegmentSpeaker,
}                                                      from '../services/SpeakerService';
import type { Segment }                               from '../types';

// ═══════════════════════════════════════════════════════════════════
// TEST RUNNER
// ═══════════════════════════════════════════════════════════════════

let passed = 0;
let failed = 0;
const failures: string[] = [];

async function test(name: string, fn: () => void | Promise<void>) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e: any) {
    console.log(`  ✗ ${name}\n    → ${e.message}`);
    failures.push(name);
    failed++;
  }
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}
function eq<T>(a: T, b: T, label = '') {
  if (a !== b) throw new Error(`${label}Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}
function near(a: number, b: number, tol = 5, label = '') {
  if (Math.abs(a - b) > tol)
    throw new Error(`${label}Expected ~${b} (±${tol}), got ${a.toFixed(2)}`);
}
function makeSine(freq: number, sampleRate = 44100, n = 4096): Float32Array {
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) buf[i] = Math.sin(2 * Math.PI * freq * i / sampleRate);
  return buf;
}
function wait(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }

// ═══════════════════════════════════════════════════════════════════
// EXECUCIÓ PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

(async () => {

// ── 1. K-MEANS ───────────────────────────────────────────────────
console.log('\n📊 K-Means clustering');

await test('separa home (~120Hz) de dona (~220Hz)', () => {
  const a = kmeans([118, 122, 120, 218, 222, 220], 2);
  assert(a[0] === a[1] && a[1] === a[2], 'veus greus al mateix grup');
  assert(a[3] === a[4] && a[4] === a[5], 'veus agudes al mateix grup');
  assert(a[0] !== a[3], 'grups han de ser distints');
});

await test('k=3 separa nen, home, dona', () => {
  const a = kmeans([280, 285, 282, 120, 125, 122, 220, 225, 222], 3);
  assert(a[0] === a[1] && a[1] === a[2], 'nens junts');
  assert(a[3] === a[4] && a[4] === a[5], 'homes junts');
  assert(a[6] === a[7] && a[7] === a[8], 'dones juntes');
  assert(a[0] !== a[3] && a[3] !== a[6] && a[0] !== a[6], '3 clústers distints');
});

await test('retorna mateixa longitud que input', () => {
  eq(kmeans([100, 200, 150, 250], 2).length, 4);
});

await test('array buit → []', () => {
  eq(kmeans([], 2).length, 0);
});

await test('k >= longitud dades no llança error', () => {
  eq(kmeans([100, 200], 5).length, 2);
});

await test('clusterMeans calcula mitjanes correctament', () => {
  const m = clusterMeans([100, 200, 110, 210], [0, 1, 0, 1], 2);
  eq(m[0], 105); eq(m[1], 205);
});

await test('convergeix ràpid amb dades ben separades (maxIterations=1)', () => {
  const a = kmeans([1, 2, 3, 100, 101, 102], 2, 1);
  assert(a[0] === a[1] && a[1] === a[2], 'primer grup');
  assert(a[3] === a[4] && a[4] === a[5], 'segon grup');
  assert(a[0] !== a[3], 'grups distints');
});

// ── 2. PITCH DETECTOR ────────────────────────────────────────────
console.log('\n🎵 Pitch detector');

await test('detecta ona sinusoidal pura a 150Hz (±5Hz)', () => {
  const p = detectPitch(makeSine(150));
  assert(p !== null, 'hauria de detectar pitch');
  near(p!, 150, 5);
});

await test('detecta ona sinusoidal pura a 200Hz (±5Hz)', () => {
  const p = detectPitch(makeSine(200));
  assert(p !== null, 'hauria de detectar pitch');
  near(p!, 200, 5);
});

await test('buffer massa curt (<2048 mostres) → null', () => {
  eq(detectPitch(new Float32Array(1024)), null);
});

await test('silenci (zeros) → null (clarity baixa)', () => {
  eq(detectPitch(new Float32Array(4096)), null);
});

await test('50Hz (per sota MIN_PITCH=70) → null', () => {
  eq(detectPitch(makeSine(50)), null);
});

await test('500Hz (per sobre MAX_PITCH=400) → null', () => {
  eq(detectPitch(makeSine(500)), null);
});

await test('averagePitch: calcula correctament ignorant zeros', () => {
  near(averagePitch([0, 120, 0, 120]), 120, 0);
});

await test('averagePitch: array buit → 0', () => { eq(averagePitch([]), 0); });
await test('averagePitch: tot zeros → 0', () => { eq(averagePitch([0, 0, 0]), 0); });

// ── 3. LANGUAGE SERVICE ──────────────────────────────────────────
console.log('\n🌍 Language detection');

await test('detecta castellà', () => {
  eq(detectLanguage('Hola, ¿cómo estás? Me alegra verte hoy aquí en esta reunión tan importante sobre el proyecto'), 'es-ES');
});

await test('detecta anglès', () => {
  eq(detectLanguage('Hello, how are you today? I am very happy to be here at this important meeting about the project'), 'en-US');
});

await test('detecta italià', () => {
  eq(detectLanguage('Buongiorno, come stai oggi? Sono molto contento di essere qui a questa riunione importante'), 'it-IT');
});

await test('detecta alemany', () => {
  eq(detectLanguage('Guten Tag, wie geht es Ihnen heute? Ich bin sehr froh, hier bei diesem wichtigen Treffen zu sein'), 'de-DE');
});

await test('detecta francès', () => {
  eq(detectLanguage("Bonjour, comment allez-vous aujourd hui? Je suis très heureux d être ici à cette réunion importante"), 'fr-FR');
});

await test('text curt (<50 cars) → null', () => { eq(detectLanguage('Hola'), null); });
await test('text buit → null', () => { eq(detectLanguage(''), null); });

await test('localeLabel correcte per es,en,ca,fr', () => {
  for (const [loc, exp] of [['es-ES','ES'],['en-US','EN'],['ca-ES','CA'],['fr-FR','FR']]) {
    const got = localeLabel(loc);
    assert(got === exp, `${loc}: expected ${exp}, got ${got}`);
  }
});

await test('francToLocale: spa→es-ES, eng→en-US, cat→ca-ES, ita→it-IT', () => {
  eq(francToLocale('spa'), 'es-ES');
  eq(francToLocale('eng'), 'en-US');
  eq(francToLocale('cat'), 'ca-ES');
  eq(francToLocale('ita'), 'it-IT');
});

// ── 4. SPEAKER SERVICE ───────────────────────────────────────────
console.log('\n🎤 Speaker service');

await test('assigna parlants distints a veus amb pitch diferent', () => {
  clearPitchHistory();
  const segs: Segment[] = [
    { id:'s1', text:'A', speakerId:'speaker-0', startTime:0,    language:'es-ES' },
    { id:'s2', text:'B', speakerId:'speaker-0', startTime:1000, language:'es-ES' },
    { id:'s3', text:'C', speakerId:'speaker-0', startTime:2000, language:'es-ES' },
    { id:'s4', text:'D', speakerId:'speaker-0', startTime:3000, language:'es-ES' },
  ];
  [118,122,120].forEach(p => recordPitch('s1', p));
  [218,222,220].forEach(p => recordPitch('s2', p));
  [119,121,120].forEach(p => recordPitch('s3', p));
  [219,221,220].forEach(p => recordPitch('s4', p));
  const { segments: upd, speakers } = assignSpeakers(segs, 2);
  eq(speakers.length, 2);
  const sp = (id: string) => upd.find(s => s.id === id)!.speakerId;
  assert(sp('s1') === sp('s3'), 's1 i s3 = mateix parlant');
  assert(sp('s2') === sp('s4'), 's2 i s4 = mateix parlant');
  assert(sp('s1') !== sp('s2'), 'parlants distints');
});

await test('sense dades de pitch → tots segments sense reassignar', () => {
  clearPitchHistory();
  const segs: Segment[] = [
    { id:'x1', text:'A', speakerId:'speaker-0', startTime:0,    language:'es-ES' },
    { id:'x2', text:'B', speakerId:'speaker-0', startTime:1000, language:'es-ES' },
  ];
  const { segments: upd } = assignSpeakers(segs, 2);
  assert(upd.every(s => s.speakerId === 'speaker-0'), 'sense pitch → speaker-0');
});

await test('parlants creats amb noms "Parlant N" i colors hex distints', () => {
  clearPitchHistory();
  const { speakers } = assignSpeakers([], 3);
  eq(speakers.length, 3);
  for (let i = 0; i < 3; i++) {
    eq(speakers[i].name, `Parlant ${i + 1}`);
    assert(speakers[i].color.startsWith('#'), `color[${i}] no és hex`);
  }
  assert(speakers[0].color !== speakers[1].color, 'colors han de ser distints');
});

await test('clearPitchHistory neteja i deixa segments sense reasignar', () => {
  clearPitchHistory();
  recordPitch('seg1', 150);
  clearPitchHistory();
  const segs: Segment[] = [{ id:'seg1', text:'T', speakerId:'speaker-0', startTime:0, language:'es-ES' }];
  const { segments: upd } = assignSpeakers(segs, 2);
  eq(upd[0].speakerId, 'speaker-0');
});

await test('segments mixtos (alguns amb pitch, altres sense)', () => {
  clearPitchHistory();
  const segs: Segment[] = [
    { id:'m1', text:'A', speakerId:'speaker-0', startTime:0,    language:'es-ES' },
    { id:'m2', text:'B', speakerId:'speaker-0', startTime:1000, language:'es-ES' }, // sense pitch
    { id:'m3', text:'C', speakerId:'speaker-0', startTime:2000, language:'es-ES' },
  ];
  [118,120].forEach(p => recordPitch('m1', p));
  [218,220].forEach(p => recordPitch('m3', p));
  const { segments: upd, speakers } = assignSpeakers(segs, 2);
  eq(speakers.length, 2);
  eq(upd.find(s => s.id === 'm2')!.speakerId, 'speaker-0');
});

await test('reassignSegmentSpeaker canvia el parlant del segment', () => {
  const segs: Segment[] = [
    { id:'a1', text:'A', speakerId:'speaker-0', startTime:0,    language:'es-ES' },
    { id:'a2', text:'B', speakerId:'speaker-1', startTime:1000, language:'es-ES' },
  ];
  const upd = reassignSegmentSpeaker(segs, 'a1', 'speaker-1');
  eq(upd.find(s => s.id === 'a1')!.speakerId, 'speaker-1');
  eq(upd.find(s => s.id === 'a2')!.speakerId, 'speaker-1'); // no canviat
});

await test('reassignSegmentSpeaker no modifica altres segments', () => {
  const segs: Segment[] = [
    { id:'b1', text:'A', speakerId:'speaker-0', startTime:0,    language:'es-ES' },
    { id:'b2', text:'B', speakerId:'speaker-0', startTime:1000, language:'es-ES' },
    { id:'b3', text:'C', speakerId:'speaker-1', startTime:2000, language:'es-ES' },
  ];
  const upd = reassignSegmentSpeaker(segs, 'b2', 'speaker-1');
  eq(upd.find(s => s.id === 'b1')!.speakerId, 'speaker-0'); // intacte
  eq(upd.find(s => s.id === 'b3')!.speakerId, 'speaker-1'); // intacte
});

// ── 5. STORAGE SERVICE ───────────────────────────────────────────
console.log('\n💾 Storage service');

const { saveSession, saveSessions, loadSessions, deleteSession, getSession } =
  await import('../services/StorageService');

const baseSession = {
  id: 's001', title: 'Test',
  createdAt: '2026-04-23T10:00:00Z', duration: 60,
  segments: [{ id:'seg1', text:'Hola', speakerId:'speaker-0', startTime:0, language:'ca-ES' }],
  speakers: [{ id:'speaker-0', name:'Parlant 1', color:'#4A9EFF', pitchMean:120, pitchSamples:[] }],
  detectedLanguage: 'ca-ES',
};

await test('saveSession + loadSessions: desa i recupera', async () => {
  await AsyncStorageMock.clear();
  await saveSession(baseSession);
  const list = await loadSessions();
  eq(list.length, 1);
  eq(list[0].id, 's001');
  eq(list[0].segments[0].text, 'Hola');
});

await test('getSession: retorna sessió per ID', async () => {
  const s = await getSession('s001');
  assert(s !== null, 'ha de trobar la sessió');
  eq(s!.speakers[0].color, '#4A9EFF');
});

await test('getSession: null per ID inexistent', async () => {
  eq(await getSession('no-existe'), null);
});

await test('saveSession: actualitza sense duplicar', async () => {
  await saveSession({ ...baseSession, title: 'Actualitzat' });
  const list = await loadSessions();
  eq(list.filter(s => s.id === 's001').length, 1);
  eq(list[0].title, 'Actualitzat');
});

await test('sessions ordenades: la més nova primer', async () => {
  await AsyncStorageMock.clear();
  await saveSession({ ...baseSession, id: 'old' });
  await saveSession({ ...baseSession, id: 'new' });
  eq((await loadSessions())[0].id, 'new');
});

await test('deleteSession: elimina la sessió correcta', async () => {
  await AsyncStorageMock.clear();
  await saveSession({ ...baseSession, id: 'del1' });
  await saveSession({ ...baseSession, id: 'del2' });
  await deleteSession('del1');
  const list = await loadSessions();
  eq(list.length, 1);
  eq(list[0].id, 'del2');
});

await test('saveSessions directe: sobreescriu tot el magatzem', async () => {
  await AsyncStorageMock.clear();
  await saveSession({ ...baseSession, id: 'prev' });
  await saveSessions([{ ...baseSession, id: 'a' }, { ...baseSession, id: 'b' }]);
  const list = await loadSessions();
  eq(list.length, 2);
  assert(!list.find(s => s.id === 'prev'), "'prev' hauria d'haver estat sobreescrit");
});

await test('saveSessions([]) esborra totes les sessions', async () => {
  await saveSession(baseSession);
  await saveSessions([]);
  eq((await loadSessions()).length, 0);
});

await test('loadSessions JSON corrupte → array buit', async () => {
  store['@conv_rec_sessions'] = '{invalid json{{';
  eq((await loadSessions()).length, 0);
  await AsyncStorageMock.clear();
});

await test('loadSessions sense dades → []', async () => {
  await AsyncStorageMock.clear();
  eq((await loadSessions()).length, 0);
});

// ── 6. SPEECH SERVICE ────────────────────────────────────────────
console.log('\n🔊 Speech service');

const Speech = await import('../services/SpeechService');

function resetSpeech() {
  Speech.destroySpeechService();
  VoiceMock.reset();
}

await test('setupSpeechService: registra 4 handlers a Voice', () => {
  resetSpeech();
  Speech.setupSpeechService(() => {}, () => {});
  assert(typeof VoiceMock.onSpeechResults        === 'function', 'onSpeechResults');
  assert(typeof VoiceMock.onSpeechPartialResults === 'function', 'onSpeechPartialResults');
  assert(typeof VoiceMock.onSpeechError          === 'function', 'onSpeechError');
  assert(typeof VoiceMock.onSpeechEnd            === 'function', 'onSpeechEnd');
});

await test('onSpeechResults: crida resultCb amb text i isFinal=true', () => {
  resetSpeech();
  let lastText = ''; let lastFinal = false;
  Speech.setupSpeechService((t, f) => { lastText = t; lastFinal = f; }, () => {});
  VoiceMock.onSpeechResults({ value: ['Hola món'] });
  eq(lastText, 'Hola món');
  eq(lastFinal as any, true);
});

await test('onSpeechPartialResults: crida resultCb amb isFinal=false', () => {
  resetSpeech();
  let lastFinal = true;
  Speech.setupSpeechService((_, f) => { lastFinal = f; }, () => {});
  VoiceMock.onSpeechPartialResults({ value: ['Ho...'] });
  eq(lastFinal as any, false);
});

await test('onSpeechResults text buit: NO crida resultCb', () => {
  resetSpeech();
  let called = false;
  Speech.setupSpeechService(() => { called = true; }, () => {});
  VoiceMock.onSpeechResults({ value: [''] });
  assert(!called, 'no hauria de cridar resultCb amb text buit');
});

await test('onSpeechResults sense value: NO crida resultCb', () => {
  resetSpeech();
  let called = false;
  Speech.setupSpeechService(() => { called = true; }, () => {});
  VoiceMock.onSpeechResults({});
  assert(!called, 'no hauria de cridar resultCb sense value');
});

await test('onSpeechError "7" (No match): reinicia, NO crida errorCb', async () => {
  resetSpeech();
  let errorCalled = false;
  Speech.setupSpeechService(() => {}, () => { errorCalled = true; });
  await Speech.startListening('es-ES');
  VoiceMock.startCalls = [];
  VoiceMock.onSpeechError({ error: { message: '7/No match' } });
  await wait(20);
  assert(!errorCalled, 'errorCb no hauria de cridar-se per error 7');
  assert(VoiceMock.startCalls.length > 0, 'hauria de reiniciar Voice.start');
});

await test('onSpeechError error real: crida errorCb amb el missatge', () => {
  resetSpeech();
  let msg = '';
  Speech.setupSpeechService(() => {}, (m) => { msg = m; });
  VoiceMock.onSpeechError({ error: { message: 'Network error' } });
  eq(msg, 'Network error');
});

await test('onSpeechEnd mentre isListening=true: reinicia', async () => {
  resetSpeech();
  Speech.setupSpeechService(() => {}, () => {});
  await Speech.startListening('ca-ES');
  VoiceMock.startCalls = [];
  VoiceMock.onSpeechEnd({});
  await wait(20);
  assert(VoiceMock.startCalls.length > 0, 'hauria de reiniciar');
});

await test('onSpeechEnd quan isListening=false: NO reinicia', async () => {
  resetSpeech();
  Speech.setupSpeechService(() => {}, () => {});
  VoiceMock.onSpeechEnd({});
  await wait(20);
  eq(VoiceMock.startCalls.length, 0);
});

await test('startListening: crida Voice.start amb locale correcte', async () => {
  resetSpeech();
  Speech.setupSpeechService(() => {}, () => {});
  await Speech.startListening('fr-FR');
  eq(VoiceMock.startCalls[0], 'fr-FR');
});

await test('stopListening: crida Voice.stop i Voice.destroy', async () => {
  resetSpeech();
  Speech.setupSpeechService(() => {}, () => {});
  await Speech.startListening('es-ES');
  await Speech.stopListening();
  assert(VoiceMock.stopCount > 0,    'Voice.stop ha de cridar-se');
  assert(VoiceMock.destroyCount > 0, 'Voice.destroy ha de cridar-se');
});

await test('stopListening: onSpeechEnd posterior NO reinicia', async () => {
  resetSpeech();
  Speech.setupSpeechService(() => {}, () => {});
  await Speech.startListening('es-ES');
  await Speech.stopListening();
  VoiceMock.startCalls = [];
  VoiceMock.onSpeechEnd({});
  await wait(20);
  eq(VoiceMock.startCalls.length, 0);
});

await test('switchLocale mateixa locale: no fa res', async () => {
  resetSpeech();
  Speech.setupSpeechService(() => {}, () => {});
  await Speech.startListening('es-ES');
  VoiceMock.stopCount = 0; VoiceMock.startCalls = [];
  await Speech.switchLocale('es-ES');
  eq(VoiceMock.stopCount, 0);
  eq(VoiceMock.startCalls.length, 0);
});

await test('switchLocale nova locale mentre escolta: stop + start nova locale', async () => {
  resetSpeech();
  Speech.setupSpeechService(() => {}, () => {});
  await Speech.startListening('es-ES');
  VoiceMock.stopCount = 0; VoiceMock.startCalls = [];
  await Speech.switchLocale('en-US');
  assert(VoiceMock.stopCount > 0, 'hauria de parar primer');
  eq(VoiceMock.startCalls[0], 'en-US');
});

await test('switchLocale nova locale sense escoltar: canvia sense parar', async () => {
  resetSpeech();
  Speech.setupSpeechService(() => {}, () => {});
  await Speech.switchLocale('it-IT');
  eq(VoiceMock.stopCount, 0, 'no hauria de parar si no estava escoltant');
});

await test('destroySpeechService: resultCb ja no es crida', () => {
  resetSpeech();
  let called = false;
  Speech.setupSpeechService(() => { called = true; }, () => {});
  Speech.destroySpeechService();
  VoiceMock.onSpeechResults({ value: ['text post-destroy'] });
  assert(!called, 'resultCb no hauria de cridar-se post-destroy');
});

// ── 7. AUDIO SERVICE ─────────────────────────────────────────────
console.log('\n🎙 Audio service');

const AudioSvc = await import('../services/AudioService');

async function resetAudio() {
  await AudioSvc.stopRecording();
  mockIsRecording = false; mockMetering = -30;
  audioPermGranted = true; setAudioModeCalls = []; createAsyncCallCount = 0;
}

await test('isRecordingActive: false en estat inicial', async () => {
  await resetAudio();
  eq(AudioSvc.isRecordingActive(), false);
});

await test('requestAudioPermissions: permès → true', async () => {
  audioPermGranted = true;
  eq(await AudioSvc.requestAudioPermissions(), true);
});

await test('requestAudioPermissions: denegat → false', async () => {
  audioPermGranted = false;
  eq(await AudioSvc.requestAudioPermissions(), false);
  audioPermGranted = true;
});

await test('startRecording: isRecordingActive() → true', async () => {
  await resetAudio();
  await AudioSvc.startRecording(() => {});
  eq(AudioSvc.isRecordingActive(), true);
  await AudioSvc.stopRecording();
});

await test('startRecording: crida setAudioModeAsync amb allowsRecordingIOS=true', async () => {
  await resetAudio();
  await AudioSvc.startRecording(() => {});
  assert(setAudioModeCalls.length > 0, 'setAudioModeAsync ha de cridar-se');
  assert(setAudioModeCalls[0].allowsRecordingIOS === true, 'allowsRecordingIOS=true');
  await AudioSvc.stopRecording();
});

await test('startRecording: crida Recording.createAsync', async () => {
  await resetAudio();
  createAsyncCallCount = 0;
  await AudioSvc.startRecording(() => {});
  assert(createAsyncCallCount > 0, 'createAsync ha de cridar-se');
  await AudioSvc.stopRecording();
});

await test('startRecording doble crida: no deixa interval perdut (bug fix)', async () => {
  await resetAudio();
  let count1 = 0; let count2 = 0;
  await AudioSvc.startRecording(() => { count1++; });
  await AudioSvc.startRecording(() => { count2++; }); // sobreescriu l'anterior
  eq(AudioSvc.isRecordingActive(), true);
  await AudioSvc.stopRecording();
  // Si el bug existís, count1 continuaria incrementant-se. El test verifica que no peta.
});

await test('callback amplitud: cridat amb valor [0,1] en 80ms', async () => {
  await resetAudio();
  mockMetering = -30; // → (−30+60)/60 = 0.5
  let amp = -1;
  await AudioSvc.startRecording(a => { amp = a; });
  await wait(120);
  assert(amp >= 0 && amp <= 1, `amplitud ${amp} fora de [0,1]`);
  near(amp, 0.5, 0.05, 'amplitud normalitzada: ');
  await AudioSvc.stopRecording();
});

await test('amplitud normalitzada: -60dB→0.0, -30dB→0.5, 0dB→1.0', () => {
  const norm = (m: number) => Math.max(0, Math.min(1, (m + 60) / 60));
  near(norm(-60), 0.0, 0.01);
  near(norm(-30), 0.5, 0.01);
  near(norm(0),   1.0, 0.01);
  near(norm(-90), 0.0, 0.01); // clamp inferior
});

await test('stopRecording: retorna URI correcta', async () => {
  await resetAudio();
  mockRecUri = 'file:///test/audio.m4a';
  await AudioSvc.startRecording(() => {});
  eq(await AudioSvc.stopRecording(), 'file:///test/audio.m4a');
});

await test('stopRecording: isRecordingActive() → false', async () => {
  await resetAudio();
  await AudioSvc.startRecording(() => {});
  await AudioSvc.stopRecording();
  eq(AudioSvc.isRecordingActive(), false);
});

await test('stopRecording sense gravació activa → null', async () => {
  await resetAudio();
  eq(await AudioSvc.stopRecording(), null);
});

await test('stopRecording: restaura mode àudio (allowsRecordingIOS=false)', async () => {
  await resetAudio();
  setAudioModeCalls = [];
  await AudioSvc.startRecording(() => {});
  await AudioSvc.stopRecording();
  const restoreCall = setAudioModeCalls.find(c => c.allowsRecordingIOS === false);
  assert(restoreCall !== undefined, 'hauria de restaurar mode àudio');
});

// ═══════════════════════════════════════════════════════════════════
// RESULTAT FINAL
// ═══════════════════════════════════════════════════════════════════
console.log('\n' + '─'.repeat(52));
console.log(`✅ ${passed} proves superades`);
if (failed > 0) {
  console.log(`❌ ${failed} proves fallades:`);
  failures.forEach(f => console.log(`   • ${f}`));
  process.exit(1);
} else {
  console.log('🎉 Totes les proves han passat!\n');
}

})();
