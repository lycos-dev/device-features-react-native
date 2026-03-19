import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ThemedText } from '../../components';
import { useTheme } from '../../context';
import { RootStackNavigationProp } from '../../navigation';
import {
  CameraCancelledError,
  CameraPermissionDeniedError,
  LocationPermissionDeniedError,
  getCurrentAddress,
  openCamera,
  saveEntry,
  sendEntrySavedNotification,
} from '../../services';
import { TravelEntry } from '../../types';
import { validateEntryWithAlert } from '../../utils';

type SaveStatus = 'idle' | 'capturing' | 'locating' | 'saving';

export const AddEntryScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { theme } = useTheme();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);

  const isLoading = status !== 'idle';

  const handleTakePhoto = useCallback(async () => {
    if (isLoading) return;
    try {
      setStatus('capturing');
      setLocationError(null);
      const { uri } = await openCamera();
      setImageUri(uri);
      setStatus('locating');
      const fetched = await getCurrentAddress();
      setAddress(fetched);
    } catch (err) {
      if (err instanceof CameraCancelledError) {
        // silent
      } else if (err instanceof CameraPermissionDeniedError) {
        Alert.alert('Camera Access Required', 'Enable camera access in your device Settings.');
      } else if (err instanceof LocationPermissionDeniedError) {
        setLocationError('Location access denied. Address could not be fetched.');
      } else {
        Alert.alert('Error', err instanceof Error ? err.message : 'Could not open camera.');
      }
    } finally {
      setStatus('idle');
    }
  }, [isLoading]);

  const handleSave = useCallback(async () => {
    if (!validateEntryWithAlert(imageUri, address)) return;
    try {
      setStatus('saving');
      const entry: TravelEntry = {
        id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        imageUri: imageUri!,
        address: address!,
        createdAt: new Date().toISOString(),
      };
      await saveEntry(entry);
      await sendEntrySavedNotification(address!);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Save Failed', err instanceof Error ? err.message : 'Could not save entry.');
    } finally {
      setStatus('idle');
    }
  }, [imageUri, address, navigation]);

  const handleDiscard = useCallback(() => {
    if (!imageUri && !address) { navigation.goBack(); return; }
    Alert.alert('Discard entry?', 'Unsaved changes will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          setImageUri(null);
          setAddress(null);
          setLocationError(null);
          navigation.goBack();
        },
      },
    ]);
  }, [imageUri, address, navigation]);

  // Step indicators
  const steps = [
    { label: 'Photo', done: !!imageUri },
    { label: 'Location', done: !!address },
    { label: 'Save', done: false },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={handleDiscard}
            disabled={isLoading}
            style={[styles.backButton, { backgroundColor: theme.surfaceSecondary }]}
            accessibilityLabel="Go back"
          >
            <Text style={[styles.backSymbol, { color: theme.textPrimary }]}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <ThemedText variant="h3" style={{ color: theme.textPrimary }}>
              New Entry
            </ThemedText>
          </View>

          {/* Save shortcut */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading || !imageUri || !address}
            style={[
              styles.saveChip,
              {
                backgroundColor: imageUri && address ? theme.primary : theme.surfaceSecondary,
                opacity: imageUri && address ? 1 : 0.4,
              },
            ]}
            accessibilityLabel="Save entry"
          >
            {status === 'saving' ? (
              <ActivityIndicator size="small" color={theme.textInverse} />
            ) : (
              <Text style={[styles.saveChipText, { color: imageUri && address ? theme.textInverse : theme.textMuted }]}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Step progress */}
        <View style={[styles.progressBar, { borderBottomColor: theme.border }]}>
          {steps.map((step, i) => (
            <View key={step.label} style={styles.stepItem}>
              <View style={[
                styles.stepDot,
                {
                  backgroundColor: step.done ? theme.primary : theme.surfaceSecondary,
                  borderColor: step.done ? theme.primary : theme.border,
                },
              ]}>
                {step.done && (
                  <Text style={[styles.stepCheck, { color: theme.textInverse }]}>✓</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, { color: step.done ? theme.textPrimary : theme.textMuted }]}>
                {step.label}
              </Text>
              {i < steps.length - 1 && (
                <View style={[
                  styles.stepLine,
                  { backgroundColor: steps[i].done ? theme.primary : theme.border },
                ]} />
              )}
            </View>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo section */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>PHOTO</Text>

            <TouchableOpacity
              style={[
                styles.photoArea,
                {
                  backgroundColor: theme.surfaceSecondary,
                  borderColor: imageUri ? theme.primary : theme.border,
                  borderWidth: imageUri ? 1.5 : StyleSheet.hairlineWidth,
                },
              ]}
              onPress={handleTakePhoto}
              disabled={isLoading}
              activeOpacity={0.75}
              accessibilityLabel={imageUri ? 'Retake photo' : 'Take photo'}
            >
              {status === 'capturing' ? (
                <View style={styles.photoPlaceholder}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={[styles.photoHint, { color: theme.textMuted }]}>
                    Opening camera...
                  </Text>
                </View>
              ) : imageUri ? (
                <>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                  {/* Retake chip */}
                  <View style={styles.retakeChip}>
                    <Text style={styles.retakeChipText}>⟳  Retake</Text>
                  </View>
                </>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <View style={[styles.cameraIconWrap, { borderColor: theme.border }]}>
                    <Text style={[styles.cameraSymbol, { color: theme.textMuted }]}>⊡</Text>
                  </View>
                  <Text style={[styles.photoLabel, { color: theme.textSecondary }]}>
                    Tap to take a photo
                  </Text>
                  <Text style={[styles.photoHint, { color: theme.textMuted }]}>
                    Location tagged automatically
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Location section */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>LOCATION</Text>

            <View
              style={[
                styles.locationBox,
                {
                  backgroundColor: theme.surface,
                  borderColor: address ? theme.primary : theme.border,
                  borderWidth: address ? 1.5 : StyleSheet.hairlineWidth,
                },
              ]}
            >
              {status === 'locating' ? (
                <View style={styles.locationRow}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text style={[styles.locationText, { color: theme.textMuted }]}>
                    Detecting location...
                  </Text>
                </View>
              ) : locationError ? (
                <View style={styles.locationRow}>
                  <View style={[styles.locationDot, { backgroundColor: theme.errorLight }]}>
                    <Text style={[styles.locationDotSymbol, { color: theme.error }]}>⊘</Text>
                  </View>
                  <Text style={[styles.locationText, { color: theme.error, flex: 1 }]}>
                    {locationError}
                  </Text>
                </View>
              ) : address ? (
                <View style={styles.locationRow}>
                  <View style={[styles.locationDot, { backgroundColor: theme.primaryLight }]}>
                    <Text style={[styles.locationDotSymbol, { color: theme.primary }]}>◎</Text>
                  </View>
                  <Text style={[styles.locationText, { color: theme.textPrimary, flex: 1 }]}>
                    {address}
                  </Text>
                </View>
              ) : (
                <View style={styles.locationRow}>
                  <View style={[styles.locationDot, { backgroundColor: theme.surfaceSecondary }]}>
                    <Text style={[styles.locationDotSymbol, { color: theme.textMuted }]}>◎</Text>
                  </View>
                  <Text style={[styles.locationText, { color: theme.textMuted }]}>
                    Waiting for photo...
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              label="Save entry"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleSave}
              loading={status === 'saving'}
              disabled={isLoading || !imageUri || !address}
            />
            <Button
              label="Discard"
              variant="ghost"
              size="lg"
              fullWidth
              onPress={handleDiscard}
              disabled={isLoading}
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backSymbol: { fontSize: 18 },
  headerCenter: { flex: 1, alignItems: 'center' },
  saveChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveChipText: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },

  // Progress steps
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 0,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCheck: { fontSize: 11, fontWeight: '700' },
  stepLabel: { fontSize: 11, fontWeight: '500', letterSpacing: 0.3 },
  stepLine: {
    width: 28,
    height: 1,
    marginHorizontal: 6,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 48,
    gap: 16,
  },

  // Section
  section: { gap: 8 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
  },

  // Photo
  photoArea: {
    width: '100%',
    height: 260,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  cameraIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cameraSymbol: { fontSize: 24 },
  photoLabel: { fontSize: 14, fontWeight: '500' },
  photoHint: { fontSize: 12 },
  previewImage: { width: '100%', height: '100%' },
  retakeChip: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  retakeChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // Location
  locationBox: {
    borderRadius: 12,
    padding: 14,
    minHeight: 54,
    justifyContent: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  locationDotSymbol: { fontSize: 14 },
  locationText: { fontSize: 13, lineHeight: 20 },

  divider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },

  // Actions
  actions: { gap: 10 },
});