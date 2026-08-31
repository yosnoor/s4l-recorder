/**
 * Production MicrophonePermission adapter.
 *
 * Called only from the start action, never when the recording screen opens.
 */

import {
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";

import type { MicrophonePermission } from "./index";

export const expoMicrophonePermission: MicrophonePermission = {
  async request(): Promise<boolean> {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      return false;
    }

    // Configure the session for capture only once access has been granted.
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    return true;
  },
};
