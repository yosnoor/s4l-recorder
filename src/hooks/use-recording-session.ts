/**
 * Screen-facing state for a single recording session.
 *
 * Composes the production ports with `RecordingService` and adds the elapsed
 * timer the recording screen displays. All lifecycle and persistence decisions
 * stay in the service; this hook only reflects them.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  MicrophonePermissionDeniedError,
  RecordingService,
} from "@/application/recording-service";
import type { Interview } from "@/domain/types";
import { AsyncStorageInterviewRepository } from "@/ports/async-storage-interview-repository";
import { useExpoAudioRecorder } from "@/ports/expo-audio-recorder";
import { expoMicrophonePermission } from "@/ports/expo-microphone-permission";
import { cryptoIdGenerator, systemClock } from "@/ports/system";

export type RecordingScreenState = "LOADING" | "READY" | "RECORDING" | "SAVING";

const TIMER_INTERVAL_MS = 250;

/** Formats elapsed milliseconds as HH:MM:SS. */
export function formatElapsed(totalMs: number): string {
  const totalSeconds = Math.max(0, Math.floor(totalMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

export function useRecordingSession(interviewId: string | undefined) {
  const recorder = useExpoAudioRecorder();
  const repository = useMemo(() => new AsyncStorageInterviewRepository(), []);

  const service = useMemo(
    () =>
      new RecordingService({
        repository,
        recorder,
        permission: expoMicrophonePermission,
        clock: systemClock,
        idGenerator: cryptoIdGenerator,
      }),
    [recorder, repository],
  );

  const [interview, setInterview] = useState<Interview | null>(null);
  // Without an id there is nothing to load, so the screen starts ready.
  const [state, setState] = useState<RecordingScreenState>(
    interviewId ? "LOADING" : "READY",
  );
  const [elapsedMs, setElapsedMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const startedAtMs = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!interviewId) {
      return;
    }

    repository
      .findById(interviewId)
      .then((found) => {
        if (cancelled) return;
        setInterview(found);
        setState(
          found?.interviewLifecycle === "RECORDING" ? "RECORDING" : "READY",
        );
      })
      .catch(() => {
        if (cancelled) return;
        setError("This interview could not be opened.");
        setState("READY");
      });

    return () => {
      cancelled = true;
    };
  }, [interviewId, repository]);

  // Advance the visible timer only while audio is actually being captured.
  useEffect(() => {
    if (state !== "RECORDING") return;

    if (startedAtMs.current === null) {
      startedAtMs.current = Date.now();
    }

    const tick = () => {
      if (startedAtMs.current !== null) {
        setElapsedMs(Date.now() - startedAtMs.current);
      }
    };

    tick();
    const interval = setInterval(tick, TIMER_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [state]);

  const start = useCallback(async () => {
    if (!interviewId) return;
    setError(null);

    try {
      const started = await service.start(interviewId);
      setInterview(started);
      startedAtMs.current = Date.now();
      setElapsedMs(0);
      setState("RECORDING");
    } catch (cause) {
      setState("READY");
      setError(
        cause instanceof MicrophonePermissionDeniedError
          ? cause.message
          : "Recording could not be started. Nothing has been saved.",
      );
    }
  }, [interviewId, service]);

  const stop = useCallback(async (): Promise<Interview | null> => {
    if (!interviewId) return null;
    setError(null);
    setState("SAVING");

    try {
      const recorded = await service.stop(interviewId);
      setInterview(recorded);
      startedAtMs.current = null;
      setState("READY");
      return recorded;
    } catch {
      setState("RECORDING");
      setError("The recording could not be saved. It is still in progress.");
      return null;
    }
  }, [interviewId, service]);

  return {
    interview,
    state,
    elapsedMs,
    elapsedLabel: formatElapsed(elapsedMs),
    error,
    start,
    stop,
  };
}
