import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function InterviewsScreen() {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View
          style={styles.emptyState}
          accessible
          accessibilityRole="text"
          accessibilityLabel="No interviews yet. Start a new interview when you are ready to record.">
          <ThemedText type="subtitle" style={styles.emptyHeading}>
            No interviews yet
          </ThemedText>
          <ThemedText themeColor="textSecondary" style={styles.emptyBody}>
            Start a new interview when you are ready to record.
          </ThemedText>
        </View>

        <Pressable
          style={({ pressed }) => [styles.newInterviewButton, pressed && styles.buttonPressed]}
          accessibilityRole="button"
          accessibilityLabel="New interview">
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  emptyHeading: {
    textAlign: 'center',
  },
  emptyBody: {
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  newInterviewButton: {
    backgroundColor: '#1A6FD4',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  newInterviewLabel: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
