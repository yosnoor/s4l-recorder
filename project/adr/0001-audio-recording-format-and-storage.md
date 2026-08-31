# ADR 0001 — Audio recording format, quality, storage location and filename strategy

Status: Accepted (Slice 2 technical spike)
Date: 2026-08-31

## Context

Slice 2 requires a single local recording per interview. The spike had to choose a
platform-supported speech format, quality defaults, a durable storage location and a
non-identifying filename strategy, then record the decision.

The app targets Expo SDK 57 (`expo` ~57.0.15) on iOS and Android. Recordings are speech,
are retained on-device until an explicit later transfer, and must never leak participant
identity through file paths.

## Decision

**Recording API: `expo-audio` (57.0.4).**
It is the supported audio recording module for SDK 57 and exposes `prepareToRecordAsync`,
`record`, `pause`, `stop`, a status listener and `requestRecordingPermissionsAsync`, which
maps cleanly onto our existing `AudioRecorder` port. `expo-av` is not used.

**Container and codec: AAC in an `.m4a` container.**
AAC/M4A plays natively on both iOS and Android without extra decoding, and matches the
`recording-<random-id>.m4a` convention already documented in `ARCHITECTURE.md`.

**Quality defaults: 44.1 kHz, mono, 64 kbps.**
Speech intelligibility is preserved while roughly halving the size of the stereo
128 kbps `HIGH_QUALITY` preset. One microphone captures one room, so a second channel adds
size and upload time with no clarity benefit. About 0.5 MB per minute keeps later uploads and
storage costs predictable. Defined once as `SPEECH_RECORDING_PROFILE`.

**Storage location: the app document directory, not the cache directory.**
`expo-audio` writes to the cache directory by default, and the OS may delete cache files when
storage is low. Recordings are prepared with `directory: 'document'` and then moved into
`<document>/recordings/`, so a stopped recording is a real file outside volatile memory.

**Filename strategy: `recording-<random-id>.m4a` with a cryptographically random id.**
The id comes from `expo-crypto` `randomUUID()` with hyphens removed, so a filename carries no
interviewee name, interviewer name, date or note content. Metadata stores only the basename;
the durable directory is resolved at runtime, which keeps stored records portable between
installs and platforms.

**Finalisation: never overwrite an existing recording file.**
The adapter refuses to move a finished recording onto an existing path and verifies the moved
file exists and is non-empty before reporting success. Each session prepares a new unique
filename, so stopping can never append to an earlier finalised recording.

**Permission timing: requested only from the start action.**
Opening the recording screen never prompts. `requestRecordingPermissionsAsync()` is called
when the interviewer presses `Start recording`, and a denial leaves the interview in `DRAFT`
with no recording associated.

## Consequences

- `expo-audio`, `expo-file-system` and `expo-crypto` become direct dependencies at exact versions.
- `app.json` configures the `expo-audio` plugin with a microphone usage string.
  `enableBackgroundRecording` stays `false`; background capture is out of scope for this slice.
- Because `expo-audio` chooses its own temporary filename, our name is applied by moving the
  finished file. The move is the point at which a recording becomes durable and final.
- Web is not a supported recording target for this slice; `expo-audio` on web uses
  `MediaRecorder`, whose container support differs from `.m4a`.

## Verification

Unit and acceptance tests cover filename shape, write ordering, lifecycle transitions and stop
cancellation. Real-file durability and playback quality require a device build and are checked
against the Slice 2 acceptance demonstration and Slice 3 playback work.
