import { useState, useEffect, useCallback } from 'react';
import { AsyncStorageInterviewRepository } from '../ports/async-storage-interview-repository';
import { Interview } from '../domain/types';

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

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { interviews, isLoading, refresh };
};

export { repository };
