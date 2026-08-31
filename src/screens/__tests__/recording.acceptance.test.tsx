import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { Alert } from "react-native";

import RecordingScreen from "../../app/recording";
import type { Interview } from "../../domain/types";
import { AsyncStorageInterviewRepository } from "../../ports/async-storage-interview-repository";
import { FakeAudioRecorder, FakeMicrophonePermission } from "../../ports/fakes";

const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({ id: "interview-1" }),
}));

// The native recorder and permission prompt are the only mocked boundaries; the
// real service, repository and AsyncStorage are exercised end to end.
const mockRecorder = new FakeAudioRecorder();
const mockPermission = new FakeMicrophonePermission(true);

jest.mock("../../ports/expo-audio-recorder", () => ({
  useExpoAudioRecorder: () => mockRecorder,
}));

jest.mock("../../ports/expo-microphone-permission", () => ({
  expoMicrophonePermission: {
    request: () => mockPermission.request(),
  },
}));

const draft: Interview = {
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
};

const stored = () =>
  new AsyncStorageInterviewRepository().findById("interview-1");

/** Presses the named button in the most recent Alert. */
const pressAlertButton = async (label: string) => {
  const spy = Alert.alert as jest.Mock;
  const buttons = spy.mock.calls[spy.mock.calls.length - 1][2];
  const button = buttons.find(
    (candidate: { text: string }) => candidate.text === label,
  );
  await button?.onPress?.();
};

describe("Recording screen acceptance", () => {
  let view: Awaited<ReturnType<typeof render>> | null = null;

  const renderReady = async () => {
    view = await render(<RecordingScreen />);
    await waitFor(() =>
      expect(screen.getByText("Ready to record")).toBeTruthy(),
    );
  };

  const startRecording = async () => {
    await fireEvent.press(
      screen.getByRole("button", { name: "Start recording" }),
    );
    await waitFor(() => expect(screen.getByText("Recording")).toBeTruthy());
  };

  beforeEach(async () => {
    mockReplace.mockClear();
    mockPush.mockClear();
    jest.spyOn(Alert, "alert").mockImplementation(() => {});

    await AsyncStorage.clear();
    await new AsyncStorageInterviewRepository().save(draft);

    mockRecorder.clearCalls();
    mockRecorder.durationMs = 5_000;
    mockRecorder.failNextStart = null;
    mockRecorder.failNextStop = null;
    mockPermission.requestCount = 0;
    mockPermission.setGranted(true);
  });

  afterEach(() => {
    // Unmount so an active recording timer cannot outlive its test.
    view?.unmount();
    view = null;
    jest.restoreAllMocks();
  });

  it("shows the ready state with metadata, zeroed timer and local-save message", async () => {
    await renderReady();

    expect(screen.getByText("Jane Doe")).toBeTruthy();
    expect(screen.getByText("2026-08-23 • John Smith")).toBeTruthy();
    expect(screen.getByText("00:00:00")).toBeTruthy();
    expect(
      screen.getByText("Your recording will be saved on this device"),
    ).toBeTruthy();
    // Opening the screen must never prompt for the microphone.
    expect(mockPermission.requestCount).toBe(0);
  });

  it("requests microphone access only when Start recording is pressed", async () => {
    await renderReady();
    expect(mockPermission.requestCount).toBe(0);

    await startRecording();

    expect(mockPermission.requestCount).toBe(1);
    expect(mockRecorder.calls).toHaveLength(2);
    expect(mockRecorder.calls[0]).toMatch(/^prepare:recording-[a-z0-9]+\.m4a$/);
    expect(mockRecorder.calls[1]).toBe("start");
  });

  it("associates a generated recording file with the interview before capture", async () => {
    await renderReady();
    await startRecording();

    const preparedFilename = mockRecorder.calls[0].replace("prepare:", "");
    const after = await stored();

    expect(after?.metadata.recordingFilename).toBe(preparedFilename);
    expect(after?.metadata.recordingFilename).toMatch(
      /^recording-[a-z0-9]+\.m4a$/,
    );
    expect(after?.interviewLifecycle).toBe("RECORDING");
  });

  it("shows the active state and its local-save message while recording", async () => {
    await renderReady();
    await startRecording();

    expect(
      screen.getByText("Recording is being saved on this device"),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Stop recording" })).toBeTruthy();
  });

  it("keeps recording and writes nothing when stop is cancelled", async () => {
    await renderReady();
    await startRecording();

    await fireEvent.press(
      screen.getByRole("button", { name: "Stop recording" }),
    );
    await pressAlertButton("Keep recording");

    expect(mockRecorder.calls).not.toContain("stop");
    expect(screen.getByText("Recording")).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();

    const after = await stored();
    expect(after?.interviewLifecycle).toBe("RECORDING");
    expect(after?.metadata.recordingDurationMs).toBeNull();
  });

  it("finalises the recording and opens review when stop is confirmed", async () => {
    await renderReady();
    await startRecording();

    await fireEvent.press(
      screen.getByRole("button", { name: "Stop recording" }),
    );
    await pressAlertButton("Stop and review");

    expect(mockRecorder.calls).toContain("stop");
    await waitFor(() =>
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: "/review",
        params: { id: "interview-1" },
      }),
    );

    const after = await stored();
    expect(after?.interviewLifecycle).toBe("RECORDED");
    expect(after?.metadata.recordingFilename).toMatch(
      /^recording-[a-z0-9]+\.m4a$/,
    );
    expect(after?.metadata.recordingDurationMs).toBe(5_000);
  });

  it("explains a denied microphone and leaves the draft unchanged", async () => {
    mockPermission.setGranted(false);
    await renderReady();

    await fireEvent.press(
      screen.getByRole("button", { name: "Start recording" }),
    );

    await waitFor(() =>
      expect(screen.getByText(/microphone access is needed/i)).toBeTruthy(),
    );
    expect(screen.getByText("Ready to record")).toBeTruthy();

    const after = await stored();
    expect(after?.interviewLifecycle).toBe("DRAFT");
    expect(after?.metadata.recordingFilename).toBeNull();
  });
});
