# StoriesForLife Recording App — Incremental Delivery Task List v0.1

**Status:** In progress — Slice 0 complete; Slice 1 partially implemented and acceptance-verified work remains outstanding.  
**Inputs:** Product Specification v0.2 and Initial Product Design v0.1  
**Delivery approach:** Small, demonstrable vertical slices; each slice leaves the app working and adds user-visible value.

## Working rules

- Build the local-recording increment before authentication, upload and delivery.
- Begin each slice by writing the acceptance tests for its user-visible behaviour.
- Keep domain lifecycle state, recording persistence state and delivery state separate in code.
- Do not create work that silently deletes, overwrites or hides a local recording.
- Each slice includes accessibility checks, error handling and manual testing on iOS and Android where applicable.

## Slice map

| Order | Slice                             | User-visible outcome                                                                         | Depends on |
| ----- | --------------------------------- | -------------------------------------------------------------------------------------------- | ---------- |
| 0     | Project foundation                | The app launches with a testable mobile shell.                                               | —          |
| 1     | Durable interview drafts          | An interviewer can create an interview and find it after restart.                            | 0          |
| 2     | Start and stop a local recording  | An interviewer can create, stop and find a recorded interview.                               | 1          |
| 3     | Pause, resume and playback        | An interviewer can confidently manage and review an interview recording.                     | 2          |
| 4     | Safe replace and delete           | An interviewer can re-record or delete only with explicit confirmation.                      | 3          |
| 5     | Interruption recovery             | An interviewer can discover and act on interrupted recordings after returning or restarting. | 3          |
| 6     | Permission and storage safety     | The app fails safely when recording cannot start or continue.                                | 2          |
| 7     | Local-recording release hardening | The complete first-increment journey is dependable and accessible on both platforms.         | 1–6        |

Slices 4, 5 and 6 may proceed in parallel once Slice 3 is stable, provided they do not change each other's persistence contracts.

## Slice 0 — Project foundation

**Goal:** Establish a minimal React Native + TypeScript application that can support test-driven work.

### Tasks

- [x] Initialise the React Native TypeScript project and confirm supported iOS and Android build targets.
- [x] Add formatting, linting, type checking and unit-test commands suitable for CI.
- [x] Create the app shell with native stack navigation and an `Interviews` entry screen.
- [x] Establish test doubles for time, unique ID generation, device storage and audio recording boundaries.
- [x] Define the core domain types: interview metadata, interview lifecycle, recording persistence and delivery lifecycle.
- [x] Add a short architecture record explaining local-only scope, dependency boundaries and non-identifying recording filenames.
- [x] Configure synthetic test data only; do not place real interview data or audio in the repository.

### Done when

- The app opens to an empty `Interviews` screen on iOS and Android simulators/emulators.
- `lint`, type checking and automated tests run successfully from a clean checkout.
- Domain tests prove that lifecycle concepts are separate and invalid transitions are rejected.

### Slice 0 delivery note

The JavaScript shell, domain tests, lint, type checking, formatting, and Android/iOS JavaScript bundle exports are validated on Windows. Android emulator/device launch validation remains outstanding because no Android target is available on this machine. Native iOS launch validation requires macOS/Xcode.

## Slice 1 — Durable interview drafts

**Goal:** An interviewer can enter required details, save a draft and see it after restarting the app.

### Tasks

- [x] Write acceptance tests for creating an interview with required metadata and preserving it after restart.
- [x] Implement a local interview repository with atomic metadata writes and migration/version handling.
- [x] Build the interview list with empty state, `New interview` action and readable draft rows.
- [x] Build the interview-details form: interviewee name, date, interviewer and optional notes.
- [x] Validate required fields with clear, accessible inline messages.
- [x] Save the draft before moving to the recording screen.
- [x] Preserve entered values when the user navigates back; confirm before discarding changed, unsaved form data.
- [ ] Add screen-reader labels, focus order and Dynamic Type checks for the list and form.

