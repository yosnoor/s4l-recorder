import AsyncStorage from "@react-native-async-storage/async-storage";
import { InterviewRepository } from "./index";
import { Interview } from "../domain/types";

const PREFIX = "s4l_interview_";

export class AsyncStorageInterviewRepository implements InterviewRepository {
  async save(interview: Interview): Promise<void> {
    const key = PREFIX + interview.metadata.id;
    const existing = await AsyncStorage.getItem(key);
    if (existing) {
      throw new Error(
        `Interview with id ${interview.metadata.id} already exists`,
      );
    }
    const payload = JSON.stringify({ version: 1, data: interview });
    await AsyncStorage.setItem(key, payload);
  }

  async update(interview: Interview): Promise<void> {
    const key = PREFIX + interview.metadata.id;
    const existing = await AsyncStorage.getItem(key);
    if (!existing) {
      throw new Error(`Interview with id ${interview.metadata.id} not found`);
    }
    const payload = JSON.stringify({ version: 1, data: interview });
    await AsyncStorage.setItem(key, payload);
  }

  async findById(id: string): Promise<Interview | null> {
    const key = PREFIX + id;
    try {
      const item = await AsyncStorage.getItem(key);
      if (!item) return null;
      const parsed = JSON.parse(item);
      return parsed.data;
    } catch (e) {
      return null;
    }
  }

  async findAll(): Promise<Interview[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const keys = allKeys.filter((k) => k.startsWith(PREFIX));
      if (keys.length === 0) return [];

      const items = await AsyncStorage.multiGet(keys);
      const interviews: Interview[] = [];

      for (const [key, value] of items) {
        if (value) {
          try {
            const parsed = JSON.parse(value);
            if (parsed && parsed.data) {
              interviews.push(parsed.data);
            }
          } catch (e) {
            // skip corrupt
          }
        }
      }

      interviews.sort(
        (a, b) =>
          new Date(b.metadata.updatedAt).getTime() -
          new Date(a.metadata.updatedAt).getTime(),
      );

      return interviews;
    } catch (e) {
      return [];
    }
  }

  async delete(id: string): Promise<void> {
    await AsyncStorage.removeItem(PREFIX + id);
  }
}
