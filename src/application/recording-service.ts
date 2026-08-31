/**
 * Recording orchestration.
 *
 * Owns the order of operations that keeps an interview record honest:
 *
 *   start: guard → permission → filename → persist intent → prepare → capture → persist RECORDING
 *   stop:  guard → finalise file → persist RECORDED
 *
 * Nothing here imports React Native or a storage API directly; every platform
 * capability arrives as a port so the ordering can be asserted in tests.
 */

import { startRecording, stopRecording } from "../domain/lifecycle";
import { generateRecordingFilename } from "../domain/recording-filename";
import type { Interview } from "../domain/types";
import type {
  AudioRecorder,
  Clock,
  IdGenerator,
  InterviewRepository,
  MicrophonePermission,
} from "../ports";

/** Raised when the interviewer declines microphone access. */
export class MicrophonePermissionDeniedError extends Error {
  constructor() {
    super("Microphone access is needed to record this interview.");
    this.name = "MicrophonePermissionDeniedError";
  }
}

/** Raised when the requested interview is not in local storage. */
export class InterviewNotFoundError extends Error {
  constructor(id: string) {
    super(`Interview '${id}' was not found on this device.`);
    this.name = "InterviewNotFoundError";
  }
}

export type RecordingServiceDeps = {
  repository: InterviewRepository;
  recorder: AudioRecorder;
  permission: MicrophonePermission;
  clock: Clock;
  idGenerator: IdGenerator;
};

export class RecordingService {
  constructor(private readonly deps: RecordingServiceDeps) {}

  /**
   * Begins a recording session.
   *
   * The interview is only moved to `RECORDING` once audio capture has actually
   * started. If permission is refused, or prepare/start fails, the interview is
   * left in `DRAFT` so the list never claims a recording is in progress.
   */
  async start(interviewId: string): Promise<Interview> {
    const interview = await this.require(interviewId);

    // Throws for anything other than DRAFT, so a finalised recording can never
    // be restarted and appended to.
    const startedLifecycle = startRecording(interview.interviewLifecycle);

    const granted = await this.deps.permission.request();
    if (!granted) {
      throw new MicrophonePermissionDeniedError();
    }

    const filename = generateRecordingFilename(this.deps.idGenerator);

    // Session intent: the interview knows which local file it owns before any
    // audio is captured, so an interrupted session is still discoverable.
    const withIntent: Interview = {
      ...interview,
      metadata: {
        ...interview.metadata,
        recordingFilename: filename,
        recordingDurationMs: null,
        updatedAt: this.deps.clock.now(),
      },
    };
    await this.deps.repository.update(withIntent);

    await this.deps.recorder.prepare(filename);
    await this.deps.recorder.start();

    const recording: Interview = {
      ...withIntent,
      metadata: { ...withIntent.metadata, updatedAt: this.deps.clock.now() },
      interviewLifecycle: startedLifecycle,
    };
    await this.deps.repository.update(recording);

    return recording;
  }

  /**
   * Stops and finalises the active recording.
   *
   * `RECORDED` is persisted only after the recorder reports a finalised file,
   * so a failed stop never advertises a recording that does not exist.
   */
  async stop(interviewId: string): Promise<Interview> {
    const interview = await this.require(interviewId);
    const stoppedLifecycle = stopRecording(interview.interviewLifecycle);

    const completed = await this.deps.recorder.stop();

    const recorded: Interview = {
      ...interview,
      metadata: {
        ...interview.metadata,
        recordingFilename: completed.filename,
        recordingDurationMs: completed.durationMs,
        updatedAt: this.deps.clock.now(),
      },
      interviewLifecycle: stoppedLifecycle,
    };
    await this.deps.repository.update(recorded);

    return recorded;
  }

  private async require(interviewId: string): Promise<Interview> {
    const interview = await this.deps.repository.findById(interviewId);
    if (!interview) {
      throw new InterviewNotFoundError(interviewId);
    }
    return interview;
  }
}