### Acceptance demonstration

Create an interview for a synthetic participant, close the app, reopen it and find the interview in the list as `Ready to record`.

### Done when

- Automated tests cover valid creation, missing required fields, draft persistence and cancelled discard.
- The draft survives an app relaunch on both platforms.
- The local record contains no recording filename until recording begins.

## Slice 2 — Start and stop a local recording

**Goal:** An interviewer can make a single local recording and return to a visible, durable interview record.

### Tasks

- [ ] Run the audio technical spike: choose a platform-supported speech format, quality defaults, storage location and filename strategy; record the decision.
- [ ] Define a `Recorder` boundary supporting prepare, start, stop, status and error events.
- [ ] Implement secure, non-identifying local filename generation such as `recording-<random-id>.m4a`.
- [ ] Build the recording screen's ready and active states, elapsed timer and local-save message.
- [ ] Request microphone permission only when the interviewer starts recording.
- [ ] Persist recording-session intent and associate the generated local file with the interview before audio capture begins.
- [ ] Implement start and stop operations, transitioning `DRAFT → RECORDING → RECORDED` only after successful completion.
- [ ] Show the stop confirmation, then move to a simple recording-ready review state.
- [ ] Add tests for state transitions, generated filenames, recording association and stop confirmation cancellation.

### Acceptance demonstration

Create an interview, start a short synthetic recording, stop it and return to the list. The interview is shown as `Recording ready on this device`.

### Done when

- A stopped recording is a real file outside volatile memory and its metadata is durable.
- The recording screen continuously displays both active state and elapsed time.
- Stopping never appends to an earlier finalised recording.

## Slice 3 — Pause, resume and playback

**Goal:** An interviewer can manage an ongoing recording and check a completed one before any sharing happens.

### Tasks

- [ ] Write acceptance tests for pause/resume timing, state changes and playable completed audio.
- [ ] Extend the recorder boundary for pause and resume, including unsupported-capability handling.
- [ ] Implement recording-screen paused state, local-save language and resume action.
- [ ] Ensure elapsed time accounts for only captured audio, or clearly specify and apply the platform-consistent alternative.
- [ ] Build the full recording-review screen: local-only safety statement, duration, metadata summary and accessible player.
- [ ] Verify audio existence and playability before presenting `Recording ready`.
- [ ] Announce recording start, pause, resume and stop to assistive technology.
- [ ] Add manual platform tests for playback through device audio routes.

### Acceptance demonstration

Record, pause, resume and stop. Play the recording from review and verify that the interview remains visible after relaunch.

### Done when

- Completed audio can be played from the review screen on both platforms.
- The user never sees `Saved on this device only` for a missing or unplayable file.
- Controls meet tap-target, label and focus requirements.

## Slice 4 — Safe replace and delete

**Goal:** An interviewer can correct a recording without accidental loss.

### Tasks

- [ ] Write acceptance tests for delete cancellation, confirmed delete and confirmed re-record behaviour.
- [ ] Implement a reusable destructive-confirmation pattern that names the affected recording.
- [ ] Add `Record again` from review; preserve the existing audio until replacement is explicitly confirmed.
- [ ] Add `Delete recording`; cancellation is a no-op.
- [ ] On confirmed replacement or deletion, update metadata and remove only the exact associated local file.
- [ ] Protect operations against missing files and interrupted deletion; never alter unrelated interview records.
- [ ] Add screen-reader descriptions that make destructive consequences explicit.

### Acceptance demonstration

From review, cancel deletion and confirm the audio is still playable. Then choose `Record again`, confirm replacement and make a new recording.

### Done when

- The last known good recording is never removed before the user's explicit confirmed action.
- Tests prove cancellation leaves metadata and audio unchanged.
- A deleted or replaced recording is not shown as available in the list or review screen.

## Slice 5 — Interruption recovery

