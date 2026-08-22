# StoriesForLife Recording App

StoriesForLife is a React Native and TypeScript mobile application for authorised interviewers to record life-story interviews and, in later increments, securely deliver them to authorised recipients.

The product prioritises reliability, simplicity, privacy, and recoverability. The app must make accidental loss of an interview difficult.

## Current Scope

The first development increment is local-only. It focuses on:

- Creating and persisting interview drafts
- Recording, pausing, resuming, and stopping audio
- Reviewing and playing a completed recording
- Safely deleting or replacing a recording
- Recovering from interruption or app restart
- Handling microphone permission and storage failures safely
- Providing accessible, plain-language feedback on iOS and Android

Authentication, backend services, upload, transfer providers, recipients, and delivery are intentionally excluded from this increment.

## Core Journey

```text
Interviews -> New interview -> Details -> Record -> Review
```

After a recording is stopped, it is final and cannot be appended to. The interviewer may delete it and record again before any future upload.

## Safety Rules

- Never silently delete or overwrite the last known good local recording.
- Keep recording data outside volatile application memory and persist it as it is created.
- Preserve recoverable recordings and pending work across app restart.
- Do not report a recording as recovered until a playable local file has been verified.
- Use non-identifying filenames such as `recording-<random-id>.m4a`.
- Use synthetic participants and recordings during development. Never commit real interview data, audio, credentials, tokens, or secrets.
- Keep interview lifecycle, recording persistence, and delivery lifecycle as separate state concepts.

## Lifecycle Model

```text
Interview:  DRAFT -> RECORDING -> RECORDED
                         |
                         -> RECORDING_RECOVERABLE -> RECORDED or DRAFT

Persistence: LOCAL_ONLY -> UPLOAD_IN_PROGRESS -> REMOTE_CONFIRMED
                                      |
                                      -> UPLOAD_FAILED -> UPLOAD_IN_PROGRESS

Delivery: NOT_SENT -> TRANSFER_IN_PROGRESS -> TRANSFER_CREATED
                                  |
                                  -> TRANSFER_FAILED -> TRANSFER_IN_PROGRESS
```

The persistence and delivery lifecycles are future-facing in the local-only increment. Internal states must be mapped to clear user-facing messages and safe next actions.

## Development Approach

The project uses small, demonstrable vertical slices and test-driven development:

1. Establish the React Native/TypeScript shell and test foundation.
2. Write acceptance tests from the applicable product requirements.
3. Write a failing test for the requested behavior.
4. Implement the smallest change that makes the test pass.
5. Refactor after the focused test passes.
6. Run focused tests, then type checks, linting, and broader checks.
7. Validate native behavior on both platforms where feasible.

Native capabilities such as audio recording, filesystem access, device storage, permissions, navigation, time, and randomness should be accessed through explicit boundaries with deterministic test doubles.

## Delivery Slices

| Slice | Outcome |
| --- | --- |
| 0 | Testable React Native project foundation |
| 1 | Durable interview drafts |
| 2 | Start and stop a local recording |
| 3 | Pause, resume, and playback |
| 4 | Safe replace and delete |
| 5 | Interruption recovery |
| 6 | Permission and storage safety |
| 7 | Local-recording release hardening |

The detailed work plan is in [Incremental Delivery Task List v0.1.md](Incremental%20Delivery%20Task%20List%20v0.1.md). The product requirements are in [StoriesForLife Recording Product Specification v0.2.md](StoriesForLife%20Recording%20Product%20Specification%20v0.2.md), and the interaction design is in [Initial Product Design v0.1.md](Initial%20Product%20Design%20v0.1.md).

## Testing Expectations

Tests should demonstrate product behavior rather than implementation details. Relevant coverage includes:

- Domain lifecycle and data-loss invariants
- Application orchestration between domain and native boundaries
- Persistence, restart, and recovery behavior
- Permission, storage, interruption, and cancellation failures
- Accessibility behavior and user-facing status messages
- Critical end-to-end journeys on iOS and Android

Native integration that cannot run in the current environment must be covered by contract tests and deterministic fakes, with the required device or simulator check documented.

## Privacy and Security

Recordings may contain highly personal or special-category data. Before real participant use, the project must define and validate consent, lawful basis, access control, local protection, encryption, retention, deletion, auditability, and incident-handling processes.

Until those decisions are complete, technical recording work must use synthetic, non-sensitive data only.

## Project Status

The repository currently contains the product specification, interaction design, incremental delivery plan, and this README. The React Native implementation will be introduced through Slice 0.
