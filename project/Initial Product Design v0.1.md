# StoriesForLife Recording App — Initial Product Design v0.1

**Status:** Proposed design for the local-recording increment  
**Based on:** Recording Product Specification v0.2, 22 August 2026

## 1. Design intent

The app should feel calm, dependable and easy to operate while sitting with a person who is sharing their story. The interface supports one clear task at a time and always tells the interviewer whether their recording is safe.

The first increment is a local-only mobile experience. It includes creating an interview, recording, pausing, resuming, stopping, listening back, retaining recordings across restarts, and safely deleting or re-recording. Upload and sending are deliberately not presented as working actions yet.

### Experience principles

1. **Protect the story first.** Recording safety and recoverability take precedence over a fast-looking workflow.
2. **Make the next action obvious.** Each screen has a single primary action and plain-language state.
3. **Keep the room quiet.** Avoid dense controls, technical terminology and unnecessary interruption while recording.
4. **Never hide uncertainty.** If a recording is only on the device or recovery is incomplete, say so plainly.
5. **Ask before destructive actions.** Deleting and replacing a recording always require clear confirmation.

## 2. Information architecture

```text
Interviews
├── New interview
│   ├── Interview details
│   └── Recording
│       └── Recording review
├── Interview details / recording review
└── Recovery prompt (only when needed after an interruption)
```

The interview list is the home screen after authentication is added. For the first increment, it is the app entry point.

## 3. Navigation model

- Use a native stack navigation pattern with a visible Back control on secondary screens.
- Preserve entered metadata when navigating back from recording.
- An active recording must not be silently abandoned by Back navigation. Show an interruption-aware confirmation that explains what will happen to the local recording.
- Once recording has stopped, the user returns to the recording review screen rather than directly to the list. This makes playback and the safety state hard to miss.
- A recovered session opens a dedicated recovery prompt before the user resumes normal navigation.

## 4. Screen designs

### 4.1 Interview list

**Purpose:** Find a local interview, understand its recording state, or begin a new one.

**Header:** `Interviews`

**Primary action:** `New interview`

**List item content:**

- Interviewee name (primary label)
- Interview date and interviewer (secondary label)
- One written status, paired with an icon:
  - `Ready to record`
  - `Recording in progress`
  - `Recording ready on this device`
  - `Recording needs attention`
- Last updated time

**Empty state:**

> No interviews yet  
> Start a new interview when you are ready to record.

The empty state includes the same `New interview` action. No search, filters or analytics are needed for this increment.

### 4.2 New interview — details

**Purpose:** Capture the minimum context before recording.

**Fields:**

| Field | Control | Validation |
| --- | --- | --- |
| Interviewee name | Single-line text input | Required |
| Interview date | Native date picker | Required; defaults to today |
| Interviewer | Single-line text input | Required; may later default from the account |
| Notes | Multi-line text input | Optional |

**Primary action:** `Continue to recording`

**Secondary action:** Back / Cancel. If fields contain changes, ask whether to discard the draft.

Keep the form on one scrollable screen. Labels remain visible above fields; placeholder text is not used as a replacement for labels.

### 4.3 Recording

**Purpose:** Let the interviewer make a local recording with unmistakable active status.

**Layout, from top to bottom:**

1. Interviewee name and date, with a `Change details` text action before recording begins.
2. Large state label with an icon and text. Examples: `Ready to record`, `Recording`, `Paused`.
3. Large elapsed-time display in tabular numerals (`00:00:00`).
4. A persistent local-safety message:
   - Before recording: `Your recording will be saved on this device.`
   - While recording: `Recording is being saved on this device.`
   - Paused: `Your recording is paused and saved on this device.`
5. One large, full-width primary action:
   - `Start recording`
   - `Pause recording`
   - `Resume recording`
6. A lower-emphasis `Stop recording` action, available only when recording or paused.

The active state uses more than colour: a filled recording indicator, the word `Recording`, elapsed time and an accessible announcement. The stop action must remain visually distinct from pause/resume and must never be positioned where it can be hit accidentally.

**Stop confirmation:**

> Stop recording?  
> You will be able to listen to it, delete it, or record again before it is shared.

Actions: `Keep recording` and destructive-emphasis `Stop and review`.

### 4.4 Recording review

**Purpose:** Confirm that the recording is available, make playback easy, and give safe choices before a later upload flow exists.

**Content:**

- Title: `Recording ready`
- Safety statement: `Saved on this device only`
- Duration and created time
- Accessible audio player with play/pause, seek control and elapsed/remaining time
- Interview metadata, with `Edit details` text action

**Actions:**

