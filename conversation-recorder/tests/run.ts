/**
 * Test suite per a conversation-recorder
 * Prova: kmeans, pitchDetector, LanguageService, SpeakerService, StorageService
 */

// ─── Mock AsyncStorage PRIMER de tot (abans de qualsevol import de serveis) ──
const store: Record<string, string> = {};
const AsyncStorageMock = {
  getItem:    async (key: string) => store[key] ?? null,
  setItem:    async (key: string, val: string) => { store[key] = val; },
  removeItem: async (key: string) => { delete store[key]; },
  clear:      async () => { Object.keys(store).forEach(k => delete store[k]); },
};

const Module = require('module');
const origLoad = Module._load;
Module._load = function(id: string, ...args: any[]) {
  if (id === '@react-native-async-storage/async-storage') {
    return AsyncStorageMock;
  }
  return origLoad.apply(this, [id, ...args]);
};

// ─── Ara els imports normals ──────────────────────────────────────────────────
import { kmeans, clusterMeans } from '../utils/kmeans';
import { detectLanguage, localeLabel, francToLocale } from '../services/LanguageService';
import { averagePitch } from '../utils/pitchDetector';
import { assignSpeakers, clearPitchHistory, recordPitch, reassignSegmentSpeaker } from '../services/SpeakerService';
import type { Segment } from '../types';

// ─── Mini test runner ─────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const errors: string[] = [];

function test(name: string, fn: (() => void) | (() => Promise<void>)) {
  const result = (fn as any)();
  if (result && typeof result.then === 'function') {
    return result.then(
      () => { console.log(`  ✓ ${name}`); passed++; },
      (e: any) => { console.log(`  ✗ ${name}\n    → ${e.message}`); errors.push(name); failed++; }
    );
  }
  try {
    console.log(`  ✓ ${name}`); passed++;
  } catch (e: any) {
    console.log(`  ✗ ${name}\n    → ${e.message}`); errors.push(name); failed++;
  }
}

