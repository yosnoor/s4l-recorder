import {
  InterviewNotFoundError,
  MicrophonePermissionDeniedError,
  RecordingService,
} from "../recording-service";
import { isValidRecordingFilename } from "../../domain/recording-filename";
import type { Interview } from "../../domain/types";
import {
  FakeAudioRecorder,
  FakeClock,
  FakeIdGenerator,
  FakeInterviewRepository,
  FakeMicrophonePermission,
} from "../../ports/fakes";

const draft = (overrides: Partial<Interview> = {}): Interview => ({
  metadata: {
    id: "interview-1",
    intervieweeName: "Jane Doe",
    interviewDate: "2026-08-23",
    interviewer: "John Smith",
    notes: "",
    recordingFilename: null,
    recordingDurationMs: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  interviewLifecycle: "DRAFT",
  recordingPersistence: "LOCAL_ONLY",
  deliveryLifecycle: "NOT_SENT",
  ...overrides,
});

type Harness = {
  service: RecordingService;
  repository: FakeInterviewRepository;
  recorder: FakeAudioRecorder;
  permission: FakeMicrophonePermission;
  clock: FakeClock;
};

const harness = async (seed: Interview = draft()): Promise<Harness> => {
  const repository = new FakeInterviewRepository();
  const recorder = new FakeAudioRecorder();
  const permission = new FakeMicrophonePermission(true);
  const clock = new FakeClock();
  await repository.save(seed);
  repository.writes.length = 0;

  return {
    repository,
    recorder,
    permission,
    clock,
    service: new RecordingService({
      repository,
      recorder,
      permission,
      clock,
      idGenerator: new FakeIdGenerator("rec-"),
    }),
  };
};

describe("RecordingService.start", () => {
  it("transitions DRAFT to RECORDING only after capture has started", async () => {
    const { service, repository, recorder } = await harness();

    const started = await service.start("interview-1");

    expect(started.interviewLifecycle).toBe("RECORDING");
    expect(recorder.calls).toEqual(["prepare:recording-rec1.m4a", "start"]);

    const stored = await repository.findById("interview-1");
    expect(stored?.interviewLifecycle).toBe("RECORDING");
  });

  it("associates a valid non-identifying filename before audio capture begins", async () => {
    const { service, repository, recorder } = await harness();

    await service.start("interview-1");

    const [intentWrite] = repository.writes;
    expect(intentWrite.metadata.recordingFilename).toBe("recording-rec1.m4a");
    expect(
      isValidRecordingFilename(intentWrite.metadata.recordingFilename!),
    ).toBe(true);
    // Intent is persisted while still DRAFT, ahead of prepare and start.
    expect(intentWrite.interviewLifecycle).toBe("DRAFT");
    expect(recorder.calls).toEqual(["prepare:recording-rec1.m4a", "start"]);
    expect(intentWrite.metadata.recordingFilename).not.toContain("Jane");
  });

  it("requests microphone permission exactly once, when starting", async () => {
    const { service, permission } = await harness();

    expect(permission.requestCount).toBe(0);
    await service.start("interview-1");
    expect(permission.requestCount).toBe(1);
  });

  it("leaves the draft untouched when permission is denied", async () => {
    const { service, repository, recorder, permission } = await harness();
    permission.setGranted(false);

    await expect(service.start("interview-1")).rejects.toBeInstanceOf(
      MicrophonePermissionDeniedError,
    );

    const stored = await repository.findById("interview-1");
    expect(stored?.interviewLifecycle).toBe("DRAFT");
    expect(stored?.metadata.recordingFilename).toBeNull();
    expect(recorder.calls).toEqual([]);
    expect(repository.writes).toEqual([]);
  });

  it("does not claim RECORDING when the recorder fails to start", async () => {
    const { service, repository, recorder } = await harness();
    recorder.failNextStart = "microphone unavailable";

    await expect(service.start("interview-1")).rejects.toThrow(
      /microphone unavailable/i,
    );

    const stored = await repository.findById("interview-1");
    expect(stored?.interviewLifecycle).toBe("DRAFT");
    // The intended filename is retained so the session stays discoverable.
    expect(stored?.metadata.recordingFilename).toBe("recording-rec1.m4a");
  });

  it("refuses to record over a finalised recording", async () => {
    const { service, recorder } = await harness(
      draft({
        interviewLifecycle: "RECORDED",
        metadata: {
          ...draft().metadata,
          recordingFilename: "recording-old.m4a",
        },
      }),
    );

    await expect(service.start("interview-1")).rejects.toThrow(
      /cannot start recording from 'RECORDED'/,
    );
    expect(recorder.calls).toEqual([]);
  });

  it("reports a missing interview", async () => {
    const { service } = await harness();

    await expect(service.start("does-not-exist")).rejects.toBeInstanceOf(
      InterviewNotFoundError,
    );
  });
});

describe("RecordingService.stop", () => {
  it("transitions RECORDING to RECORDED and stores the finished recording", async () => {
    const { service, repository, recorder, clock } = await harness();
    await service.start("interview-1");
    recorder.durationMs = 42_000;
    clock.advanceBy(42_000);

    const recorded = await service.stop("interview-1");

    expect(recorded.interviewLifecycle).toBe("RECORDED");
    expect(recorded.metadata.recordingFilename).toBe("recording-rec1.m4a");
    expect(recorded.metadata.recordingDurationMs).toBe(42_000);

    const stored = await repository.findById("interview-1");
    expect(stored?.interviewLifecycle).toBe("RECORDED");
    expect(stored?.metadata.recordingDurationMs).toBe(42_000);
  });

  it("keeps the interview RECORDING when finalising fails", async () => {
    const { service, repository, recorder } = await harness();
    await service.start("interview-1");
    recorder.failNextStop = "could not save file";

    await expect(service.stop("interview-1")).rejects.toThrow(
      /could not save file/i,
    );

    const stored = await repository.findById("interview-1");
    expect(stored?.interviewLifecycle).toBe("RECORDING");
    expect(stored?.metadata.recordingDurationMs).toBeNull();
  });

  it("never appends to an already finalised recording", async () => {
    const { service, recorder } = await harness();
    await service.start("interview-1");
    await service.stop("interview-1");

    // Stopping again has no active session to finalise.
    await expect(service.stop("interview-1")).rejects.toThrow(
      /cannot stop recording from 'RECORDED'/,
    );
    expect(recorder.calls.filter((call) => call === "stop")).toHaveLength(1);
  });
});
