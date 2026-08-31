/**
 * Core domain types for the StoriesForLife Recording App.
 *
 * These types contain no React Native or storage imports. They represent the
 * pure domain model described in the product specification. The three lifecycle
 * concepts are deliberately kept as separate fields so their independent
 * recovery behaviours remain visible in code.
 */

// ---------------------------------------------------------------------------
// Interview lifecycle
// ---------------------------------------------------------------------------

/**
 * The interviewer's work on the recording.
 *
 * Transitions: DRAFT → RECORDING → RECORDED
 *              RECORDING → RECORDING_RECOVERABLE → RECORDED | DRAFT
 */
export type InterviewLifecycle =
  "DRAFT" | "RECORDING" | "RECORDED" | "RECORDING_RECOVERABLE";

// ---------------------------------------------------------------------------
// Recording persistence lifecycle
// ---------------------------------------------------------------------------

/**
 * Whether a durable remote copy of the recording exists.
 *
 * Transitions: LOCAL_ONLY → UPLOAD_IN_PROGRESS → REMOTE_CONFIRMED
 *                                              └→ UPLOAD_FAILED → UPLOAD_IN_PROGRESS
 */
export type RecordingPersistence =
  "LOCAL_ONLY" | "UPLOAD_IN_PROGRESS" | "REMOTE_CONFIRMED" | "UPLOAD_FAILED";

// ---------------------------------------------------------------------------
// Delivery lifecycle
// ---------------------------------------------------------------------------

/**
 * Whether a transfer to a recipient has been created.
 *
 * Transitions: NOT_SENT → TRANSFER_IN_PROGRESS → TRANSFER_CREATED
 *                                              └→ TRANSFER_FAILED → TRANSFER_IN_PROGRESS
 */
export type DeliveryLifecycle =
  "NOT_SENT" | "TRANSFER_IN_PROGRESS" | "TRANSFER_CREATED" | "TRANSFER_FAILED";

// ---------------------------------------------------------------------------
// Interview metadata
// ---------------------------------------------------------------------------

/**
 * All metadata associated with a single interview.
 *
 * `recordingFilename` is absent until recording begins and follows the
 * non-identifying pattern `recording-<random-id>.m4a` to avoid embedding
 * participant names or sensitive content in filenames.
 */
export interface InterviewMetadata {
  readonly id: string;
  readonly intervieweeName: string;
  readonly interviewDate: string; // ISO 8601 date string, e.g. "2026-08-23"
  readonly interviewer: string;
  readonly notes: string;
  readonly recordingFilename: string | null;
  /**
   * Captured length of the finished recording in milliseconds. Absent on
   * records written before recording was supported, and null until a recording
   * has been stopped successfully.
   */
  readonly recordingDurationMs?: number | null;
  readonly createdAt: string; // ISO 8601 datetime string
  readonly updatedAt: string; // ISO 8601 datetime string
}

// ---------------------------------------------------------------------------
// Interview (aggregate root)
// ---------------------------------------------------------------------------

/**
 * A complete interview record: metadata plus the three independent lifecycle
 * state fields. All three fields must be persisted and restored together.
 */
export interface Interview {
  readonly metadata: InterviewMetadata;
  readonly interviewLifecycle: InterviewLifecycle;
  readonly recordingPersistence: RecordingPersistence;
  readonly deliveryLifecycle: DeliveryLifecycle;
}
