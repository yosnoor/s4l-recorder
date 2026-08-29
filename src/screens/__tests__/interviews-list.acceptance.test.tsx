import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import InterviewsListScreen from "../../app/index"; // Adjust import as necessary when implementing
import { useRouter } from "expo-router";
import { Interview } from "../../domain/types";

// Mock expo-router
jest.mock("expo-router", () => {
  const React = require("react");
  return {
    useRouter: jest.fn(),
    useFocusEffect: jest.fn((cb) => React.useEffect(cb, [])),
  };
});

// Mock the repository or hook providing the data
const mockInterviews: Interview[] = [];
jest.mock("../../hooks/use-interviews", () => ({
  useInterviews: () => ({
    interviews: mockInterviews,
    isLoading: false,
    refresh: jest.fn(),
  }),
}));

describe("Interviews List Screen Acceptance Tests", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
  });

  describe("Empty state", () => {
    beforeAll(() => {
      mockInterviews.length = 0; // Empty the list
    });

    it("displays empty state text and New interview button", async () => {
      await render(<InterviewsListScreen />);
      
      expect(screen.getByText("No interviews yet")).toBeTruthy();
      expect(screen.getByText("Start a new interview when you are ready to record.")).toBeTruthy();
      
      const newInterviewButton = screen.getByRole("button", { name: /new interview/i });
      expect(newInterviewButton).toBeTruthy();
    });

    it("navigates to New Interview screen when New interview is pressed", async () => {
      await render(<InterviewsListScreen />);
      
      const newInterviewButton = screen.getByRole("button", { name: /new interview/i });
      fireEvent.press(newInterviewButton);
      
      expect(mockPush).toHaveBeenCalledWith("/new-interview");
    });
  });

  describe("Populated state", () => {
    beforeAll(() => {
      mockInterviews.length = 0;
      mockInterviews.push({
        metadata: {
          id: "1",
          intervieweeName: "Jane Doe",
          interviewDate: "2026-08-23",
          interviewer: "John Smith",
          notes: "",
          recordingFilename: null,
          createdAt: "2026-08-23T10:00:00Z",
          updatedAt: "2026-08-23T10:00:00Z",
        },
        interviewLifecycle: "DRAFT",
        recordingPersistence: "LOCAL_ONLY",
        deliveryLifecycle: "NOT_SENT",
      });
    });

    it("displays list of draft rows with correct labels and status", async () => {
      await render(<InterviewsListScreen />);
      
      // Primary label
      expect(screen.getByText("Jane Doe")).toBeTruthy();
      
      // Secondary label (Date & Interviewer)
      expect(screen.getByText("2026-08-23 • John Smith")).toBeTruthy();
      
      // Status text
      expect(screen.getByText("Ready to record")).toBeTruthy();
    });

    it("has accessible labels and roles on list items", async () => {
      await render(<InterviewsListScreen />);
      
      const listItem = screen.getByRole("button", { name: /Jane Doe, 2026-08-23 • John Smith, Ready to record/i });
      expect(listItem).toBeTruthy();
    });
  });
});