import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Button, ThemedText } from '../../components';
import { RootStackNavigationProp } from '../../navigation';
import {
  CameraCancelledError,
  CameraPermissionDeniedError,
  getCurrentAddress,
  LocationPermissionDeniedError,
  openCamera,
  saveEntry,
  sendEntrySavedNotification,
} from '../../services';
import { TravelEntry } from '../../types';

type SaveStatus = 'idle' | 'capturing' | 'locating' | 'saving';

export const AddEntryScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);

  const isLoading = status !== 'idle';

  // ─── Camera ────────────────────────────────────────────────────────────────

  const handleTakePhoto = useCallback(async () => {
    if (isLoading) return;

    try {
      setStatus('capturing');
      setLocationError(null);

      const { uri } = await openCamera();
      setImageUri(uri);

      // Auto-fetch location right after photo is taken
      setStatus('locating');
      const fetchedAddress = await getCurrentAddress();
      setAddress(fetchedAddress);
    } catch (err) {
      if (err instanceof CameraCancelledError) {
        // User cancelled — silent, no alert needed
      } else if (err instanceof CameraPermissionDeniedError) {
        Alert.alert(
          'Camera Permission Denied',
          'Please enable camera access in your device Settings to take photos.',
          [{ text: 'OK' }]
        );
      } else if (err instanceof LocationPermissionDeniedError) {
        setLocationError('Location permission denied. Address could not be fetched.');
      } else {
        Alert.alert(
          'Something Went Wrong',
          err instanceof Error ? err.message : 'Could not take photo. Please try again.'
        );
      }
    } finally {
      setStatus('idle');
    }
  }, [isLoading]);

  // ─── Validation ────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    if (!imageUri) {
      Alert.alert('No Photo', 'Please take a photo before saving.');
      return false;
    }
    if (!address) {
      Alert.alert(
        'No Location',
        'Address could not be fetched. Please try retaking the photo or check location permissions.'
      );
      return false;
    }
    return true;
  };

  // ─── Save ──────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!validate()) return;

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

      // Navigate back — HomeScreen's useFocusEffect will reload the list
      navigation.goBack();
    } catch (err) {
      Alert.alert(
        'Save Failed',
        err instanceof Error ? err.message : 'Could not save entry. Please try again.'
      );
    } finally {
      setStatus('idle');
    }
  }, [imageUri, address, navigation]);

  // ─── Discard ───────────────────────────────────────────────────────────────

  const handleDiscard = useCallback(() => {
    if (!imageUri && !address) {
      navigation.goBack();
      return;
    }

    Alert.alert(
      'Discard Entry?',
      'You have unsaved changes. Are you sure you want to go back?',
      [
        { text: 'Keep Editing', style: 'cancel' },
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
      ]
    );
  }, [imageUri, address, navigation]);

  // ─── Render ────────────────────────────────────────────────────────────────

  const renderStatusBadge = () => {
    if (status === 'locating') {
      return (
        <View style={styles.statusBadge}>
          <ActivityIndicator size="small" color="#4F46E5" />
          <ThemedText variant="caption" color="secondary" style={styles.statusText}>
            Fetching location...
          </ThemedText>
        </View>
      );
    }
    if (status === 'saving') {
      return (
        <View style={styles.statusBadge}>
          <ActivityIndicator size="small" color="#4F46E5" />
          <ThemedText variant="caption" color="secondary" style={styles.statusText}>
            Saving entry...
          </ThemedText>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleDiscard}
            disabled={isLoading}
            style={styles.backButton}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <ThemedText variant="h2">New Entry</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Photo Section ── */}
          <View style={styles.section}>
            <ThemedText variant="label" color="muted" style={styles.sectionLabel}>
              Photo
            </ThemedText>

            <TouchableOpacity
              style={[styles.photoArea, imageUri ? styles.photoAreaFilled : styles.photoAreaEmpty]}
              onPress={handleTakePhoto}
              disabled={isLoading}
              activeOpacity={0.8}
              accessibilityLabel={imageUri ? 'Retake photo' : 'Take photo'}
              accessibilityRole="button"
            >
              {status === 'capturing' ? (
                <View style={styles.photoPlaceholder}>
                  <ActivityIndicator size="large" color="#4F46E5" />
                  <ThemedText variant="bodySmall" color="muted" style={styles.placeholderText}>
                    Opening camera...
                  </ThemedText>
                </View>
              ) : imageUri ? (
                <>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                  <View style={styles.retakeOverlay}>
                    <Text style={styles.retakeIcon}>📷</Text>
                    <ThemedText variant="caption" color="white">
                      Tap to retake
                    </ThemedText>
                  </View>
                </>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.cameraEmoji}>📷</Text>
                  <ThemedText variant="body" color="muted">
                    Tap to take a photo
                  </ThemedText>
                  <ThemedText variant="caption" color="muted">
                    Location will be fetched automatically
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Location Section ── */}
          <View style={styles.section}>
            <ThemedText variant="label" color="muted" style={styles.sectionLabel}>
              Location
            </ThemedText>

            <View style={styles.locationBox}>
              {status === 'locating' ? (
                <View style={styles.locationRow}>
                  <ActivityIndicator size="small" color="#4F46E5" />
                  <ThemedText variant="bodySmall" color="muted" style={styles.statusText}>
                    Detecting your location...
                  </ThemedText>
                </View>
              ) : locationError ? (
                <View style={styles.locationRow}>
                  <Text style={styles.locationIcon}>⚠️</Text>
                  <ThemedText variant="bodySmall" color="error" style={styles.flex}>
                    {locationError}
                  </ThemedText>
                </View>
              ) : address ? (
                <View style={styles.locationRow}>
                  <Text style={styles.locationIcon}>📍</Text>
                  <ThemedText variant="body" color="primary" style={styles.flex}>
                    {address}
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.locationRow}>
                  <Text style={styles.locationIcon}>📍</Text>
                  <ThemedText variant="bodySmall" color="muted">
                    Address will appear after taking a photo
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* ── Status Badge ── */}
          {renderStatusBadge()}

          {/* ── Actions ── */}
          <View style={styles.actions}>
            <Button
              label="Save Entry"
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
              style={styles.discardButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F7FF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: '#EFEFEF',
    width: 40,
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 18,
    color: '#1A1A1A',
  },
  headerSpacer: {
    width: 40,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
    gap: 24,
  },
  section: {
    gap: 10,
  },
  sectionLabel: {
    marginBottom: 2,
  },

  // Photo area
  photoArea: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    overflow: 'hidden',
  },
  photoAreaEmpty: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#C4C2F0',
    backgroundColor: '#F1F0FF',
  },
  photoAreaFilled: {
    borderWidth: 0,
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 20,
  },
  cameraEmoji: {
    fontSize: 48,
    marginBottom: 4,
  },
  placeholderText: {
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  retakeOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  retakeIcon: {
    fontSize: 14,
  },

  // Location box
  locationBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 56,
    justifyContent: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  locationIcon: {
    fontSize: 16,
    marginTop: 1,
  },

  // Status badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  statusText: {
    marginLeft: 4,
  },

  // Actions
  actions: {
    gap: 12,
    marginTop: 8,
  },
  discardButton: {
    marginTop: 4,
  },
});