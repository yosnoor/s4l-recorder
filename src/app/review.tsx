import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import type { Interview } from "@/domain/types";
import { formatElapsed } from "@/hooks/use-recording-session";
import { AsyncStorageInterviewRepository } from "@/ports/async-storage-interview-repository";

export const LOCAL_ONLY_MESSAGE = "Saved on this device only";

/**
 * Simple recording-ready review state. Playback arrives in Slice 3, so this
 * screen only confirms what is durably stored.
 */
export default function ReviewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [interview, setInterview] = useState<Interview | null>(null);
  // Without an id there is nothing to fetch, so rendering is already settled.
  const [loaded, setLoaded] = useState(!id);

  useEffect(() => {
    let cancelled = false;
    if (!id) {
      return;
    }

    new AsyncStorageInterviewRepository()
      .findById(id)
      .then((found) => {
        if (cancelled) return;
        setInterview(found);
        setLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const hasRecording =
    interview?.interviewLifecycle === "RECORDED" &&
    Boolean(interview?.metadata.recordingFilename);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <View style={styles.body}>
          {!loaded ? (
            <ThemedText type="default">Opening recording…</ThemedText>
          ) : hasRecording ? (
            <>
              <ThemedText type="subtitle" accessibilityRole="header">
                Recording ready
              </ThemedText>
              {/* Only shown once a finalised recording is durably stored. */}
              <ThemedText type="default" themeColor="textSecondary">
                {LOCAL_ONLY_MESSAGE}
              </ThemedText>
              <ThemedText type="defaultSemiBold">
                {interview?.metadata.intervieweeName}
              </ThemedText>
              <ThemedText type="default" themeColor="textSecondary">
                {interview?.metadata.interviewDate} •{" "}
                {interview?.metadata.interviewer}
              </ThemedText>
              <ThemedText
                type="default"
                themeColor="textSecondary"
                accessibilityLabel={`Recording length ${formatElapsed(
                  interview?.metadata.recordingDurationMs ?? 0,
                )}`}
              >
                Length{" "}
                {formatElapsed(interview?.metadata.recordingDurationMs ?? 0)}
              </ThemedText>
            </>
          ) : (
            <>
              <ThemedText type="subtitle" accessibilityRole="header">
                No recording yet
              </ThemedText>
              <ThemedText type="default" themeColor="textSecondary">
                This interview does not have a finished recording on this
                device.
              </ThemedText>
            </>
          )}
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Back to interviews"
          onPress={() => router.replace("/")}
        >
          <ThemedText style={styles.buttonLabel}>Back to interviews</ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: Spacing.three },
  body: { flex: 1, justifyContent: "center", gap: Spacing.two },
  button: {
    backgroundColor: "#1A6FD4",
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  buttonPressed: { opacity: 0.8 },
  buttonLabel: { color: "#ffffff", fontWeight: "600" },
});
