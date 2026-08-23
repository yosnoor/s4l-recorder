/**
 * Port contracts for the StoriesForLife Recording App.
 *
 * These interfaces isolate the domain and application layer from platform
 * services. Production adapters will be added in later slices. Tests use
 * deterministic in-memory fakes (see fakes.ts).
 *
 * No React Native imports are permitted here; ports are plain TypeScript.
 */

import type { Interview } from '../domain/types';

// ---------------------------------------------------------------------------
// Clock
// ---------------------------------------------------------------------------

/**
 * Provides the current wall-clock time. Abstracted so tests can use a
 * deterministic, controllable clock rather than Date.now().
 */
export interface Clock {
  /** Returns the current UTC time as an ISO 8601 datetime string. */
  now(): string;
}

// ---------------------------------------------------------------------------
// ID generator
// ---------------------------------------------------------------------------

/**
 * Generates unique identifiers. Abstracted so tests can use predictable,
 * incrementing IDs rather than random values.
 */
export interface IdGenerator {
  /** Returns a new unique identifier string. */
  generate(): string;
}

// ---------------------------------------------------------------------------
// Interview repository
// ---------------------------------------------------------------------------

/**
 * Persists and retrieves interviews on-device. The production implementation
 * will write to device storage (e.g. AsyncStorage or SQLite). Tests use an
 * in-memory fake.
 *
 * All operations are async to match the expected storage API shape.
 */
export interface InterviewRepository {
  /** Persists a new interview. Throws if an interview with the same id already exists. */
  save(interview: Interview): Promise<void>;

  /** Replaces an existing interview. Throws if the interview does not exist. */
  update(interview: Interview): Promise<void>;

  /** Returns the interview with the given id, or null if not found. */
  findById(id: string): Promise<Interview | null>;

  /** Returns all interviews ordered by updatedAt descending. */
  findAll(): Promise<Interview[]>;

  /** Removes the interview with the given id. No-op if not found. */
  delete(id: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Audio recorder
// ---------------------------------------------------------------------------

/** The observable state of the audio recorder. */
export type RecorderStatus =
  | 'IDLE'
  | 'PREPARING'
  | 'RECORDING'
  | 'PAUSED'
  | 'STOPPED'
  | 'ERROR';

/** Events emitted by the AudioRecorder during a recording session. */
export type RecorderEvent =
  | { type: 'STARTED'; filename: string }
  | { type: 'PAUSED' }
  | { type: 'RESUMED' }
  | { type: 'STOPPED'; filename: string; durationMs: number }
  | { type: 'ERROR'; message: string };

/** Callback invoked when the recorder emits an event. */
export type RecorderEventHandler = (event: RecorderEvent) => void;

/**
 * Boundary for audio recording. Isolates the domain from platform audio APIs.
 * The production implementation will use expo-av or a similar RN audio module.
 * Tests use a controllable in-memory fake.
 */
export interface AudioRecorder {
  /** Current recorder status. */
  readonly status: RecorderStatus;

  /**
   * Prepares the recorder for a new session and returns the filename that will
   * be used if recording starts. The filename must follow the pattern
   * `recording-<id>.m4a` and must not contain sensitive data.
   */
  prepare(filename: string): Promise<void>;

  /** Starts recording. Requires a prior successful prepare() call. */
  start(): Promise<void>;

  /** Pauses an active recording. */
  pause(): Promise<void>;

  /** Resumes a paused recording. */
  resume(): Promise<void>;

  /**
   * Stops the recording and finalises the local file. After stop() the session
   * cannot be resumed; a new prepare() is required to record again.
   */
  stop(): Promise<void>;

  /** Registers a handler for recorder lifecycle events. */
  onEvent(handler: RecorderEventHandler): void;
}
