import AsyncStorage from "@react-native-async-storage/async-storage";
import { AsyncStorageInterviewRepository } from "../../ports/async-storage-interview-repository";
import { Interview } from "../types";

describe("AsyncStorageInterviewRepository", () => {
  let repository: AsyncStorageInterviewRepository;

  const mockInterview: Interview = {
    metadata: {
      id: "test-id",
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
    repository = new AsyncStorageInterviewRepository();
  });

  describe("save", () => {
    it("stores interview with schema version 1", async () => {
      await repository.save(mockInterview);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "s4l_interview_test-id",
        expect.stringContaining('"version":1'),
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "s4l_interview_test-id",
        expect.stringContaining('"id":"test-id"'),
      );
    });

    it("throws if ID already exists", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ version: 1, data: mockInterview }),
      );

      await expect(repository.save(mockInterview)).rejects.toThrow();
    });
  });

  describe("findById", () => {
    it("retrieves stored interview", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ version: 1, data: mockInterview }),
      );

      const result = await repository.findById("test-id");
      expect(result).toEqual(mockInterview);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(
        "s4l_interview_test-id",
      );
    });

    it("returns null if not found", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      const result = await repository.findById("non-existent");
      expect(result).toBeNull();
    });
  });

  describe("findAll", () => {
    it("returns all interviews sorted by updatedAt descending", async () => {
      const olderInterview = {
        ...mockInterview,
        metadata: {
          ...mockInterview.metadata,
          id: "old",
          updatedAt: "2026-08-22T10:00:00Z",
        },
      };
      const newerInterview = {
        ...mockInterview,
        metadata: {
          ...mockInterview.metadata,
          id: "new",
          updatedAt: "2026-08-23T10:00:00Z",
        },
      };

      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
        "s4l_interview_old",
        "s4l_interview_new",
        "other_key",
      ]);

      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue([
        [
          "s4l_interview_old",
          JSON.stringify({ version: 1, data: olderInterview }),
        ],
        [
          "s4l_interview_new",
          JSON.stringify({ version: 1, data: newerInterview }),
        ],
      ]);

      const results = await repository.findAll();
      expect(results).toHaveLength(2);
      expect(results[0].metadata.id).toBe("new");
      expect(results[1].metadata.id).toBe("old");
    });
  });

  describe("update", () => {
    it("updates existing interview", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ version: 1, data: mockInterview }),
      );

      const updated = {
        ...mockInterview,
        metadata: {
          ...mockInterview.metadata,
          intervieweeName: "Updated Name",
        },
      };

      await repository.update(updated);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "s4l_interview_test-id",
        expect.stringContaining("Updated Name"),
      );
    });

    it("throws if ID not found", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      await expect(repository.update(mockInterview)).rejects.toThrow();
    });
  });

  describe("delete", () => {
    it("removes interview by ID", async () => {
      await repository.delete("test-id");
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        "s4l_interview_test-id",
      );
    });
  });

  describe("Versioning and migration support", () => {
    it("can read/migrate schema version 1", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
        JSON.stringify({ version: 1, data: mockInterview }),
      );

      const result = await repository.findById("test-id");
      expect(result).toEqual(mockInterview);
    });
  });

  describe("Corrupt/empty data handling", () => {
    it("handles corrupt JSON gracefully by skipping or returning null", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue("invalid-json");

      const result = await repository.findById("test-id");
      expect(result).toBeNull();
    });

    it("findAll skips corrupt items", async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
        "s4l_interview_bad",
        "s4l_interview_good",
      ]);
      (AsyncStorage.multiGet as jest.Mock).mockResolvedValue([
        ["s4l_interview_bad", "invalid json {"],
        [
          "s4l_interview_good",
          JSON.stringify({ version: 1, data: mockInterview }),
        ],
      ]);

      const results = await repository.findAll();
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(mockInterview);
    });
  });
});
