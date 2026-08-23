# StoriesForLife Recording Product Specification v0.2

**Status:** Draft  
**Date:** 22 August 2026  
**Product:** StoriesForLife Recording App  
**Specification approach:** Iterative, spec-driven development and TDD  
**Supersedes:** v0.1

## 1. Purpose

The StoriesForLife Recording App enables authorised interviewers to record life-story interviews on a mobile device and securely deliver recordings to authorised recipients.

The product prioritises **reliability, simplicity, privacy and recoverability** over feature breadth. This is a living specification: it records the current shared understanding and will change deliberately as the team learns.

## 2. Product Goal

An interviewer should be able to:

1. Authenticate.
2. Create an interview.
3. Record, pause, resume and stop an interview.
4. Review the completed recording.
5. Upload it safely.
6. Confirm an authorised recipient and send it.
7. See whether the transfer was successfully created.

The application must make accidental loss of an interview difficult.

## 3. Scope and Platforms

The initial app is a React Native and TypeScript mobile application for iOS and Android. A backend will eventually provide authentication, interview metadata, recording management, upload orchestration and transfer management.

The first development increment is deliberately local-only; authentication, backend, upload and delivery are excluded from it.

## 4. Primary User and Operating Context

The primary user is an authorised StoriesForLife interviewer. They may be in poor or unavailable connectivity, have limited battery or device storage, receive phone calls, experience app interruptions, and be unfamiliar with technical software. The recording workflow must therefore be obvious, quiet and require minimal technical knowledge.

## 5. Core Journey

```text
Login
  ↓
Interviews
  ↓
New interview
  ↓
Enter interview details
  ↓
Start recording
  ↓
Pause / resume
  ↓
Stop recording
  ↓
Review recording
  ↓
Upload
  ↓
Remote persistence confirmed
  ↓
Confirm recipient
  ↓
Send
  ↓
Transfer created
```

Recovery actions must be available after failures or application restart.

## 6. Domain Model

An **interview** is the metadata and its associated recording. For the initial product, one interview has one audio recording. A stopped recording is final and cannot be appended to; the interviewer may delete it and re-record before upload. Supporting multiple recordings or append-to-recording is future scope.

Initial interview metadata:

- Interviewee name
- Interview date
- Interviewer
- Optional notes
- Recording reference
- Creation timestamp
- Last-updated timestamp

Use a non-identifying recording filename, for example `recording-847293.m4a`, rather than a filename containing the interviewee's name or sensitive content.

### 6.1 Separate lifecycle concepts

The app must model these independently; one status field must not conceal their different recovery behaviour.

| Concept               | Initial states                                                            | Meaning                                             |
| --------------------- | ------------------------------------------------------------------------- | --------------------------------------------------- |
| Interview lifecycle   | `DRAFT`, `RECORDING`, `RECORDED`                                          | The interviewer's work on the recording.            |
| Recording persistence | `LOCAL_ONLY`, `UPLOAD_IN_PROGRESS`, `REMOTE_CONFIRMED`, `UPLOAD_FAILED`   | Whether a durable remote copy exists.               |
| Delivery lifecycle    | `NOT_SENT`, `TRANSFER_IN_PROGRESS`, `TRANSFER_CREATED`, `TRANSFER_FAILED` | Whether a transfer to a recipient has been created. |

`RECORDING_RECOVERABLE` is a recording-session condition used after unexpected interruption: a local partial file or session exists and the interviewer can review, retain, delete, or retry recovery. If recovery is impossible, the app must state that plainly and must not imply that a recording exists.

### 6.2 Initial transition rules

```text
DRAFT → RECORDING → RECORDED
                 └→ RECORDING_RECOVERABLE → RECORDED or DRAFT

LOCAL_ONLY → UPLOAD_IN_PROGRESS → REMOTE_CONFIRMED
                         └→ UPLOAD_FAILED → UPLOAD_IN_PROGRESS

NOT_SENT → TRANSFER_IN_PROGRESS → TRANSFER_CREATED
                               └→ TRANSFER_FAILED → TRANSFER_IN_PROGRESS
```

The exact implementation may evolve, but every visible state must have a clear user-facing explanation and, where applicable, a recovery action.

