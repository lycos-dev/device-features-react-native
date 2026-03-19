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
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <Text style={[styles.backSymbol, { color: theme.textPrimary }]}>←</Text>
          </TouchableOpacity>

          <ThemedText variant="h3" style={{ color: theme.textPrimary }}>
            New Entry
          </ThemedText>

          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* Photo area */}
          <TouchableOpacity
            style={[
              styles.photoArea,
              {
                backgroundColor: theme.surfaceSecondary,
                borderColor: imageUri ? 'transparent' : theme.border,
              },
            ]}
            onPress={handleTakePhoto}
            disabled={isLoading}
            activeOpacity={0.75}
            accessibilityLabel={imageUri ? 'Retake photo' : 'Take photo'}
          >
            {status === 'capturing' ? (
              <View style={styles.photoPlaceholder}>
                <ActivityIndicator size="small" color={theme.textMuted} />
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
                <View style={styles.retakeBar}>
                  <Text style={styles.retakeText}>⟳  Tap to retake</Text>
                </View>
              </>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={[styles.cameraSymbol, { color: theme.textMuted }]}>⊡</Text>
                <Text style={[styles.photoLabel, { color: theme.textSecondary }]}>
                  Take a photo
                </Text>
                <Text style={[styles.photoHint, { color: theme.textMuted }]}>
                  Location is fetched automatically
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Location row */}
          <View style={[styles.locationBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {status === 'locating' ? (
              <View style={styles.locationRow}>
                <ActivityIndicator size="small" color={theme.textMuted} />
                <Text style={[styles.locationText, { color: theme.textMuted }]}>
                  Detecting location...
                </Text>
              </View>
            ) : locationError ? (
              <View style={styles.locationRow}>
                <Text style={[styles.locationSymbol, { color: theme.error }]}>⊘</Text>
                <Text style={[styles.locationText, { color: theme.error, flex: 1 }]}>
                  {locationError}
                </Text>
              </View>
            ) : address ? (
              <View style={styles.locationRow}>
                <Text style={[styles.locationSymbol, { color: theme.textMuted }]}>◎</Text>
                <Text style={[styles.locationText, { color: theme.textPrimary, flex: 1 }]}>
                  {address}
                </Text>
              </View>
            ) : (
              <View style={styles.locationRow}>
                <Text style={[styles.locationSymbol, { color: theme.textMuted }]}>◎</Text>
                <Text style={[styles.locationText, { color: theme.textMuted }]}>
                  Address will appear here
                </Text>
              </View>
            )}
          </View>

          {/* Saving status */}
          {status === 'saving' && (
            <View style={styles.savingRow}>
              <ActivityIndicator size="small" color={theme.textMuted} />
              <Text style={[styles.savingText, { color: theme.textMuted }]}>Saving...</Text>
            </View>
          )}

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

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 36,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backSymbol: {
    fontSize: 20,
  },
  headerSpacer: { width: 36 },

  scrollContent: {
    padding: 20,
    paddingBottom: 48,
    gap: 12,
  },

  // Photo
  photoArea: {
    width: '100%',
    height: 260,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cameraSymbol: {
    fontSize: 36,
    marginBottom: 4,
  },
  photoLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  photoHint: {
    fontSize: 12,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  retakeBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  retakeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // Location
  locationBox: {
    borderRadius: 10,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 50,
    justifyContent: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationSymbol: {
    fontSize: 14,
  },
  locationText: {
    fontSize: 13,
    lineHeight: 20,
  },

  // Saving
  savingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  savingText: {
    fontSize: 13,
  },

  // Actions
  actions: {
    gap: 10,
    marginTop: 8,
  },
});