**Goal:** After interruption or restart, the interviewer can find a recoverable recording or receive an honest explanation.

### Tasks

- [ ] Write acceptance tests for relaunch while recording, a recoverable partial file and unrecoverable session data.
- [ ] Persist a recording-session checkpoint and update it as the recorder changes state.
- [ ] On app launch and foreground return, inspect incomplete sessions and verify whether local audio is playable.
- [ ] Implement the `Recording needs attention` list state and prioritise it without concealing other interviews.
- [ ] Build recoverable and unrecoverable recovery prompts exactly as specified.
- [ ] Provide review, retain-for-later, delete and start-again actions as appropriate.
- [ ] Test app backgrounding/foreground return and forced-restart behaviour on real devices where possible.
- [ ] Document platform-specific recovery limitations discovered during testing.

### Acceptance demonstration

Begin recording, interrupt or restart the app, then reopen it. The app either offers a playable recording for review or states plainly that it cannot be recovered.

### Done when

- Every interrupted session is discoverable after restart.
- The UI never claims recovery succeeded without a verified playable file.
- Failed recovery does not damage unaffected interviews or recordings.

## Slice 6 — Permission and storage safety

**Goal:** Microphone and storage failures protect existing audio and explain the next safe action.

### Tasks

- [ ] Write acceptance tests for denied/revoked microphone permission and insufficient-storage behaviour.
- [ ] Implement microphone-permission states and the `Open settings` recovery action.
- [ ] Define a preflight storage threshold based on the selected audio format and a conservative minimum recording duration.
- [ ] Monitor available storage while recording where platform APIs permit.
- [ ] Stop safely when storage becomes unsafe, finalise any usable audio where possible, and direct the interviewer to review.
- [ ] Add clear warning dialogs that state what happened, whether captured audio remains safe, and the next action.
- [ ] Add test doubles that simulate permission and storage boundary conditions.
- [ ] Manually test low-storage and permission flows on both platforms where technically feasible.

### Acceptance demonstration

Deny microphone permission and verify no recording is created. Simulate low storage during recording and verify existing captured audio remains available for review where the platform permits finalisation.

### Done when

- Permission failures do not create misleading recording states.
- Insufficient storage never overwrites or silently discards an existing good recording.
- All messages use plain language, not raw operating-system error codes.

## Slice 7 — Local-recording release hardening

**Goal:** The first increment meets its acceptance criteria as a coherent, reliable mobile journey.

### Tasks

- [ ] Add end-to-end coverage for create → record → pause/resume → stop → review → relaunch → playback.
- [ ] Add end-to-end coverage for delete cancellation and confirmed deletion.
- [ ] Add end-to-end coverage for at least one recoverable and one unrecoverable interruption outcome.
- [ ] Run the full test suite, linting and type checks in CI for Android and iOS builds.
- [ ] Manually exercise the critical journey on supported physical devices, including backgrounding, audio interruption and device restart scenarios.
- [ ] Perform accessibility testing with VoiceOver and TalkBack, large text and reduced motion.
- [ ] Review local file protection, app logs and analytics to ensure no sensitive metadata or audio path is exposed unnecessarily.
- [ ] Review and update the product specification and design with verified platform limitations and decisions from the audio spike.
- [ ] Produce a short release-readiness checklist and known-limitations note.

### Done when

- Acceptance criteria AC1–AC6 in the product specification are evidenced by automated and manual tests.
- The known recovery behaviours are explicit for each platform.
- No unresolved issue permits silent loss of the only local recording.

## Deferred slices

Do not schedule these until the prerequisite product decisions are made:

1. Authentication and authorised access.
2. Resumable upload and durable remote-persistence confirmation.
3. Recipient confirmation and transfer-provider integration.
4. Local-retention choices after confirmed remote persistence.
5. Consent, privacy operations, retention and deletion workflows.

Each should begin as its own vertical slice and preserve the local-recording safety guarantees established above.
