import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useRecordingSession } from "@/hooks/use-recording-session";

export const READY_SAVE_MESSAGE = "Your recording will be saved on this device";
export const ACTIVE_SAVE_MESSAGE = "Recording is being saved on this device";

export default function RecordingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { interview, state, elapsedLabel, error, start, pause, resume, stop } =
    useRecordingSession(id);

  const isRecording =
    state === "RECORDING" || state === "PAUSED" || state === "SAVING";
  const isPaused = state === "PAUSED";

  const confirmStop = () => {
    Alert.alert(
      "Stop recording?",
      "Stopping finishes this recording. It stays on this device.",
      [
        // Cancelling is a no-op: the recorder keeps running and nothing is written.
        { text: "Keep recording", style: "cancel" },
        {
          text: "Stop and review",
          onPress: async () => {
            const recorded = await stop();
            if (recorded) {
              router.replace({
                pathname: "/review",
                params: { id: recorded.metadata.id },
              });
            }
          },
        },
      ],
    );
  };

  if (state === "LOADING") {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
          <ThemedText type="default">Opening interview…</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <View style={styles.header}>
          <ThemedText type="subtitle">
            {interview?.metadata.intervieweeName ?? "Interview"}
          </ThemedText>
          {interview ? (
            <ThemedText type="default" themeColor="textSecondary">
              {interview.metadata.interviewDate} •{" "}
              {interview.metadata.interviewer}
            </ThemedText>
          ) : null}
        </View>

        <View style={styles.statusBlock}>
          {/* State is carried by text, not colour alone. */}
          <ThemedText
            type="defaultSemiBold"
            accessibilityRole="header"
            accessibilityLiveRegion="polite"
          >
            {isPaused
              ? "Recording paused"
              : isRecording
                ? "Recording"
                : "Ready to record"}
          </ThemedText>

          <ThemedText
            type="title"
            style={styles.timer}
            accessibilityLabel={`Elapsed time ${elapsedLabel}`}
          >
            {elapsedLabel}
          </ThemedText>

          <ThemedText type="default" themeColor="textSecondary">
            {isPaused
              ? "Recording is paused and saved on this device"
              : isRecording
                ? ACTIVE_SAVE_MESSAGE
                : READY_SAVE_MESSAGE}
          </ThemedText>
        </View>

        {error ? (
          <ThemedText style={styles.error} accessibilityLiveRegion="assertive">
            {error}
          </ThemedText>
        ) : null}

        <View style={styles.actions}>
          {isRecording ? (
            <>
              {state === "SAVING" ? null : (
                <Pressable
                  style={({ pressed }) => [
                    styles.primaryButton,
                    pressed && styles.buttonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isPaused ? "Resume recording" : "Pause recording"
                  }
                  onPress={isPaused ? resume : pause}
                >
                  <ThemedText style={styles.primaryLabel}>
                    {isPaused ? "Resume recording" : "Pause recording"}
                  </ThemedText>
                </Pressable>
              )}
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  styles.stopButton,
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Stop recording"
                onPress={confirmStop}
              >
                <ThemedText style={styles.primaryLabel}>
                  Stop recording
                </ThemedText>
              </Pressable>
            </>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Start recording"
              onPress={start}
            >
              <ThemedText style={styles.primaryLabel}>
                Start recording
              </ThemedText>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: Spacing.three, gap: Spacing.four },
  header: { gap: Spacing.one },
  statusBlock: { flex: 1, justifyContent: "center", gap: Spacing.two },
  timer: { fontVariant: ["tabular-nums"] },
  error: { color: "#B3261E" },
  actions: { gap: Spacing.two },
  primaryButton: {
    backgroundColor: "#1A6FD4",
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  stopButton: { backgroundColor: "#B3261E" },
  buttonPressed: { opacity: 0.8 },
  primaryLabel: { color: "#ffffff", fontWeight: "600" },
});