1. `Play recording` (or native player play control)
2. `Record again` — opens a confirmation and preserves the current recording unless replacement is explicitly confirmed
3. `Delete recording` — destructive action, visually separated from ordinary actions
4. `Back to interviews`

For this increment, show an unobtrusive note below the actions:

> Sending will be available in a future update. This recording remains on this device.

### 4.5 Recovery prompt

**Purpose:** Explain an interrupted recording honestly and keep any recoverable audio discoverable.

There are two variants.

**Recoverable variant:**

> We found a recording that was interrupted.  
> It may be available to listen to and keep.

Actions: `Review recording` (primary), `Delete recording` (secondary destructive), `Keep for later`.

**Not recoverable variant:**

> This recording could not be recovered.  
> No playable audio is available. Your other interviews are unchanged.

Actions: `Return to interview`, `Start a new recording`.

Never describe an interrupted session as saved unless a playable local file has been verified.

### 4.6 Storage and permission warnings

Warnings interrupt recording only when continuing would be unsafe.

| Condition | Message | Safe action |
| --- | --- | --- |
| Microphone unavailable | `Microphone access is needed to record.` | `Open settings`, `Back` |
| Low storage | `There may not be enough space to keep recording safely.` | `Stop and review`, `Back to interviews` |
| Recording stopped for storage | `Recording stopped to protect the audio already captured.` | `Review recording` |
| Audio interruption | `Recording was interrupted.` | `Resume recording`, `Stop and review` |

Technical error codes may be logged but are not shown as the principal user message.

## 5. Recording state language

The interface maps product state to a clear phrase; it does not expose internal lifecycle constants.

| Product state | Visible wording | Available action |
| --- | --- | --- |
| Draft | `Ready to record` | Start recording |
| Recording | `Recording` | Pause or stop |
| Recording paused | `Paused` | Resume or stop |
| Recoverable interruption | `Recording needs attention` | Review, retain or delete |
| Recorded / local only | `Saved on this device only` | Play, re-record or delete |
| Upload in progress (future) | `Saving securely online…` | View progress |
| Remote confirmed (future) | `Safely stored online` | Confirm recipient |
| Transfer created (future) | `Sent` | View transfer details |

## 6. Visual direction

The visual style is warm, restrained and practical: a light neutral background, dark high-contrast text, one deep, reassuring primary colour and a clearly reserved destructive colour. It should avoid the visual language of a media studio or social sharing product.

- Use a system sans-serif font for legibility and platform familiarity.
- Use large headings and an oversized elapsed-time display while recording.
- Support Dynamic Type / font scaling without truncating primary actions.
- Use familiar text-labeled controls; icons supplement text rather than replace it.
- Make all primary and destructive actions at least 48 × 48 dp.
- Maintain a minimum 4.5:1 contrast ratio for normal text and 3:1 for large text and essential controls.
- Do not rely on red alone for recording or warning; pair it with text, shape and status announcements.

## 7. Accessibility behaviour

- Every interactive control has a specific screen-reader label, including state: for example, `Pause recording. Elapsed time 12 minutes 8 seconds.`
- Announce recording start, pause, resume, stop and recovery status through a polite live region / platform accessibility announcement.
- Do not auto-play audio when entering review.
- Preserve logical focus after a dialog closes. After stopping, focus the `Recording ready` heading.
- Use native date picker and audio controls where possible to inherit platform accessibility support.
- Respect reduced-motion settings; no motion is required to convey recording state.

## 8. Critical interaction rules

1. The app creates and persists the interview draft before the microphone is opened.
2. Starting a recording immediately shows both active status and local-save status.
3. `Stop recording` finalises the current audio and leads to review; the user cannot append afterwards.
4. `Record again` and `Delete recording` must name the recording being affected and require confirmation.
5. Cancelling a destructive confirmation makes no change.
6. A failed recovery never removes other interviews or recordings.
7. The list always surfaces recordings needing attention above ordinary drafts, without hiding the rest of the user's work.

## 9. First-increment design acceptance checks

- A new interviewer can locate the main action on every screen without reading technical help.
- During recording, a user can identify the active state, elapsed time and safe next action from the screen alone.
- Every completed local recording visibly states that it is stored on the device only.
- Deletion and replacement require an explicit confirmation and offer a cancel path.
- Every warning states what happened, whether existing audio is safe, and the next safe action.
- Screen-reader users receive the same state and recovery information as sighted users.

## 10. Deferred design work

Authentication, upload progress, recipient confirmation, transfer status, local-retention choice after remote confirmation, consent capture and account settings remain intentionally deferred until their corresponding product decisions are made.
