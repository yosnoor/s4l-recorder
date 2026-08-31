import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { useRouter } from "expo-router";
import InterviewsListScreen from "../../app/index";
import NewInterviewScreen from "../../app/new-interview";
import type { Interview } from "../../domain/types";

jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories are hoisted above imports, so require is the only way to reach React here
  const React = require("react") as typeof import("react");
  return {
    useRouter: jest.fn(),
    useFocusEffect: jest.fn((cb: () => void) =>
      // eslint-disable-next-line react-hooks/exhaustive-deps -- the mock deliberately runs the focus callback once on mount
      React.useEffect(cb, []),
    ),
  };
});

// Provide real hook context or just let the screens use real repository?
// The acceptance test usually uses the real repository with AsyncStorage mock.
// We'll mock the hook to use a real repository instance for testing.
jest.mock("../../hooks/use-interviews", () => {
  /* eslint-disable @typescript-eslint/no-require-imports -- jest.mock factories are hoisted above imports, so require is the only way to reach these modules here */
  const React = require("react") as typeof import("react");
  const {
    AsyncStorageInterviewRepository,
  } = require("../../ports/async-storage-interview-repository");
  /* eslint-enable @typescript-eslint/no-require-imports */

  return {
    useInterviews: () => {
      const [interviews, setInterviews] = React.useState<Interview[]>([]);
      const [isLoading, setIsLoading] = React.useState(true);
      const refresh = React.useCallback(async () => {
        const repo = new AsyncStorageInterviewRepository();
        const data = await repo.findAll();
        setInterviews(data);
        setIsLoading(false);
      }, []);

      React.useEffect(() => {
        refresh();
      }, [refresh]);

      return { interviews, isLoading, refresh };
    },
  };
});

// For NewInterviewScreen, we need it to use the real repository too.
jest.mock("../../ports/async-storage-interview-repository", () => {
  const actual = jest.requireActual(
    "../../ports/async-storage-interview-repository",
  );
  return actual;
});

describe("Durable Interview Drafts (Slice 1 End-to-End)", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
    });

    // We need an implementation of AsyncStorage for the in-memory tests to work if we are integrating.
    // The @react-native-async-storage/async-storage/jest/async-storage-mock provides a working memory mock.
  });

  it("creates, saves, and persists a draft across app restarts", async () => {
    // We mock the real repo just to allow saving directly in the test if needed, but we'll use screens.
    // However, since we haven't built the implementation yet, we mock a fake behavior of the real repository for now
    // Wait, the test specifies we should use real repository. So we assume it will be implemented.

    // Step 1: Render New Interview screen and fill form
    const {
      getByPlaceholderText,
      getByRole,
      unmount: unmountNew,
    } = await render(<NewInterviewScreen />);

    await fireEvent.changeText(
      getByPlaceholderText("Interviewee name"),
      "Alice Draft",
    );
    await fireEvent.changeText(getByPlaceholderText("Interviewer"), "Bob Host");

    // Step 2: Save draft
    const submitButton = getByRole("button", { name: /save/i });
    await fireEvent.press(submitButton);

    await waitFor(() => {
      // Assuming it saves successfully and calls replace
      expect(useRouter().replace).toHaveBeenCalled();
    });

    await unmountNew();

    // Step 3: Simulate app restart by re-initializing repository and reloading the list
    // The useInterviews hook mock will fetch from the real AsyncStorage repo
    const { getByText } = await render(<InterviewsListScreen />);

    // Step 4: Verify draft is listed as "Ready to record" with all metadata preserved
    await waitFor(() => {
      expect(getByText("Alice Draft")).toBeTruthy();
      expect(getByText(/Bob Host/)).toBeTruthy();
      expect(getByText("Ready to record")).toBeTruthy();
    });

    // Verify recordingFilename is null by checking the storage directly
    const keys = await AsyncStorage.getAllKeys();
    const storedItem = await AsyncStorage.getItem(keys[0]);
    const parsed = JSON.parse(storedItem!);

    expect(parsed.data.metadata.recordingFilename).toBeNull();
    expect(parsed.data.interviewLifecycle).toBe("DRAFT");
  });
});
