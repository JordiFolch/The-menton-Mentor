# Conversation Recorder — Context per a Claude

## Què és aquest projecte

App mòbil en **React Native + Expo** que grava converses i les transcriu en temps real, detecta automàticament l'idioma i separa els parlants per pitch de veu (k-means).

Entorn: Expo Router (file-based routing), TypeScript estricte, tema fosc.

---

## Arquitectura

```
app/                     # Pantalles (Expo Router)
  _layout.tsx            # Stack navigator + botó configuració
  index.tsx              # Pantalla principal: llista de sessions
  record.tsx             # Pantalla de gravació
  settings.tsx           # Nombre de parlants (2-4), esborrar tot
  session/[id].tsx       # Vista detall d'una sessió guardada

components/
  RecordButton.tsx       # Botó animat amb pols quan grava
  WaveformVisualizer.tsx # 24 barres animades (amplitud àudio)
  SpeakerBubble.tsx      # Bombolla de xat per segment + reassignació (long-press)
  LanguageBadge.tsx      # Etiqueta d'idioma (CA, ES, EN…)
  SessionCard.tsx        # Targeta de sessió a la llista

services/
  StorageService.ts      # Persistència AsyncStorage (CRUD sessions)
  LanguageService.ts     # Detecció idioma (franc) → locales
  SpeechService.ts       # Veu a text (react-native-voice) + reinici automàtic
  AudioService.ts        # Gravació àudio (expo-av) + amplitud cada 80ms
  SpeakerService.ts      # Detecció parlants (k-means per pitch)

utils/
  kmeans.ts              # Algoritme k-means
  pitchDetector.ts       # Detecció pitch (pitchy)

types/index.ts           # Speaker, Segment, Session
constants/theme.ts       # Design tokens (colors, spacing, fonts)
tests/run.ts             # Suite de 71 tests (sense framework extern)
dist/run-tests           # Executable autocontingut dels tests
```

---

## Tipus de dades principals

```typescript
interface Speaker {
  id: string;           // "speaker-0", "speaker-1"…
  name: string;         // "Parlant 1"
  color: string;        // Hex del speakerColors[]
  pitchMean: number;    // Hz mitjana
  pitchSamples: number[];
}

interface Segment {
  id: string;
  text: string;
  speakerId: string;
  startTime: number;    // ms des de l'inici
  language: string;     // "ca-ES", "es-ES", "en-US"…
  pitchMean?: number;
}

interface Session {
  id: string;
  title: string;
  createdAt: string;    // ISO 8601
  duration: number;     // segons
  segments: Segment[];
  speakers: Speaker[];
  detectedLanguage: string;
}
```

---

## Design tokens (theme.ts)

```
Colors de fons:   #000000 / #111111 / #1A1A1A
Borders:          #222222 / #333333
Text:             #FFFFFF / #888888 / #444444
Accent:           #FFFFFF
Danger:           #FF4444
Recording:        #FF3B30

Colors parlants:  #4A9EFF · #FF6B6B · #4DFFA3 · #FFD166 · #C77DFF · #FF9F43

Spacing:   xs=4  sm=8  md=16  lg=24  xl=32  xxl=48
Radius:    sm=8  md=12  lg=20  full=9999
FontSize:  xs=11 sm=13 md=15  lg=17  xl=22  xxl=28
```

---

## Flux de l'app

```
HOME (index.tsx)
  ├─ Llista de sessions (SessionCard) → toca → SESSION DETAIL
  └─ FAB "+" → RECORD

RECORD (record.tsx)
  ├─ WaveformVisualizer  (amplitud en temps real)
  ├─ RecordButton        (toggles gravació)
  ├─ SpeakerBubble[]     (transcripció en viu)
  ├─ Detecció idioma cada 15 s (LanguageService)
  ├─ Pitch sampling (AudioService + pitchDetector)
  ├─ Stop → assignSpeakers (k-means) → save → HOME
  └─ Discard → HOME

SESSION DETAIL (session/[id].tsx)
  ├─ SpeakerBubble[] (long-press → reassignar parlant)
  └─ Botó exportar (Share API)

SETTINGS (settings.tsx)
  ├─ Selector parlants 2-4
  └─ Esborrar totes les sessions
```

---

## Idiomes suportats

`ca-ES · es-ES · en-US · fr-FR · de-DE · it-IT · pt-PT · nl-NL · pl-PL · ru-RU · zh-CN · ja-JP · ko-KR · ar-SA`

La detecció usa la llibreria `franc` (basada en trigrames).
> Nota: franc confon portuguès amb gallec en textos curts. Els tests usen alemany i francès en substitució.

---

## Tests

**Executar:**
```bash
# Amb tsx (cal node_modules):
node_modules/.bin/tsx tests/run.ts

# Executable autocontingut (sense node_modules):
./dist/run-tests
```

**Cobertura (71 proves, 0 fallades):**

| Mòdul | Proves |
|---|---|
| kmeans | 7 |
| pitchDetector | 9 |
| LanguageService | 9 |
| SpeakerService | 7 |
| StorageService | 10 |
| SpeechService | 16 |
| AudioService | 13 |

Els tests mocken `@react-native-async-storage/async-storage`, `@react-native-voice/voice` i `expo-av` via `Module._load` per poder córrer en Node.js pur (sense simulador).

---

## Executar l'app

```bash
# Instal·lar dependències (si cal):
npm install

# Arrancar servidor Expo:
npm start

# Després escaneja el QR amb l'app Expo Go al mòbil
# (mòbil i ordinador a la mateixa WiFi)
```

---

## Branca de treball

`claude/conversation-recorder-app-LfEV3`

Repositori: `jordifolch/the-menton-mentor`

---

## Estat actual i possibles millores

### Implementat ✅
- Gravació àudio + transcripció en temps real
- Detecció automàtica d'idioma (cada 15 s)
- Separació de parlants per pitch (k-means, 2-4 parlants)
- Reassignació manual de parlants (long-press)
- Persistència de sessions (AsyncStorage)
- Exportació de transcripcions (Share API)
- Tema fosc professional
- Animacions (pols RecordButton, WaveformVisualizer)
- Suite de 71 tests

### Possibles millores de disseny UI/UX
- Pantalla de benvinguda / onboarding
- Estadístiques de sessió (temps per parlant, % idiomes)
- Edició del nom dels parlants
- Cerca dins de sessions
- Filtres a la llista (per idioma, data, durada)
- Mode clar / fosc commutable
- Feedback hàptic
- Animació de transició entre pantalles
