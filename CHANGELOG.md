# Changelog - AnythingLLM (Kufer Fork)

Alle wichtigen Änderungen am AnythingLLM Server werden hier dokumentiert.

## [2.8.0] - 2024-12-11

### Hinzugefügt
- **🌍 Unicode-Spracherkennung**: Erkennt Arabisch, Hebräisch, Chinesisch, Japanisch, Koreanisch, Russisch, Griechisch, Thai, Hindi, Bengali direkt via Unicode-Ranges
  - `franc-min` versagt bei nicht-lateinischen Schriften
  - Unicode-Erkennung ist deterministisch und schneller
  - Fallback zu `franc-min` nur für lateinische Sprachen

- **🎵 Audio-Format Auto-Detection**: TTS-Endpoint erkennt Format via Magic Bytes
  - RIFF → WAV, OggS → OGG, fLaC → FLAC, sonst MP3
  - Korrekter Content-Type Header für alle Formate

### Geändert
- **STT Native FormData**: `form-data` Package durch native `FormData + Blob` ersetzt
  - `form-data` funktionierte nicht mit native `fetch()`
  - Behebt "multipart: NextPart: EOF" Fehler bei Groq

### Behoben
- **STT Endpoint**: Korrekte Filename-Ableitung aus Mimetype für Groq Whisper

---

## [2.7.0] - 2024-12-10

### Hinzugefügt
- **🎤 Embed Audio Endpoints**: Neue Server-Endpoints für Embed Widget STT/TTS
  - `GET /embed/:embedId/audio/status` - Prüft ob STT/TTS konfiguriert
  - `POST /embed/:embedId/audio/tts` - Text-to-Speech für Embed
  - Validiert embedId, keine User-Auth nötig

- **Frontend STT Verbesserungen**:
  - Server-STT Provider-Erkennung
  - Tooltip zeigt `[Server]` statt `[Groq]` an

### Geändert
- **TTS Normalizer**: Jetzt für ALLE TTS-Provider aktiv (OpenAI, ElevenLabs, Generic)
- **Kursnummern-Erkennung**: Universelles Pattern `[A-Z]{1,2}\d{4,5}[A-Z]?` für alle Sprachen

### Behoben
- **isTTSConfigured()**: Fehlende Funktion für Embed Audio Status Endpoint hinzugefügt

---

## [2.6.0] - 2024-12-09

### Hinzugefügt
- **TTS Text Normalizer**: Multilingualer Normalizer für bessere Sprachausgabe
  - Deutsche Zahlen (Tausender, Dezimal, Uhrzeiten)
  - Englische AM/PM Zeiten
  - Abkürzungen, Währungen, Einheiten
  - URL-Cleaning und Whitespace-Normalisierung

- **Stimmen für openedai-speech/Piper**:
  - 30+ Sprachen mit hochwertigen ONNX-Voices
  - Absolute Pfade in voice_to_speaker.yaml

### Behoben
- Ukrainische Stimme funktioniert jetzt korrekt (Pfad-Problem)
- Broken Voice Downloads (nl, pl, pt, kk, ml, sw, ne)

---

## [2.5.0] - 2024-12-XX

### Bestehende Features
- AnythingLLM Server mit Workspace-Chat
- RAG (Retrieval Augmented Generation)
- Multi-User Support
- Embed Widget Support
- TTS/STT Provider Integration
