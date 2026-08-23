/**
 * Lifecycle transition rules for the StoriesForLife domain.
 *
 * Each transition function returns a new state value and throws a descriptive
 * error if the requested transition is invalid. Callers must catch errors and
 * treat them as programming mistakes — the UI must never place the domain in
 * a state that makes an invalid transition reachable.
 *
 * No React Native or storage imports are permitted in this file.
 */

import type {
  DeliveryLifecycle,
  InterviewLifecycle,
  RecordingPersistence,
} from "./types";

// ---------------------------------------------------------------------------
// Interview lifecycle transitions
// ---------------------------------------------------------------------------

/**
 * DRAFT → RECORDING
 * Called when the interviewer starts recording.
 */
export function startRecording(current: InterviewLifecycle): "RECORDING" {
  if (current !== "DRAFT") {
    throw new Error(
      `Invalid interview lifecycle transition: cannot start recording from '${current}'. Expected 'DRAFT'.`,
    );
  }
  return "RECORDING";
}

/**
 * RECORDING → RECORDED
 * Called when the interviewer explicitly stops a recording.
 */
export function stopRecording(current: InterviewLifecycle): "RECORDED" {
  if (current !== "RECORDING") {
    throw new Error(
      `Invalid interview lifecycle transition: cannot stop recording from '${current}'. Expected 'RECORDING'.`,
    );
  }
  return "RECORDED";
}

/**
 * RECORDING → RECORDING_RECOVERABLE
 * Called when recording is interrupted unexpectedly (e.g. app kill, audio
 * session loss) and a partial local file may exist.
 */
export function markRecordingRecoverable(
  current: InterviewLifecycle,
): "RECORDING_RECOVERABLE" {
  if (current !== "RECORDING") {
    throw new Error(
      `Invalid interview lifecycle transition: cannot mark recoverable from '${current}'. Expected 'RECORDING'.`,
    );
  }
  return "RECORDING_RECOVERABLE";
}

/**
 * RECORDING_RECOVERABLE → RECORDED
 * Called when the interviewer successfully recovers a partial recording and
 * confirms it as the final recording.
 */
export function confirmRecovery(current: InterviewLifecycle): "RECORDED" {
  if (current !== "RECORDING_RECOVERABLE") {
    throw new Error(
      `Invalid interview lifecycle transition: cannot confirm recovery from '${current}'. Expected 'RECORDING_RECOVERABLE'.`,
    );
  }
  return "RECORDED";
}

/**
 * RECORDING_RECOVERABLE → DRAFT
 * Called when recovery is impossible or the interviewer discards the
 * interrupted session and intends to record again.
 */
export function discardRecovery(current: InterviewLifecycle): "DRAFT" {
  if (current !== "RECORDING_RECOVERABLE") {
    throw new Error(
      `Invalid interview lifecycle transition: cannot discard recovery from '${current}'. Expected 'RECORDING_RECOVERABLE'.`,
    );
  }
  return "DRAFT";
}

// ---------------------------------------------------------------------------
// Recording persistence transitions
// ---------------------------------------------------------------------------

/**
 * LOCAL_ONLY → UPLOAD_IN_PROGRESS
 * Called when an upload is initiated.
 */
export function beginUpload(
  current: RecordingPersistence,
): "UPLOAD_IN_PROGRESS" {
  if (current !== "LOCAL_ONLY") {
    throw new Error(
      `Invalid recording persistence transition: cannot begin upload from '${current}'. Expected 'LOCAL_ONLY'.`,
    );
  }
  return "UPLOAD_IN_PROGRESS";
}

/**
 * UPLOAD_IN_PROGRESS → REMOTE_CONFIRMED
 * Called when the server confirms durable remote persistence.
 */
export function confirmRemote(
  current: RecordingPersistence,
): "REMOTE_CONFIRMED" {
  if (current !== "UPLOAD_IN_PROGRESS") {
    throw new Error(
      `Invalid recording persistence transition: cannot confirm remote from '${current}'. Expected 'UPLOAD_IN_PROGRESS'.`,
    );
  }
  return "REMOTE_CONFIRMED";
}

/**
 * UPLOAD_IN_PROGRESS → UPLOAD_FAILED
 * Called when an upload attempt fails.
 */
export function failUpload(current: RecordingPersistence): "UPLOAD_FAILED" {
  if (current !== "UPLOAD_IN_PROGRESS") {
    throw new Error(
      `Invalid recording persistence transition: cannot fail upload from '${current}'. Expected 'UPLOAD_IN_PROGRESS'.`,
    );
  }
  return "UPLOAD_FAILED";
}

/**
 * UPLOAD_FAILED → UPLOAD_IN_PROGRESS
 * Called when the interviewer retries a failed upload.
 */
export function retryUpload(
  current: RecordingPersistence,
): "UPLOAD_IN_PROGRESS" {
  if (current !== "UPLOAD_FAILED") {
    throw new Error(
      `Invalid recording persistence transition: cannot retry upload from '${current}'. Expected 'UPLOAD_FAILED'.`,
    );
  }
  return "UPLOAD_IN_PROGRESS";
}

// ---------------------------------------------------------------------------
// Delivery lifecycle transitions
// ---------------------------------------------------------------------------

/**
 * NOT_SENT → TRANSFER_IN_PROGRESS
 * Called when a transfer to a recipient is initiated.
 */
export function beginTransfer(
  current: DeliveryLifecycle,
): "TRANSFER_IN_PROGRESS" {
  if (current !== "NOT_SENT") {
    throw new Error(
      `Invalid delivery lifecycle transition: cannot begin transfer from '${current}'. Expected 'NOT_SENT'.`,
    );
  }
  return "TRANSFER_IN_PROGRESS";
}

/**
 * TRANSFER_IN_PROGRESS → TRANSFER_CREATED
 * Called when the transfer provider confirms the transfer was created.
 */
export function confirmTransfer(
  current: DeliveryLifecycle,
): "TRANSFER_CREATED" {
  if (current !== "TRANSFER_IN_PROGRESS") {
    throw new Error(
      `Invalid delivery lifecycle transition: cannot confirm transfer from '${current}'. Expected 'TRANSFER_IN_PROGRESS'.`,
    );
  }
  return "TRANSFER_CREATED";
}

/**
 * TRANSFER_IN_PROGRESS → TRANSFER_FAILED
 * Called when the transfer attempt fails.
 */
export function failTransfer(current: DeliveryLifecycle): "TRANSFER_FAILED" {
  if (current !== "TRANSFER_IN_PROGRESS") {
    throw new Error(
      `Invalid delivery lifecycle transition: cannot fail transfer from '${current}'. Expected 'TRANSFER_IN_PROGRESS'.`,
    );
  }
  return "TRANSFER_FAILED";
}

/**
 * TRANSFER_FAILED → TRANSFER_IN_PROGRESS
 * Called when the interviewer retries a failed transfer.
 */
export function retryTransfer(
  current: DeliveryLifecycle,
): "TRANSFER_IN_PROGRESS" {
  if (current !== "TRANSFER_FAILED") {
    throw new Error(
      `Invalid delivery lifecycle transition: cannot retry transfer from '${current}'. Expected 'TRANSFER_FAILED'.`,
    );
  }
  return "TRANSFER_IN_PROGRESS";
}