function expect(val: any) {
  return {
    toBe(expected: any) {
      if (val !== expected) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(val)}`);
    },
    toBeNull() {
      if (val !== null) throw new Error(`Expected null, got ${JSON.stringify(val)}`);
    },
    toBeGreaterThan(n: number) {
      if (val <= n) throw new Error(`Expected ${val} > ${n}`);
    },
    toHaveLength(n: number) {
      if ((val as any[]).length !== n) throw new Error(`Expected length ${n}, got ${(val as any[]).length}`);
    },
  };
}

// ─── 1. K-MEANS ───────────────────────────────────────────────────────────────
console.log('\n📊 K-Means clustering');

test('separa dues veus (home ~120Hz, dona ~220Hz)', () => {
  const data = [118, 122, 120, 218, 222, 220];
  const assignments = kmeans(data, 2);
  expect(assignments).toHaveLength(6);
  if (assignments[0] === assignments[3]) throw new Error('Veus greus i agudes al mateix clúster');
  if (assignments[0] !== assignments[1]) throw new Error('Veus greus separades entre elles');
  if (assignments[3] !== assignments[4]) throw new Error('Veus agudes separades entre elles');
});

test('retorna mateixa longitud que input', () => {
  expect(kmeans([100, 200, 150, 250, 130, 210], 2)).toHaveLength(6);
});

test('k=3 separa tres grups (nen, home, dona)', () => {
  const data = [280, 285, 282, 120, 125, 122, 220, 225, 222];
  const assignments = kmeans(data, 3);
  expect(assignments[0]).toBe(assignments[1]);
  expect(assignments[3]).toBe(assignments[4]);
  expect(assignments[6]).toBe(assignments[7]);
  if (assignments[0] === assignments[3]) throw new Error('Nen i home al mateix clúster');
  if (assignments[3] === assignments[6]) throw new Error('Home i dona al mateix clúster');
});

test('clusterMeans calcula correctament', () => {
  const means = clusterMeans([100, 200, 110, 210], [0, 1, 0, 1], 2);
  if (means[0] !== 105) throw new Error(`Expected 105, got ${means[0]}`);
  if (means[1] !== 205) throw new Error(`Expected 205, got ${means[1]}`);
});

test('array buit retorna []', () => { expect(kmeans([], 2)).toHaveLength(0); });
test('k >= longitud dades no peta', () => { expect(kmeans([100, 200], 5)).toHaveLength(2); });

// ─── 2. LANGUAGE SERVICE ──────────────────────────────────────────────────────
console.log('\n🌍 Language detection (franc)');

test('detecta castellà', () => {
  const r = detectLanguage('Hola, ¿cómo estás? Me alegra verte hoy aquí en esta reunión tan importante sobre el proyecto');
  expect(r).toBe('es-ES');
});

test('detecta anglès', () => {
  const r = detectLanguage('Hello, how are you today? I am very happy to be here at this important meeting about the project');
  expect(r).toBe('en-US');
});

test('detecta italià', () => {
  const r = detectLanguage('Buongiorno, come stai oggi? Sono molto contento di essere qui a questa riunione importante sul progetto');
  expect(r).toBe('it-IT');
});

test('retorna null amb text curt (<50 cars)', () => { expect(detectLanguage('Hola')).toBeNull(); });
test('retorna null amb text buit', () => { expect(detectLanguage('')).toBeNull(); });

test('localeLabel correcte per cada idioma', () => {
  for (const [loc, label] of [['es-ES','ES'],['en-US','EN'],['ca-ES','CA'],['fr-FR','FR']]) {
    if (localeLabel(loc) !== label) throw new Error(`${loc} → expected ${label}, got ${localeLabel(loc)}`);
  }
});

test('francToLocale converteix codis franc', () => {
  if (francToLocale('spa') !== 'es-ES') throw new Error('spa failed');
  if (francToLocale('eng') !== 'en-US') throw new Error('eng failed');
  if (francToLocale('cat') !== 'ca-ES') throw new Error('cat failed');
});

// ─── 3. PITCH DETECTOR ────────────────────────────────────────────────────────
console.log('\n🎵 Pitch detector');

test('averagePitch calcula la mitjana', () => {
  const avg = averagePitch([120, 125, 118, 122]);
  if (avg !== 121.25) throw new Error(`Expected 121.25, got ${avg}`);
});

test('averagePitch ignora zeros', () => {
  if (averagePitch([0, 120, 0, 120]) !== 120) throw new Error('zeros not ignored');
});

test('averagePitch retorna 0 si buit', () => { if (averagePitch([]) !== 0) throw new Error(); });
test('averagePitch retorna 0 si tot zeros', () => { if (averagePitch([0, 0, 0]) !== 0) throw new Error(); });

// ─── 4. SPEAKER SERVICE ───────────────────────────────────────────────────────
console.log('\n🎤 Speaker service');

test('assigna parlants a segments per pitch diferent', () => {
  clearPitchHistory();
  const segs: Segment[] = [
    { id: 's1', text: 'Hola',    speakerId: 'speaker-0', startTime: 0,    language: 'es-ES' },
    { id: 's2', text: 'Com vas?',speakerId: 'speaker-0', startTime: 1000, language: 'es-ES' },
    { id: 's3', text: 'Molt bé', speakerId: 'speaker-0', startTime: 2000, language: 'es-ES' },
    { id: 's4', text: 'Genial',  speakerId: 'speaker-0', startTime: 3000, language: 'es-ES' },
  ];
  recordPitch('s1', 118); recordPitch('s1', 122); recordPitch('s1', 120);
  recordPitch('s2', 218); recordPitch('s2', 222); recordPitch('s2', 220);
  recordPitch('s3', 119); recordPitch('s3', 121); recordPitch('s3', 120);
  recordPitch('s4', 219); recordPitch('s4', 221); recordPitch('s4', 220);

  const { segments: upd, speakers } = assignSpeakers(segs, 2);
  expect(speakers).toHaveLength(2);

  const sp = (id: string) => upd.find(s => s.id === id)!.speakerId;
  if (sp('s1') !== sp('s3')) throw new Error('s1 i s3 haurien de ser el mateix parlant');
  if (sp('s2') !== sp('s4')) throw new Error('s2 i s4 haurien de ser el mateix parlant');
  if (sp('s1') === sp('s2')) throw new Error('s1 i s2 haurien de ser parlants diferents');
});

test('parlants creats amb noms i colors hex', () => {
  clearPitchHistory();
  const { speakers } = assignSpeakers([], 2);
  if (speakers[0].name !== 'Parlant 1') throw new Error(speakers[0].name);
  if (speakers[1].name !== 'Parlant 2') throw new Error(speakers[1].name);
  if (!speakers[0].color.startsWith('#')) throw new Error('color no és hex');
  if (speakers[0].color === speakers[1].color) throw new Error('colors iguals');
});

test('reassignSegmentSpeaker canvia el parlant', () => {
  const segs: Segment[] = [
    { id: 'a1', text: 'Hola', speakerId: 'speaker-0', startTime: 0, language: 'es-ES' },
    { id: 'a2', text: 'Adeu', speakerId: 'speaker-1', startTime: 1000, language: 'es-ES' },
  ];
  const upd = reassignSegmentSpeaker(segs, 'a1', 'speaker-1');
  if (upd.find(s => s.id === 'a1')!.speakerId !== 'speaker-1') throw new Error();
  if (upd.find(s => s.id === 'a2')!.speakerId !== 'speaker-1') throw new Error();
});

test('reassignSegmentSpeaker no modifica altres segments', () => {
  const segs: Segment[] = [
    { id: 'b1', text: 'A', speakerId: 'speaker-0', startTime: 0, language: 'es-ES' },
    { id: 'b2', text: 'B', speakerId: 'speaker-0', startTime: 1000, language: 'es-ES' },
    { id: 'b3', text: 'C', speakerId: 'speaker-1', startTime: 2000, language: 'es-ES' },
  ];
  const upd = reassignSegmentSpeaker(segs, 'b2', 'speaker-1');
  if (upd.find(s => s.id === 'b1')!.speakerId !== 'speaker-0') throw new Error('b1 canviat incorrectament');
  if (upd.find(s => s.id === 'b3')!.speakerId !== 'speaker-1') throw new Error('b3 canviat incorrectament');
});

// ─── 5. STORAGE SERVICE ───────────────────────────────────────────────────────
console.log('\n💾 Storage service (mock AsyncStorage)');

async function testStorage() {
  // Dynamic import per assegurar que el mock ja és actiu
  const { saveSession, loadSessions, deleteSession, getSession } =
    await import('../services/StorageService');

  await AsyncStorageMock.clear();

  const session1 = {
    id: 'test-001', title: 'Reunió de prova',
    createdAt: '2026-04-23T10:00:00Z', duration: 120,
    segments: [{ id: 's1', text: 'Hola a tothom', speakerId: 'speaker-0', startTime: 0, language: 'ca-ES' }],
    speakers: [{ id: 'speaker-0', name: 'Parlant 1', color: '#4A9EFF', pitchMean: 120, pitchSamples: [] }],
    detectedLanguage: 'ca-ES',
  };

  await test('guarda i recupera una sessió', async () => {
    await saveSession(session1);
    const sessions = await loadSessions();
    if (sessions.length === 0) throw new Error('No s\'han carregat sessions');
    const found = sessions.find(s => s.id === 'test-001');
    if (!found) throw new Error('Sessió no trobada');
    if (found.title !== 'Reunió de prova') throw new Error(`Títol incorrecte: ${found.title}`);
    if (found.duration !== 120) throw new Error(`Durada incorrecta: ${found.duration}`);
    if (found.segments[0].text !== 'Hola a tothom') throw new Error('Segment incorrecte');
  });

  await test('getSession retorna la sessió correcta', async () => {
    const s = await getSession('test-001');
    if (!s) throw new Error('Sessió no trobada');
    if (s.id !== 'test-001') throw new Error('ID incorrecte');
    if (s.speakers[0].color !== '#4A9EFF') throw new Error('Color incorrecte');
  });

  await test('getSession retorna null per ID inexistent', async () => {
    const s = await getSession('no-existeix');
    if (s !== null) throw new Error('Hauria de retornar null');
  });

  await test('actualitza sessió existent (no duplica)', async () => {
    await saveSession({ ...session1, title: 'Reunió actualitzada' });
    const sessions = await loadSessions();
    const matching = sessions.filter(s => s.id === 'test-001');
    if (matching.length !== 1) throw new Error(`Duplicat! ${matching.length} sessions`);
    if (matching[0].title !== 'Reunió actualitzada') throw new Error('Títol no actualitzat');
  });

  await test('afegeix múltiples sessions i les manté totes', async () => {
    await saveSession({ ...session1, id: 'test-002', title: 'Sessió 2' });
    await saveSession({ ...session1, id: 'test-003', title: 'Sessió 3' });
    const sessions = await loadSessions();
    if (sessions.length !== 3) throw new Error(`Expected 3, got ${sessions.length}`);
  });

  await test('elimina una sessió correctament', async () => {
    await deleteSession('test-002');
    const sessions = await loadSessions();
    if (sessions.length !== 2) throw new Error(`Expected 2, got ${sessions.length}`);
    if (sessions.find(s => s.id === 'test-002')) throw new Error('Sessió no eliminada');
  });

  await test('sessions ordenades: la més nova primer', async () => {
    await AsyncStorageMock.clear();
    await saveSession({ ...session1, id: 'old', title: 'Antiga' });
    await saveSession({ ...session1, id: 'new', title: 'Nova' });
    const sessions = await loadSessions();
    if (sessions[0].id !== 'new') throw new Error(`Expected 'new' first, got '${sessions[0].id}'`);
  });

  await test('loadSessions retorna [] si no hi ha dades', async () => {
    await AsyncStorageMock.clear();
    const sessions = await loadSessions();
    if (sessions.length !== 0) throw new Error(`Expected 0, got ${sessions.length}`);
  });
}

// ─── RESULTAT FINAL ───────────────────────────────────────────────────────────
(async () => {
  await testStorage();

  console.log('\n' + '─'.repeat(50));
  console.log(`✅ ${passed} proves superades`);
  if (failed > 0) {
    console.log(`❌ ${failed} proves fallades:`);
    errors.forEach(e => console.log(`   • ${e}`));
    process.exit(1);
  } else {
    console.log('🎉 Totes les proves han passat!\n');
  }
})();
