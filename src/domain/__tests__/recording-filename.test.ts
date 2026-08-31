import {
  generateRecordingFilename,
  isValidRecordingFilename,
  RECORDING_FILENAME_PATTERN,
} from "../recording-filename";
import { FakeIdGenerator } from "../../ports/fakes";
import type { IdGenerator } from "../../ports";

describe("recording filename generation", () => {
  it("builds a recording-<id>.m4a name from the id generator", () => {
    const filename = generateRecordingFilename(new FakeIdGenerator("id-"));

    expect(filename).toBe("recording-id1.m4a");
    expect(RECORDING_FILENAME_PATTERN.test(filename)).toBe(true);
  });

  it("produces a distinct name for every session", () => {
    const ids = new FakeIdGenerator();

    const first = generateRecordingFilename(ids);
    const second = generateRecordingFilename(ids);

    expect(first).not.toBe(second);
  });

  it("contains no interview metadata, separators or path traversal", () => {
    const identifying: IdGenerator = {
      generate: () => "../Jane Doe/2026-08-23_Interviewer",
    };

    const filename = generateRecordingFilename(identifying);

    expect(filename).toBe("recording-janedoe20260823interviewer.m4a");
    expect(filename).not.toContain("/");
    expect(filename).not.toContain("..");
    expect(filename).not.toContain(" ");
    expect(isValidRecordingFilename(filename)).toBe(true);
  });

  it("rejects an id that leaves no usable characters", () => {
    const empty: IdGenerator = { generate: () => "///" };

    expect(() => generateRecordingFilename(empty)).toThrow(
      /no usable characters/i,
    );
  });

  it("recognises invalid filenames", () => {
    expect(isValidRecordingFilename("recording-abc123.m4a")).toBe(true);
    expect(isValidRecordingFilename("Jane Doe.m4a")).toBe(false);
    expect(isValidRecordingFilename("recording-abc123.wav")).toBe(false);
    expect(isValidRecordingFilename("recording-.m4a")).toBe(false);
  });
});
