/**
 * In-memory test doubles for all port contracts.
 *
 * These fakes are deterministic and controllable, making domain and
 * application-layer tests fast and repeatable without any platform APIs.
 *
 * No React Native imports are permitted here.
 */

import type { Interview } from "../domain/types";
import type {
  AudioRecorder,
  Clock,
  IdGenerator,
  InterviewRepository,
  RecorderEvent,
  RecorderEventHandler,
  RecorderStatus,
} from "./index";

// ---------------------------------------------------------------------------
// FakeClock
// ---------------------------------------------------------------------------

/**
 * A controllable clock that starts at a fixed point in time and can be
 * advanced in tests.
 *
 * Default epoch: 2026-01-01T00:00:00.000Z
 */
export class FakeClock implements Clock {
  private currentMs: number;

  constructor(initialIso = "2026-01-01T00:00:00.000Z") {
    this.currentMs = new Date(initialIso).getTime();
  }

  now(): string {
    return new Date(this.currentMs).toISOString();
  }

  /** Advance the clock by the given number of milliseconds. */
  advanceBy(ms: number): void {
    this.currentMs += ms;
  }

  /** Set the clock to a specific ISO 8601 datetime string. */
  setTo(iso: string): void {
    this.currentMs = new Date(iso).getTime();
  }
}

// ---------------------------------------------------------------------------
// FakeIdGenerator
// ---------------------------------------------------------------------------

/**
 * A deterministic ID generator that returns prefixed, incrementing integers.
 *
 * Default prefix: "id-"
 * First call returns "id-1", second "id-2", and so on.
 */
export class FakeIdGenerator implements IdGenerator {
  private counter: number;
  private readonly prefix: string;

  constructor(prefix = "id-", startAt = 1) {
    this.prefix = prefix;
    this.counter = startAt;
  }

  generate(): string {
    return `${this.prefix}${this.counter++}`;
  }

  /** Reset the counter back to the starting value. */
  reset(startAt = 1): void {
    this.counter = startAt;
  }
}

// ---------------------------------------------------------------------------
// FakeInterviewRepository
// ---------------------------------------------------------------------------

/**
 * An in-memory interview repository. Stored in a plain Map so tests can
 * inspect or seed data directly via `store`.
 */
export class FakeInterviewRepository implements InterviewRepository {
  /** Direct access to the backing store for test setup and assertions. */
  readonly store = new Map<string, Interview>();

  async save(interview: Interview): Promise<void> {
    if (this.store.has(interview.metadata.id)) {
      throw new Error(
        `FakeInterviewRepository: interview '${interview.metadata.id}' already exists. Use update() to replace it.`,
      );
    }
    this.store.set(interview.metadata.id, interview);
  }

  async update(interview: Interview): Promise<void> {
    if (!this.store.has(interview.metadata.id)) {
      throw new Error(
        `FakeInterviewRepository: interview '${interview.metadata.id}' not found. Use save() to create it.`,
      );
    }
    this.store.set(interview.metadata.id, interview);
  }

  async findById(id: string): Promise<Interview | null> {
    return this.store.get(id) ?? null;
  }

  async findAll(): Promise<Interview[]> {
    const all = Array.from(this.store.values());
    return all.sort(
      (a, b) =>
        new Date(b.metadata.updatedAt).getTime() -
        new Date(a.metadata.updatedAt).getTime(),
    );
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  /** Remove all entries. Useful for test isolation. */
  clear(): void {
    this.store.clear();
  }
}

// ---------------------------------------------------------------------------
// FakeAudioRecorder
// ---------------------------------------------------------------------------

/**
 * A controllable audio recorder fake. Tests can call `simulateEvent()` to
 * drive the recorder into any state without involving platform audio APIs.
 */
export class FakeAudioRecorder implements AudioRecorder {
  private _status: RecorderStatus = "IDLE";
  private _preparedFilename: string | null = null;
  private readonly handlers: RecorderEventHandler[] = [];

  /** Sequence of calls made to this recorder, for assertion. */
  readonly calls: string[] = [];

  get status(): RecorderStatus {
    return this._status;
  }

  async prepare(filename: string): Promise<void> {
    this.calls.push(`prepare:${filename}`);
    this._preparedFilename = filename;
    this._status = "PREPARING";
  }

  async start(): Promise<void> {
    this.calls.push("start");
    if (!this._preparedFilename) {
      throw new Error("FakeAudioRecorder: start() called before prepare().");
    }
    this._status = "RECORDING";
    this.emit({ type: "STARTED", filename: this._preparedFilename });
  }

  async pause(): Promise<void> {
    this.calls.push("pause");
    this._status = "PAUSED";
    this.emit({ type: "PAUSED" });
  }

  async resume(): Promise<void> {
    this.calls.push("resume");
    this._status = "RECORDING";
    this.emit({ type: "RESUMED" });
  }

  async stop(): Promise<void> {
    this.calls.push("stop");
    if (!this._preparedFilename) {
      throw new Error(
        "FakeAudioRecorder: stop() called without a prepared filename.",
      );
    }
    this._status = "STOPPED";
    this.emit({
      type: "STOPPED",
      filename: this._preparedFilename,
      durationMs: 0,
    });
    this._preparedFilename = null;
  }

  onEvent(handler: RecorderEventHandler): void {
    this.handlers.push(handler);
  }

  /**
   * Directly emit a recorder event. Use in tests to simulate interruptions,
   * errors or successful completion without calling the operation methods.
   */
  simulateEvent(event: RecorderEvent): void {
    this.emit(event);
  }

  /**
   * Force the recorder into a specific status. Useful for seeding error
   * states that cannot be reached through normal operation methods.
   */
  forceStatus(status: RecorderStatus): void {
    this._status = status;
  }

  /** Clear the call log. Useful between test cases. */
  clearCalls(): void {
    this.calls.length = 0;
  }

  private emit(event: RecorderEvent): void {
    for (const handler of this.handlers) {
      handler(event);
    }
  }
}
