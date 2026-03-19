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
        Alert.alert('Camera Permission Denied', 'Enable camera access in Settings.');
      } else if (err instanceof LocationPermissionDeniedError) {
        setLocationError('Location permission denied. Address could not be fetched.');
      } else {
        Alert.alert('Error', err instanceof Error ? err.message : 'Could not take photo.');
      }
    } finally {
      setStatus('idle');
    }
  }, [isLoading]);

  const validate = (): boolean => {
    if (!imageUri) {
      Alert.alert('No Photo', 'Please take a photo before saving.');
      return false;
    }
    if (!address) {
      Alert.alert('No Location', 'Address could not be fetched. Please try retaking the photo.');
      return false;
    }
    return true;
  };

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
      navigation.goBack();
    } catch (err) {
      Alert.alert('Save Failed', err instanceof Error ? err.message : 'Could not save entry.');
    } finally {
      setStatus('idle');
    }
  }, [imageUri, address, navigation]);

  const handleDiscard = useCallback(() => {
    if (!imageUri && !address) { navigation.goBack(); return; }
    Alert.alert('Discard Entry?', 'You have unsaved changes. Are you sure?', [
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
    ]);
  }, [imageUri, address, navigation]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleDiscard}
            disabled={isLoading}
            style={[styles.backButton, { backgroundColor: theme.surfaceSecondary }]}
          >
            <Text style={[styles.backIcon, { color: theme.textPrimary }]}>←</Text>
          </TouchableOpacity>
          <ThemedText variant="h2" style={{ color: theme.textPrimary }}>New Entry</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo Section */}
          <View style={styles.section}>
            <ThemedText variant="label" style={{ color: theme.textMuted }}>Photo</ThemedText>
            <TouchableOpacity
              style={[
                styles.photoArea,
                imageUri
                  ? styles.photoAreaFilled
                  : [styles.photoAreaEmpty, { borderColor: theme.borderFocus, backgroundColor: theme.primaryLight }],
              ]}
              onPress={handleTakePhoto}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {status === 'capturing' ? (
                <View style={styles.photoPlaceholder}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <ThemedText variant="bodySmall" style={{ color: theme.textMuted, marginTop: 8 }}>
                    Opening camera...
                  </ThemedText>
                </View>
              ) : imageUri ? (
                <>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                  <View style={styles.retakeOverlay}>
                    <Text style={styles.retakeIcon}>📷</Text>
                    <ThemedText variant="caption" style={{ color: '#FFFFFF' }}>Tap to retake</ThemedText>
                  </View>
                </>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.cameraEmoji}>📷</Text>
                  <ThemedText variant="body" style={{ color: theme.textMuted }}>Tap to take a photo</ThemedText>
                  <ThemedText variant="caption" style={{ color: theme.textMuted }}>
                    Location will be fetched automatically
                  </ThemedText>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <ThemedText variant="label" style={{ color: theme.textMuted }}>Location</ThemedText>
            <View style={[styles.locationBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {status === 'locating' ? (
                <View style={styles.locationRow}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <ThemedText variant="bodySmall" style={{ color: theme.textMuted, marginLeft: 8 }}>
                    Detecting your location...
                  </ThemedText>
                </View>
              ) : locationError ? (
                <View style={styles.locationRow}>
                  <Text>⚠️</Text>
                  <ThemedText variant="bodySmall" style={{ color: theme.error, flex: 1, marginLeft: 8 }}>
                    {locationError}
                  </ThemedText>
                </View>
              ) : address ? (
                <View style={styles.locationRow}>
                  <Text>📍</Text>
                  <ThemedText variant="body" style={{ color: theme.textPrimary, flex: 1, marginLeft: 8 }}>
                    {address}
                  </ThemedText>
                </View>
              ) : (
                <View style={styles.locationRow}>
                  <Text>📍</Text>
                  <ThemedText variant="bodySmall" style={{ color: theme.textMuted, marginLeft: 8 }}>
                    Address will appear after taking a photo
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* Saving indicator */}
          {status === 'saving' && (
            <View style={styles.statusBadge}>
              <ActivityIndicator size="small" color={theme.primary} />
              <ThemedText variant="caption" style={{ color: theme.textSecondary, marginLeft: 8 }}>
                Saving entry...
              </ThemedText>
            </View>
          )}

          {/* Actions */}
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
  flex: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: { padding: 8, borderRadius: 10, width: 40, alignItems: 'center' },
  backIcon: { fontSize: 18 },
  headerSpacer: { width: 40 },
  scrollContent: { padding: 20, paddingBottom: 48, gap: 24 },
  section: { gap: 10 },
  photoArea: { width: '100%', height: 240, borderRadius: 16, overflow: 'hidden' },
  photoAreaEmpty: { borderWidth: 2, borderStyle: 'dashed' },
  photoAreaFilled: { borderWidth: 0 },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 20 },
  cameraEmoji: { fontSize: 48, marginBottom: 4 },
  previewImage: { width: '100%', height: '100%' },
  retakeOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, gap: 6,
  },
  retakeIcon: { fontSize: 14 },
  locationBox: { borderRadius: 12, padding: 16, borderWidth: 1, minHeight: 56, justifyContent: 'center' },
  locationRow: { flexDirection: 'row', alignItems: 'flex-start' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  actions: { gap: 12, marginTop: 8 },
  discardButton: { marginTop: 4 },
});
