/**
 * Production AudioRecorder adapter built on expo-audio and expo-file-system.
 *
 * expo-audio chooses its own temporary filename, so our non-identifying name is
 * applied by moving the finished file into `<document>/recordings/`. That move is
 * the moment a recording becomes durable and final. See ADR 0001.
 */

import {
  AudioQuality,
  IOSOutputFormat,
  useAudioRecorder,
  type RecordingOptions,
} from "expo-audio";
import { Directory, File, Paths } from "expo-file-system";
import { useMemo, useRef } from "react";

import type {
  AudioRecorder,
  CompletedRecording,
  RecorderEvent,
  RecorderEventHandler,
  RecorderStatus,
} from "./index";

/** Directory, relative to the app document directory, holding finished audio. */
export const RECORDINGS_DIRECTORY_NAME = "recordings";

/**
 * Speech-oriented capture profile: AAC in an .m4a container, mono, 64 kbps.
 * Roughly half the size of the stereo high-quality preset with no loss of
 * intelligibility for a single spoken interview.
 */
export const SPEECH_RECORDING_PROFILE: RecordingOptions = {
  extension: ".m4a",
  sampleRate: 44100,
  numberOfChannels: 1,
  bitRate: 64000,
  // Keep finished audio out of the cache directory, which the OS may clear.
  directory: "document",
  android: {
    outputFormat: "mpeg4",
    audioEncoder: "aac",
    audioSource: "voice_recognition",
  },
  ios: {
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.MEDIUM,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: "audio/webm",
    bitsPerSecond: 64000,
  },
};

/** Returns the durable directory for finished recordings, creating it if needed. */
export function recordingsDirectory(): Directory {
  const directory = new Directory(Paths.document, RECORDINGS_DIRECTORY_NAME);
  if (!directory.exists) {
    directory.create({ intermediates: true, idempotent: true });
  }
  return directory;
}

/** Resolves the durable location of a stored recording filename. */
export function recordingFileFor(filename: string): File {
  return new File(recordingsDirectory(), filename);
}

/**
 * Wraps the expo-audio recorder in our AudioRecorder port.
 *
 * Exposed as a hook so the native recorder is released with the screen that
 * owns it, rather than leaking for the lifetime of the app.
 */
export function useExpoAudioRecorder(): AudioRecorder {
  const recorder = useAudioRecorder(SPEECH_RECORDING_PROFILE);
  const targetFilename = useRef<string | null>(null);
  const status = useRef<RecorderStatus>("IDLE");
  const handlers = useRef<RecorderEventHandler[]>([]);

  return useMemo<AudioRecorder>(() => {
    const emit = (event: RecorderEvent) => {
      for (const handler of handlers.current) {
        handler(event);
      }
    };

    const fail = (message: string): Error => {
      status.current = "ERROR";
      emit({ type: "ERROR", message });
      return new Error(message);
    };

    return {
      get status() {
        return status.current;
      },

      async prepare(filename: string) {
        // Refuse to reuse a name that already holds finalised audio, so a new
        // session can never overwrite or extend an earlier recording.
        if (recordingFileFor(filename).exists) {
          throw fail(`A recording named '${filename}' already exists.`);
        }
        targetFilename.current = filename;
        status.current = "PREPARING";
        await recorder.prepareToRecordAsync(SPEECH_RECORDING_PROFILE);
      },

      async start() {
        const filename = targetFilename.current;
        if (!filename) {
          throw fail("Recording was started before it was prepared.");
        }
        recorder.record();
        status.current = "RECORDING";
        emit({ type: "STARTED", filename });
      },

      async pause() {
        recorder.pause();
        status.current = "PAUSED";
        emit({ type: "PAUSED" });
      },

      async resume() {
        recorder.record();
        status.current = "RECORDING";
        emit({ type: "RESUMED" });
      },

      async stop(): Promise<CompletedRecording> {
        const filename = targetFilename.current;
        if (!filename) {
          throw fail("Recording was stopped without an active session.");
        }

        const durationMs = Math.max(
          0,
          Math.round((recorder.currentTime ?? 0) * 1000),
        );
        await recorder.stop();

        const capturedUri = recorder.uri;
        if (!capturedUri) {
          throw fail("The recorder finished without producing an audio file.");
        }

        const captured = new File(capturedUri);
        const destination = recordingFileFor(filename);
        if (destination.exists) {
          throw fail(`A recording named '${filename}' already exists.`);
        }

        await captured.move(destination);

        if (!destination.exists || destination.size <= 0) {
          throw fail("The recording could not be saved to this device.");
        }

        // The session is finished: another recording needs a fresh prepare().
        targetFilename.current = null;
        status.current = "STOPPED";

        const completed: CompletedRecording = {
          filename,
          uri: destination.uri,
          durationMs,
        };
        emit({ type: "STOPPED", ...completed });
        return completed;
      },

      onEvent(handler: RecorderEventHandler) {
        handlers.current.push(handler);
      },
    };
  }, [recorder]);
}
