import { Pressable, StyleSheet, View, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback } from "react";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useInterviews } from "@/hooks/use-interviews";

const getStatusText = (status: string) => {
  switch (status) {
    case "DRAFT": return "Ready to record";
    case "RECORDING": return "Recording in progress";
    case "RECORDED": return "Recording ready on this device";
    case "RECORDING_RECOVERABLE": return "Recording needs attention";
    default: return "";
  }
};

export default function InterviewsScreen() {
  const router = useRouter();
  const { interviews, refresh } = useInterviews();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleNewInterview = () => {
    router.push("/new-interview");
  };

  const renderItem = ({ item }: { item: any }) => {
    const statusText = getStatusText(item.interviewLifecycle);
    return (
      <Pressable
        style={styles.interviewItem}
        accessibilityRole="button"
        accessibilityLabel={`${item.metadata.intervieweeName}, ${item.metadata.interviewDate} • ${item.metadata.interviewer}, ${statusText}`}
      >
        <ThemedText type="defaultSemiBold">{item.metadata.intervieweeName}</ThemedText>
        <ThemedText type="default" themeColor="textSecondary">
          {item.metadata.interviewDate} • {item.metadata.interviewer}
        </ThemedText>
        <ThemedText type="default" themeColor="textSecondary">
          {statusText}
        </ThemedText>
      </Pressable>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        {interviews.length === 0 ? (
          <View style={styles.emptyState}>
            <ThemedText type="subtitle" style={styles.emptyHeading}>
              No interviews yet
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.emptyBody}>
              Start a new interview when you are ready to record.
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={interviews}
            keyExtractor={item => item.metadata.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
          />
        )}

        <Pressable
          style={({ pressed }) => [
            styles.newInterviewButton,
            pressed && styles.buttonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="New interview"
          onPress={handleNewInterview}
        >
          <ThemedText type="default" style={styles.newInterviewLabel}>
            New interview
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  emptyHeading: {
    textAlign: "center",
  },
  emptyBody: {
    textAlign: "center",
    fontSize: 16,
    lineHeight: 24,
  },
  newInterviewButton: {
    backgroundColor: "#1A6FD4",
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: "center",
    minHeight: 52,
    justifyContent: "center",
    marginTop: Spacing.three,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  newInterviewLabel: {
    color: "#ffffff",
    fontWeight: "600",
  },
  listContainer: {
    flexGrow: 1,
    paddingVertical: Spacing.three,
  },
  interviewItem: {
    padding: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
});
