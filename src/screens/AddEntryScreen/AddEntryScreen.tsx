import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
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
  getAddressFromCoords,
  openCamera,
  saveEntry,
  sendEntrySavedNotification,
} from '../../services';
import { TravelEntry } from '../../types';
import { validateEntryWithAlert } from '../../utils';

type SaveStatus = 'idle' | 'requesting' | 'capturing' | 'locating' | 'saving';

// ─── Camera icon built from RN Views — no SVG dependency ─────────────────────
const CameraIcon: React.FC<{ color: string }> = ({ color }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center', gap: 0 }}>
    {/* Viewfinder bump on top */}
    <View style={{
      width: 8, height: 4,
      borderTopLeftRadius: 2, borderTopRightRadius: 2,
      borderWidth: 1.5, borderBottomWidth: 0,
      borderColor: color,
      alignSelf: 'center',
      marginBottom: -1,
      zIndex: 1,
    }} />
    {/* Camera body */}
    <View style={{
      width: 26, height: 18,
      borderWidth: 1.5,
      borderColor: color,
      borderRadius: 3,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {/* Lens — outer ring */}
      <View style={{
        width: 10, height: 10,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* Lens — inner dot */}
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
      </View>
    </View>
  </View>
);

// ─── Permission helpers ───────────────────────────────────────────────────────
const requestCameraPermission = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  return status === 'granted';
};

const requestLocationPermission = async (): Promise<boolean> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
};

// ─── Screen ───────────────────────────────────────────────────────────────────
export const AddEntryScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { theme } = useTheme();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);

  const isLoading = status !== 'idle';

  // ─── Take photo ─────────────────────────────────────────────────────────────
  const handleTakePhoto = useCallback(async () => {
    if (isLoading) return;
    try {
      setStatus('requesting');

      const cameraGranted = await requestCameraPermission();
      if (!cameraGranted) {
        Alert.alert(
          'Camera Access Required',
          'Please allow camera access to take photos for your travel entries.',
          [{ text: 'OK' }]
        );
        return;
      }

      setStatus('capturing');
      const { uri } = await openCamera();
      setImageUri(uri);

      // Ask user whether to tag location — after photo is taken
      Alert.alert(
        'Tag Location?',
        'Would you like to tag the location for this photo?',
        [
          {
            text: 'Skip',
            style: 'cancel',
            onPress: () => {
              setAddress('No location');
              setStatus('idle');
            },
          },
          {
            text: 'Tag Location',
            style: 'default',
            onPress: () => fetchLocation(),
          },
        ]
      );
    } catch (err) {
      if (err instanceof CameraCancelledError) {
        // silent
      } else {
        Alert.alert('Error', err instanceof Error ? err.message : 'Could not open camera.');
      }
      setStatus('idle');
    }
  }, [isLoading]);

  // ─── Fetch location ──────────────────────────────────────────────────────────
  const fetchLocation = useCallback(async () => {
    try {
      setStatus('locating');
      setLocationError(null);

      const locationGranted = await requestLocationPermission();
      if (!locationGranted) {
        setLocationError('Location access denied.');
        setAddress('No location');
        Alert.alert(
          'Location Access Required',
          'Please allow location access to tag where this photo was taken.',
          [{ text: 'OK' }]
        );
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const fetched = await getAddressFromCoords({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setAddress(fetched);
    } catch {
      setLocationError('Could not fetch location.');
      setAddress('No location');
    } finally {
      setStatus('idle');
    }
  }, []);

  // ─── Save ────────────────────────────────────────────────────────────────────
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

  // ─── Discard ─────────────────────────────────────────────────────────────────
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

  const getStatusLabel = () => {
    switch (status) {
      case 'requesting': return 'Requesting permission...';
      case 'capturing':  return 'Opening camera...';
      case 'locating':   return 'Fetching location...';
      case 'saving':     return 'Saving entry...';
      default:           return null;
    }
  };

  const steps = [
    { label: 'Photo',    done: !!imageUri },
    { label: 'Location', done: !!address },
    { label: 'Save',     done: false },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Header — back button left, title centered, spacer right ── */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={handleDiscard}
            disabled={isLoading}
            style={[styles.backButton, { backgroundColor: theme.surfaceSecondary }]}
            accessibilityLabel="Go back"
          >
            <Text style={[styles.backSymbol, { color: theme.textPrimary }]}>←</Text>
          </TouchableOpacity>

          <ThemedText variant="h3" style={[styles.headerTitle, { color: theme.textPrimary }]}>
            New Entry
          </ThemedText>

          {/* Spacer — same width as back button to keep title truly centered */}
          <View style={styles.headerSpacer} />
        </View>

        {/* ── Step progress ── */}
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
              <Text style={[
                styles.stepLabel,
                { color: step.done ? theme.textPrimary : theme.textSecondary },
              ]}>
                {step.label}
              </Text>
              {i < steps.length - 1 && (
                <View style={[
                  styles.stepLine,
                  { backgroundColor: step.done ? theme.primary : theme.border },
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
          {/* ── Photo section ── */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>PHOTO</Text>

            <TouchableOpacity
              style={[
                styles.photoArea,
                {
                  backgroundColor: theme.surfaceSecondary,
                  borderColor: imageUri ? theme.primary : theme.border,
                  borderWidth: imageUri ? 1.5 : 1,
                },
              ]}
              onPress={handleTakePhoto}
              disabled={isLoading}
              activeOpacity={0.75}
              accessibilityLabel={imageUri ? 'Retake photo' : 'Take photo'}
            >
              {status === 'requesting' || status === 'capturing' ? (
                <View style={styles.photoPlaceholder}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={[styles.photoHint, { color: theme.textSecondary }]}>
                    {getStatusLabel()}
                  </Text>
                </View>
              ) : imageUri ? (
                <>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                  <View style={styles.retakeChip}>
                    <Text style={styles.retakeChipText}>⟳  Retake</Text>
                  </View>
                </>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <View style={[styles.cameraIconWrap, { borderColor: theme.textSecondary, backgroundColor: theme.surface }]}>
                    <CameraIcon color={theme.textSecondary} size={28} />
                  </View>
                  <Text style={[styles.photoLabel, { color: theme.textPrimary }]}>
                    Tap to take a photo
                  </Text>
                  <Text style={[styles.photoHint, { color: theme.textSecondary }]}>
                    Camera &amp; location access will be requested
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* ── Location section ── */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>LOCATION</Text>

            <View style={[
              styles.locationBox,
              {
                backgroundColor: theme.surface,
                borderColor: address && address !== 'No location' ? theme.primary : theme.border,
                borderWidth: address && address !== 'No location' ? 1.5 : 1,
              },
            ]}>
              {status === 'locating' ? (
                <View style={styles.locationRow}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text style={[styles.locationText, { color: theme.textSecondary }]}>
                    Fetching location...
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
                  <View style={[
                    styles.locationDot,
                    {
                      backgroundColor: address === 'No location'
                        ? theme.surfaceSecondary
                        : theme.primaryLight,
                    },
                  ]}>
                    <Text style={[
                      styles.locationDotSymbol,
                      { color: address === 'No location' ? theme.textSecondary : theme.primary },
                    ]}>
                      {address === 'No location' ? '—' : '◎'}
                    </Text>
                  </View>
                  <Text style={[styles.locationText, { color: theme.textPrimary, flex: 1 }]}>
                    {address}
                  </Text>
                </View>
              ) : (
                <View style={styles.locationRow}>
                  <View style={[styles.locationDot, { backgroundColor: theme.surfaceSecondary }]}>
                    <Text style={[styles.locationDotSymbol, { color: theme.textSecondary }]}>◎</Text>
                  </View>
                  <Text style={[styles.locationText, { color: theme.textSecondary }]}>
                    Take a photo first
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Status row */}
          {isLoading && getStatusLabel() && status !== 'requesting' && status !== 'capturing' && (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color={theme.textSecondary} />
              <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                {getStatusLabel()}
              </Text>
            </View>
          )}

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

  // Header — back | centered title | spacer
  header: {
    flexDirection: 'row',
    alignItems: 'center',
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: { width: 34 }, // mirrors backButton width

  // Progress steps
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  stepLine: { width: 28, height: 1, marginHorizontal: 6 },

  scrollContent: { padding: 20, paddingBottom: 48, gap: 16 },

  section: { gap: 8 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },

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
    gap: 12,
    paddingHorizontal: 24,
  },
  cameraIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  photoLabel: { fontSize: 15, fontWeight: '600' },
  photoHint: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
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
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  statusText: { fontSize: 13 },

  divider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  actions: { gap: 10 },
});