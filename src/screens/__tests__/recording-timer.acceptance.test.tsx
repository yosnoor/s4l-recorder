import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";

import RecordingScreen from "../../app/recording";
import type { Interview } from "../../domain/types";
import { AsyncStorageInterviewRepository } from "../../ports/async-storage-interview-repository";
import { FakeAudioRecorder, FakeMicrophonePermission } from "../../ports/fakes";

/**
 * Elapsed-time display is isolated here because it observes real wall-clock
 * progress: the screen must keep showing a live timer while recording.
 */

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({ id: "interview-1" }),
}));

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

describe("Recording screen elapsed timer", () => {
  let view: Awaited<ReturnType<typeof render>> | null = null;

  beforeEach(async () => {
    await AsyncStorage.clear();
    await new AsyncStorageInterviewRepository().save(draft);
    mockRecorder.clearCalls();
    mockPermission.requestCount = 0;
    mockPermission.setGranted(true);
  });

  afterEach(() => {
    view?.unmount();
    view = null;
  });

  it("keeps the active state and a live elapsed time on screen while recording", async () => {
    view = await render(<RecordingScreen />);
    await waitFor(() =>
      expect(screen.getByText("Ready to record")).toBeTruthy(),
    );
    expect(screen.getByText("00:00:00")).toBeTruthy();

    await fireEvent.press(
      screen.getByRole("button", { name: "Start recording" }),
    );
    await waitFor(() => expect(screen.getByText("Recording")).toBeTruthy());

    // The timer repaints on its own interval, without further interaction.
    await waitFor(() => expect(screen.getByText("00:00:01")).toBeTruthy(), {
      timeout: 4_000,
    });

    // The active state remains visible alongside the advancing time.
    expect(screen.getByText("Recording")).toBeTruthy();
    expect(
      screen.getByText("Recording is being saved on this device"),
    ).toBeTruthy();
  });
});
