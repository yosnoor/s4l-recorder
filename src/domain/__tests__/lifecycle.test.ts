import {
  beginTransfer,
  beginUpload,
  confirmRecovery,
  confirmRemote,
  confirmTransfer,
  discardRecovery,
  failTransfer,
  failUpload,
  markRecordingRecoverable,
  retryTransfer,
  retryUpload,
  startRecording,
  stopRecording,
} from "../lifecycle";

describe("domain lifecycle rules", () => {
  it("keeps interview, recording persistence, and delivery lifecycles independent", () => {
    expect(stopRecording(startRecording("DRAFT"))).toBe("RECORDED");
    expect(confirmRemote(beginUpload("LOCAL_ONLY"))).toBe("REMOTE_CONFIRMED");
    expect(confirmTransfer(beginTransfer("NOT_SENT"))).toBe("TRANSFER_CREATED");
  });

  it("supports the recoverable interview path", () => {
    expect(confirmRecovery(markRecordingRecoverable("RECORDING"))).toBe(
      "RECORDED",
    );
    expect(discardRecovery("RECORDING_RECOVERABLE")).toBe("DRAFT");
  });

  it("supports retrying failed persistence and delivery operations", () => {
    expect(retryUpload(failUpload("UPLOAD_IN_PROGRESS"))).toBe(
      "UPLOAD_IN_PROGRESS",
    );
    expect(retryTransfer(failTransfer("TRANSFER_IN_PROGRESS"))).toBe(
      "TRANSFER_IN_PROGRESS",
    );
  });

  it.each([
    [() => startRecording("RECORDED")],
    [() => stopRecording("DRAFT")],
    [() => markRecordingRecoverable("DRAFT")],
    [() => confirmRecovery("DRAFT")],
    [() => discardRecovery("RECORDED")],
    [() => beginUpload("REMOTE_CONFIRMED")],
    [() => confirmRemote("LOCAL_ONLY")],
    [() => failUpload("LOCAL_ONLY")],
    [() => retryUpload("LOCAL_ONLY")],
    [() => beginTransfer("TRANSFER_CREATED")],
    [() => confirmTransfer("NOT_SENT")],
    [() => failTransfer("NOT_SENT")],
    [() => retryTransfer("NOT_SENT")],
  ])("rejects an invalid transition", (transition) => {
    expect(transition).toThrow("Invalid");
  });
});
