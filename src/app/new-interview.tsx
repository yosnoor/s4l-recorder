import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { Interview } from "@/domain/types";
import { AsyncStorageInterviewRepository } from "@/ports/async-storage-interview-repository";

export default function NewInterviewScreen() {
  const router = useRouter();

  const [intervieweeName, setIntervieweeName] = useState("");
  const [interviewDate, setInterviewDate] = useState(
    () => new Date().toISOString().split("T")[0],
  );
  const [interviewer, setInterviewer] = useState("");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const isDirty =
    intervieweeName !== "" ||
    interviewer !== "" ||
    notes !== "" ||
    interviewDate !== new Date().toISOString().split("T")[0];

  const handleBack = () => {
    if (isDirty) {
      Alert.alert(
        "Discard draft?",
        "You have unsaved changes. Are you sure you want to discard this draft?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => router.back(),
          },
        ],
      );
    } else {
      router.back();
    }
  };

  const handleSave = async () => {
    const newErrors: { [key: string]: string } = {};
    if (!intervieweeName.trim())
      newErrors.intervieweeName = "Interviewee name is required";
    if (!interviewer.trim())
      newErrors.interviewer = "Interviewer name is required";
    if (!interviewDate.trim())
      newErrors.interviewDate = "Interview date is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newInterview: Interview = {
      metadata: {
        id: "id-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9),
        intervieweeName,
        interviewDate,
        interviewer,
        notes,
        recordingFilename: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      interviewLifecycle: "DRAFT",
      recordingPersistence: "LOCAL_ONLY",
      deliveryLifecycle: "NOT_SENT",
    };

    try {
      const repository = new AsyncStorageInterviewRepository();
      // The draft is saved before the recording screen can open the microphone.
      await repository.save(newInterview);
      router.replace({
        pathname: "/recording",
        params: { id: newInterview.metadata.id },
      });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not save draft");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["bottom"]}>
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Interviewee name"
            accessibilityLabel="Interviewee name"
            value={intervieweeName}
            onChangeText={setIntervieweeName}
          />
          {errors.intervieweeName && (
            <ThemedText style={styles.error}>
              {errors.intervieweeName}
            </ThemedText>
          )}

          <TextInput
            style={styles.input}
            placeholder="Interview date"
            accessibilityLabel="Interview date"
            value={interviewDate}
            onChangeText={setInterviewDate}
          />
          {errors.interviewDate && (
            <ThemedText style={styles.error}>{errors.interviewDate}</ThemedText>
          )}

          <TextInput
            style={styles.input}
            placeholder="Interviewer"
            accessibilityLabel="Interviewer"
            value={interviewer}
            onChangeText={setInterviewer}
          />
          {errors.interviewer && (
            <ThemedText style={styles.error}>{errors.interviewer}</ThemedText>
          )}

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Notes (optional)"
            accessibilityLabel="Notes"
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.buttonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Save draft"
            onPress={handleSave}
          >
            <ThemedText style={styles.saveLabel}>Save draft</ThemedText>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.saveButton,
              pressed && styles.buttonPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={handleBack}
          >
            <ThemedText style={styles.saveLabel}>Back</ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, padding: Spacing.three },
  form: { flex: 1, gap: Spacing.three },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: Spacing.one,
    padding: Spacing.two,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  error: { color: "red", fontSize: 12 },
  saveButton: {
    backgroundColor: "#1A6FD4",
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    alignItems: "center",
    marginTop: Spacing.three,
  },
  buttonPressed: { opacity: 0.8 },
  saveLabel: { color: "#ffffff", fontWeight: "600" },
  backButton: {
    paddingLeft: Spacing.two,
  },
});
