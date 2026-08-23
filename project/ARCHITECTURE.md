# Slice 0 Architecture Record

## Scope

Slice 0 provides a local-only React Native shell. Authentication, backend services, upload, transfer providers, recipients, and real recordings are deferred to later slices.

## Boundaries

Domain code contains lifecycle rules and no React Native or storage imports. The `src/ports` contracts isolate clock, ID generation, device storage, and audio recording adapters. Production adapters will be added in later slices; tests use deterministic in-memory fakes.

Interview lifecycle, recording persistence, and delivery lifecycle are separate fields. A stopped recording will be final and cannot be appended to.

## Privacy and test data

Development uses synthetic values only. Recording filenames must be generated as `recording-<random-id>.m4a`; they must not contain participant names or other sensitive metadata. Local protection, consent, retention, and deletion policy require product decisions before real participant use.

## Platform note

The JavaScript shell targets React Native 0.86 through Expo SDK 57, uses native stack navigation, and declares Android/iOS scripts. Expo Prebuild generates native build folders when a local native build is needed. Simulator and emulator launch checks remain required on macOS and Android-capable CI.
