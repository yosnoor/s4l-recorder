import { useCallback, useState } from "react";
import { Interview } from "../domain/types";
import { AsyncStorageInterviewRepository } from "../ports/async-storage-interview-repository";

const repository = new AsyncStorageInterviewRepository();

export const useInterviews = () => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await repository.findAll();
      setInterviews(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Screens refresh on focus, which also covers the initial mount.
  return { interviews, isLoading, refresh };
};

export { repository };
