import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";
import NewInterviewScreen from "../../app/new-interview"; // Adjust import later
import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { AsyncStorageInterviewRepository } from "../../ports/async-storage-interview-repository";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

jest.mock("../../ports/async-storage-interview-repository");

describe("New Interview Form Screen Acceptance Tests", () => {
  const mockBack = jest.fn();
  const mockReplace = jest.fn();
  const mockSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ back: mockBack, replace: mockReplace });
    jest.spyOn(Alert, "alert");
    (AsyncStorageInterviewRepository.prototype.save as jest.Mock) = mockSave;
  });

  it("renders form fields and defaults interview date to current date", async () => {
    const { getByPlaceholderText, getByDisplayValue } = await render(<NewInterviewScreen />);
    
    expect(getByPlaceholderText("Interviewee name")).toBeTruthy();
    expect(getByPlaceholderText("Interviewer")).toBeTruthy();
    expect(getByPlaceholderText("Notes (optional)")).toBeTruthy();
    
    const dateInput = getByDisplayValue(new Date().toISOString().split("T")[0]);
    expect(dateInput).toBeTruthy();
  });

  it("shows inline error messages when submitting empty required fields", async () => {
    const { getByPlaceholderText, getByRole, getByText } = await render(<NewInterviewScreen />);
    
    // Clear date since it defaults to today
    const dateInput = getByPlaceholderText("Interview date");
    await fireEvent.changeText(dateInput, "");
    
    const submitButton = getByRole("button", { name: /save/i });
    await fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(getByText("Interviewee name is required")).toBeTruthy();
      expect(getByText("Interviewer name is required")).toBeTruthy();
      expect(getByText("Interview date is required")).toBeTruthy();
    });
    
    expect(mockSave).not.toHaveBeenCalled();
  });

  it("saves draft to repository with correct lifecycle states on valid submission", async () => {
    const { getByPlaceholderText, getByRole } = await render(<NewInterviewScreen />);
    
    await fireEvent.changeText(getByPlaceholderText("Interviewee name"), "Jane Doe");
    await fireEvent.changeText(getByPlaceholderText("Interviewer"), "John Smith");
    await fireEvent.changeText(getByPlaceholderText("Notes (optional)"), "Some notes");
    
    const submitButton = getByRole("button", { name: /save/i });
    await fireEvent.press(submitButton);
    
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledTimes(1);
    });
    
    const savedData = mockSave.mock.calls[0][0];
    expect(savedData).toMatchObject({
      metadata: expect.objectContaining({
        intervieweeName: "Jane Doe",
        interviewer: "John Smith",
        notes: "Some notes",
        recordingFilename: null,
      }),
      interviewLifecycle: "DRAFT",
      recordingPersistence: "LOCAL_ONLY",
      deliveryLifecycle: "NOT_SENT",
    });
    
    expect(mockReplace).toHaveBeenCalled();
  });

  describe("Dirty state / back navigation", () => {
    it("shows discard confirmation when dirty and keeps data if cancelled", async () => {
      const { getByPlaceholderText, getByRole, getByDisplayValue } = await render(<NewInterviewScreen />);
      
      await fireEvent.changeText(getByPlaceholderText("Interviewee name"), "Jane");
      
      // Simulate back press
      const backButton = getByRole("button", { name: /back/i });
      await fireEvent.press(backButton);
      
      expect(Alert.alert).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({ text: "Cancel", style: "cancel" }),
          expect.objectContaining({ text: "Discard", style: "destructive" }),
        ])
      );
      
      const cancelAction = (Alert.alert as jest.Mock).mock.calls[0][2].find(
        (action: any) => action.text === "Cancel"
      );
      if (cancelAction?.onPress) {
        cancelAction.onPress();
      }
      
      expect(mockBack).not.toHaveBeenCalled();
      expect(getByDisplayValue("Jane")).toBeTruthy();
    });

    it("discards data and navigates back if discard is confirmed", async () => {
      const { getByPlaceholderText, getByRole } = await render(<NewInterviewScreen />);
      
      await fireEvent.changeText(getByPlaceholderText("Interviewee name"), "Jane");
      
      const backButton = getByRole("button", { name: /back/i });
      await fireEvent.press(backButton);
      
      const discardAction = (Alert.alert as jest.Mock).mock.calls[0][2].find(
        (action: any) => action.text === "Discard"
      );
      discardAction.onPress();
      
      expect(mockBack).toHaveBeenCalledTimes(1);
    });
  });
});