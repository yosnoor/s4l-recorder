/**
 * Non-identifying recording filename generation.
 *
 * A recording filename must never contain participant names, dates, notes or any
 * other interview metadata. See ADR 0001 for the format decision.
 *
 * No React Native or storage imports are permitted in this file.
 */

import type { IdGenerator } from "../ports";

/** Extension chosen in ADR 0001: AAC audio in an MPEG-4 container. */
export const RECORDING_FILE_EXTENSION = ".m4a";

/** The only shape a valid recording filename may take. */
export const RECORDING_FILENAME_PATTERN = /^recording-[a-z0-9]+\.m4a$/;

/**
 * Builds a filename of the form `recording-<random-id>.m4a`.
 *
 * The id is reduced to lowercase alphanumerics so the result is safe on every
 * platform filesystem and contains no separators, spaces or path traversal.
 */
export function generateRecordingFilename(idGenerator: IdGenerator): string {
  const rawId = idGenerator.generate();
  const safeId = rawId.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (safeId.length === 0) {
    throw new Error(
      "generateRecordingFilename: id generator produced no usable characters.",
    );
  }

  return `recording-${safeId}${RECORDING_FILE_EXTENSION}`;
}

/** True when the value is a well-formed, non-identifying recording filename. */
export function isValidRecordingFilename(filename: string): boolean {
  return RECORDING_FILENAME_PATTERN.test(filename);
}