## 7. Recording

The interviewer must be able to start, pause, resume and stop a recording; see an unambiguous active-recording indicator and elapsed time; play a completed recording; and delete and re-record before upload.

Recording data must be persisted locally as it is created and must never exist only in volatile application memory.

The first increment must test these interruption scenarios on both platforms where technically feasible:

- App backgrounding and return to foreground
- Incoming call or other audio-session interruption
- App restart or unexpected termination
- Microphone permission denied or revoked
- Insufficient device storage
- Low or critical battery
- No network connectivity

The initial audio format and quality remain to be decided through a technical spike. The decision must favour clear speech, platform playback compatibility, manageable file size, upload duration and storage cost over studio quality.

## 8. Data-Loss and Retention Invariants

These rules are non-negotiable product behaviours:

1. The app must not delete or overwrite the last known good local recording without the interviewer's explicit confirmed action.
2. The app must not automatically delete the only local copy merely because upload has started.
3. Automatic deletion is permitted only after durable remote persistence has been confirmed and the retention decision is explicit to the interviewer.
4. A transfer failure must not require the interviewer to re-record or re-upload a remotely confirmed recording.
5. After app restart, every recoverable local recording and every pending upload or transfer must remain discoverable with an appropriate action.
6. If a recording cannot be recovered, the app must say so clearly and must preserve any existing unaffected recording.

The eventual local-retention policy will be specified after upload and recovery have been prototyped. Until then, successful upload or transfer does not by itself imply automatic local deletion.

## 9. Upload

Uploads must support large audio files, show progress, explain failure, allow retry, retain the local recording on failure, and resume where technically practical after connectivity returns.

The app may only describe a recording as **safely stored remotely** when the server has confirmed durable persistence. An initiated or completed network request alone is insufficient.

An upload failure must leave the recording in `UPLOAD_FAILED` with a retry action. Loss of connectivity should pause or fail safely without discarding local data; restarting from zero is permitted only when technically unavoidable and must be clearly explained.

## 10. Transfer and Delivery

The initial intended transfer provider is WeTransfer, behind a backend transfer-provider abstraction so that the interview and recording domains do not depend on it.

For v0.2, **delivered** means: the transfer or secure link has been successfully created and sent to the explicitly confirmed recipient address. It does **not** mean the recipient has opened, downloaded or listened to the recording. Those are future capabilities unless a chosen provider reliably supports them and the product chooses to expose them.

Before implementation, the team must validate that the selected WeTransfer product/API supports the required authenticated workflow, retention, privacy controls, auditability, commercial terms and transfer lifecycle. If it does not, select another provider without changing the core domain model.

## 11. Recipients

The initial version supports one recipient email address. The interviewer must review and explicitly confirm the address before sending.

Multiple recipients, saved recipients, organisations, access permissions, expiry controls and internal archive destinations are future scope unless brought into a later increment.

## 12. Authentication

Only authorised StoriesForLife users may access the app. The eventual solution must provide secure authentication, secure session/token handling, logout, credential expiry and access revocation. The provider and backend architecture will be selected before the authentication increment.

## 13. Privacy, Consent and Security

Recordings may contain highly personal, and potentially special-category, personal data. Privacy and security are product requirements, not implementation afterthoughts.

The product must provide encryption in transit, secure server-side storage, appropriate local protection, access control, authentication, auditability of important actions, recipient confirmation, and controlled retention/deletion.

Before the app is used with real participants, StoriesForLife must define and validate:

- How informed consent is captured and evidenced
- Whether special-category personal data is expected
- Data controller and processor responsibilities
- Lawful basis and applicable GDPR/privacy requirements
- Retention periods for device, server and transfer-provider copies
- Deletion, access and correction request processes
- Who may send and who may receive recordings
- Incident and breach-handling responsibilities

The first technical recording spike may use only synthetic, non-sensitive test recordings until these decisions are complete.

## 14. User Experience and Accessibility

The app should be simple, obvious, safe, recoverable and quiet during an interview. Destructive actions require confirmation. Failure screens must present the current status and the next safe action, not merely an error code.

Initial accessibility requirements:

- Large, readable controls and recording status
- Screen-reader labels for all controls and status changes
- Sufficient visual contrast
- No status conveyed by colour alone
- Tap targets suitable for users with limited dexterity
- Playback and recovery actions usable without specialist knowledge

## 15. Initial Screens

The eventual app is expected to contain:

```text
Login
Interview list
New interview
Recording
Recording review
Upload progress
Recipient confirmation
Completed / transfer status
```

Navigation will be refined as increments are built.

## 16. Out of Scope for v0.2

- Automatic transcription or AI summaries
- Search across recordings
- Video recording
- Photograph or document capture
- Advanced interview templates
- Public sharing or social features
- Analytics dashboards
- Complex recipient management
- Offline account creation
- Multi-language UI
- Multiple recordings per interview
- Appending to a stopped recording

## 17. Testing Strategy

StoriesForLife will use TDD. Tests should demonstrate product behaviour rather than merely increase coverage.

- **Domain tests:** lifecycle rules, persistence rules and delivery rules.
- **Application/service tests:** orchestration between domain, recorder, local storage, upload and transfer boundaries.
- **Integration tests:** storage, database and API boundaries; external services are normally test doubles.
- **End-to-end tests:** a small set of critical mobile journeys on iOS and Android.

The critical eventual E2E path is:

```text
Create interview → record → stop → review → upload → confirm recipient → send
```

## 18. Acceptance Criteria for the First Increment

The first increment proves local recording and recovery only. It excludes authentication, backend services, upload, transfer provider and recipient management.

### AC1 — Create and record

```text
Given a new interview with required metadata
When the interviewer starts and stops a recording
Then the interview appears in the interview list with a playable local recording.
```

### AC2 — Pause and resume

```text
Given a recording is active
When the interviewer pauses and then resumes it
Then elapsed time and recording state are clear
And the completed recording is playable.
```

### AC3 — Interruption recovery

```text
Given a recording is in progress
When the app is interrupted or restarted
Then the app restores a playable recording where technically possible
Or clearly reports that recovery was not possible.
```

### AC4 — Storage safety

```text
Given device storage is insufficient for recording to continue safely
When the condition is detected
Then the interviewer receives a clear warning
And no existing recording is overwritten or silently discarded.
```

### AC5 — Safe deletion

```text
Given an interview has a local recording
When the interviewer chooses Delete
Then the app requests confirmation
And cancellation leaves the interview and recording unchanged.
```

### AC6 — Local persistence

```text
Given a recording has been stopped successfully
When the app is closed and reopened
Then the interview and playable local recording remain visible.
```

## 19. Definition of Done

A feature is complete when its intended behaviour and key acceptance criteria are documented; relevant automated tests pass; failure and recovery behaviour have been considered; privacy and security implications have been considered where applicable; it has been manually exercised on the relevant platforms; accessibility implications have been considered; and learning has been incorporated into this specification.

## 20. Open Questions and Just-in-Time Decisions

The following are intentionally unresolved. They should be answered before the increment that depends on them, rather than all at once:

1. What authentication provider and backend architecture should be used?
2. Where are recordings stored and backed up?
3. What audio codec, container, quality, maximum duration and maximum file size meet the need?
4. Does the required recording behaviour work reliably during backgrounding, calls and OS termination on both platforms?
5. What local encryption/protection is required?
6. What explicit local deletion and retention policy should apply after remote confirmation?
7. Which transfer provider and API meet the required security and delivery needs?
8. What consent, GDPR, retention and data-subject-rights processes apply?
9. May interview metadata be edited after upload, and what audit trail is required?
10. Are uploads allowed on mobile data, Wi-Fi only, or interviewer-configurable?
11. What tablet support and administrative functionality are required?

## 21. Iterative Specification Process

```text
Observe / discuss
      ↓
Update specification
      ↓
Write acceptance criteria
      ↓
Write failing tests
      ↓
Implement
      ↓
Evaluate and learn
      ↓
Update specification
```

Changes must be deliberate and visible. When implementation disproves an earlier assumption, update the specification rather than preserving an obsolete requirement.

## 22. Current Guiding Principle

> Build the smallest useful thing, test what matters, protect people's stories, learn, and evolve the specification with the product.
