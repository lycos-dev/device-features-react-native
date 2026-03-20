import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ThemedText } from '../../components';
import { useTheme } from '../../context';
import { RootStackNavigationProp } from '../../navigation';
import {
  getAddressFromCoords,
  saveEntry,
  sendEntrySavedNotification,
} from '../../services';
import { TravelEntry } from '../../types';
import { validateEntryWithAlert } from '../../utils';

type SaveStatus = 'idle' | 'locating' | 'saving';

const DESCRIPTION_MAX = 140;

// ─── Camera icon ──────────────────────────────────────────────────────────────
const CameraIcon: React.FC<{ color: string }> = ({ color }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
    <View style={{
      width: 8, height: 4,
      borderTopLeftRadius: 2, borderTopRightRadius: 2,
      borderWidth: 1.5, borderBottomWidth: 0,
      borderColor: color, alignSelf: 'center',
      marginBottom: -1, zIndex: 1,
    }} />
    <View style={{
      width: 26, height: 18, borderWidth: 1.5,
      borderColor: color, borderRadius: 3,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <View style={{
        width: 10, height: 10, borderRadius: 5,
        borderWidth: 1.5, borderColor: color,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: color }} />
      </View>
    </View>
  </View>
);

// ─── Screen ───────────────────────────────────────────────────────────────────
export const AddEntryScreen: React.FC = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { theme } = useTheme();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);

  // Camera modal state
  const [showCamera, setShowCamera] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');
  const [torchOn, setTorchOn] = useState(false);
  const cameraRef = useRef<React.ElementRef<typeof CameraView> | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const descriptionY = useRef(0);

  const isLoading = status !== 'idle';

  // ─── Open camera modal ────────────────────────────────────────────────────
  const handleOpenCamera = useCallback(async () => {
    const granted = cameraPermission?.granted;
    if (!granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('Camera Access Required', 'Please allow camera access in Settings.');
        return;
      }
    }
    setShowCamera(true);
  }, [cameraPermission, requestCameraPermission]);

  // ─── Take photo ───────────────────────────────────────────────────────────
  const handleTakePicture = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      const result = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (result?.uri) {
        setShowCamera(false);
        setTorchOn(false);
        setImageUri(result.uri);
        askForLocation();
      }
    } catch {
      Alert.alert('Error', 'Failed to capture photo.');
    }
  }, []);

  // ─── Ask location ─────────────────────────────────────────────────────────
  const askForLocation = useCallback(() => {
    Alert.alert(
      'Tag Location?',
      'Would you like to tag the location for this photo?',
      [
        {
          text: 'Skip',
          style: 'cancel',
          onPress: () => { setAddress('No location'); setStatus('idle'); },
        },
        { text: 'Tag Location', onPress: () => fetchLocation() },
      ]
    );
  }, []);

  // ─── Fetch location ───────────────────────────────────────────────────────
  const fetchLocation = useCallback(async () => {
    try {
      setStatus('locating');
      setLocationError(null);
      const { status: s } = await Location.requestForegroundPermissionsAsync();
      if (s !== 'granted') {
        setLocationError('Location access denied.');
        setAddress('No location');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const fetched = await getAddressFromCoords({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      setAddress(fetched);
      setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch {
      setLocationError('Could not fetch location.');
      setAddress('No location');
    } finally {
      setStatus('idle');
    }
  }, []);

  // ─── Keyboard scroll ──────────────────────────────────────────────────────
  const handleDescriptionLayout = (e: LayoutChangeEvent) => {
    descriptionY.current = e.nativeEvent.layout.y;
  };

  const handleDescriptionFocus = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, descriptionY.current - 120),
        animated: true,
      });
    }, 100);
  };

  // ─── Save ─────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!validateEntryWithAlert(imageUri, address)) return;
    try {
      setStatus('saving');
      const entry: TravelEntry = {
        id: `entry_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        imageUri: imageUri!,
        address: address!,
        createdAt: new Date().toISOString(),
        ...(coords ? { latitude: coords.latitude, longitude: coords.longitude } : {}),
        ...(description.trim() ? { description: description.trim() } : {}),
      };
      await saveEntry(entry);
      await sendEntrySavedNotification(address!);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Save Failed', err instanceof Error ? err.message : 'Could not save entry.');
    } finally {
      setStatus('idle');
    }
  }, [imageUri, address, coords, description, navigation]);

  // ─── Discard ──────────────────────────────────────────────────────────────
  const handleDiscard = useCallback(() => {
    if (!imageUri && !address && !description) { navigation.goBack(); return; }
    Alert.alert('Discard entry?', 'Unsaved changes will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          setImageUri(null); setAddress(null);
          setCoords(null); setDescription('');
          setLocationError(null); navigation.goBack();
        },
      },
    ]);
  }, [imageUri, address, description, navigation]);

  const steps = [
    { label: 'Photo',    done: !!imageUri },
    { label: 'Location', done: !!address },
    { label: 'Save',     done: false },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            onPress={handleDiscard}
            disabled={isLoading}
            style={[styles.backButton, { backgroundColor: theme.surfaceSecondary }]}
          >
            <Text style={[styles.backSymbol, { color: theme.textPrimary }]}>←</Text>
          </TouchableOpacity>
          <ThemedText variant="h3" style={[styles.headerTitle, { color: theme.textPrimary }]}>
            New Entry
          </ThemedText>
          <View style={styles.headerSpacer} />
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
                {step.done && <Text style={[styles.stepCheck, { color: theme.textInverse }]}>✓</Text>}
              </View>
              <Text style={[styles.stepLabel, { color: step.done ? theme.textPrimary : theme.textSecondary }]}>
                {step.label}
              </Text>
              {i < steps.length - 1 && (
                <View style={[styles.stepLine, { backgroundColor: step.done ? theme.primary : theme.border }]} />
              )}
            </View>
          ))}
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          {/* Photo section */}
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
              onPress={handleOpenCamera}
              disabled={isLoading}
              activeOpacity={0.75}
            >
              {imageUri ? (
                <>
                  <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                  <View style={styles.retakeChip}>
                    <Text style={styles.retakeChipText}>⟳  Retake</Text>
                  </View>
                </>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <View style={[styles.cameraIconWrap, { borderColor: theme.textSecondary, backgroundColor: theme.surface }]}>
                    <CameraIcon color={theme.textSecondary} />
                  </View>
                  <Text style={[styles.photoLabel, { color: theme.textPrimary }]}>
                    Tap to take a photo
                  </Text>
                  <Text style={[styles.photoHint, { color: theme.textSecondary }]}>
                    Camera & location access will be requested
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Location section */}
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
                  <Text style={[styles.locationText, { color: theme.textSecondary }]}>Fetching location...</Text>
                </View>
              ) : locationError ? (
                <View style={styles.locationRow}>
                  <View style={[styles.locationDot, { backgroundColor: theme.errorLight }]}>
                    <Text style={[styles.locationDotSymbol, { color: theme.error }]}>⊘</Text>
                  </View>
                  <Text style={[styles.locationText, { color: theme.error, flex: 1 }]}>{locationError}</Text>
                </View>
              ) : address ? (
                <View style={styles.locationRow}>
                  <View style={[
                    styles.locationDot,
                    { backgroundColor: address === 'No location' ? theme.surfaceSecondary : theme.primaryLight },
                  ]}>
                    <Text style={[
                      styles.locationDotSymbol,
                      { color: address === 'No location' ? theme.textSecondary : theme.primary },
                    ]}>
                      {address === 'No location' ? '—' : '◎'}
                    </Text>
                  </View>
                  <Text style={[styles.locationText, { color: theme.textPrimary, flex: 1 }]}>{address}</Text>
                </View>
              ) : (
                <View style={styles.locationRow}>
                  <View style={[styles.locationDot, { backgroundColor: theme.surfaceSecondary }]}>
                    <Text style={[styles.locationDotSymbol, { color: theme.textSecondary }]}>◎</Text>
                  </View>
                  <Text style={[styles.locationText, { color: theme.textSecondary }]}>Take a photo first</Text>
                </View>
              )}
            </View>
          </View>

          {/* Description section */}
          <View style={styles.section} onLayout={handleDescriptionLayout}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
              DESCRIPTION <Text style={{ color: theme.textMuted, letterSpacing: 0 }}>— optional</Text>
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Add a short note about this memory..."
              placeholderTextColor={theme.textMuted}
              multiline
              maxLength={DESCRIPTION_MAX}
              style={[
                styles.descriptionInput,
                {
                  color: theme.textPrimary,
                  borderColor: description ? theme.primary : theme.border,
                  backgroundColor: theme.surface,
                },
              ]}
              textAlignVertical="top"
              onFocus={handleDescriptionFocus}
            />
            <Text style={[styles.descriptionCount, { color: theme.textMuted }]}>
              {description.length}/{DESCRIPTION_MAX}
            </Text>
          </View>

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

      {/* ── In-app Camera Modal ── */}
      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={() => { setShowCamera(false); setTorchOn(false); }}
      >
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.cameraView}
            facing={cameraFacing}
            enableTorch={torchOn}
          >
            {/* Camera header */}
            <View style={styles.cameraHeader}>
              <Text style={styles.cameraTitle}>New Memory</Text>
              <View style={styles.cameraHeaderActions}>
                <Pressable
                  style={styles.camIconBtn}
                  onPress={() => setTorchOn(v => !v)}
                  hitSlop={10}
                >
                  <Text style={styles.camIconText}>{torchOn ? '⚡' : '✦'}</Text>
                </Pressable>
                <Pressable
                  style={styles.camIconBtn}
                  onPress={() => setCameraFacing(v => v === 'back' ? 'front' : 'back')}
                  hitSlop={10}
                >
                  <Text style={styles.camIconText}>⇄</Text>
                </Pressable>
                <Pressable
                  style={styles.camIconBtn}
                  onPress={() => { setShowCamera(false); setTorchOn(false); }}
                  hitSlop={10}
                >
                  <Text style={styles.camIconText}>✕</Text>
                </Pressable>
              </View>
            </View>

            {/* Camera footer — no gallery, centered capture button */}
            <View style={styles.cameraFooter}>
              <View style={styles.cameraActionCol} />
              <View style={styles.captureCol}>
                <Pressable style={styles.captureOuter} onPress={handleTakePicture} hitSlop={10}>
                  <View style={styles.captureInner} />
                </Pressable>
                <Text style={styles.captureLabel}>Capture</Text>
              </View>
              <View style={styles.cameraActionCol} />
            </View>
          </CameraView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  backSymbol: { fontSize: 18 },
  headerTitle: { flex: 1, textAlign: 'center' },
  headerSpacer: { width: 34 },

  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stepItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepCheck: { fontSize: 11, fontWeight: '700' },
  stepLabel: { fontSize: 11, fontWeight: '500', letterSpacing: 0.3 },
  stepLine: { width: 28, height: 1, marginHorizontal: 6 },

  scrollContent: { padding: 20, paddingBottom: 48, gap: 16 },
  section: { gap: 8 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },

  photoArea: { width: '100%', height: 260, borderRadius: 12, overflow: 'hidden' },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24 },
  cameraIconWrap: { width: 64, height: 64, borderRadius: 32, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  photoLabel: { fontSize: 15, fontWeight: '600' },
  photoHint: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  previewImage: { width: '100%', height: '100%' },
  retakeChip: {
    position: 'absolute', bottom: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  retakeChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '500', letterSpacing: 0.3 },

  locationBox: { borderRadius: 12, padding: 14, minHeight: 54, justifyContent: 'center' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  locationDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  locationDotSymbol: { fontSize: 14 },
  locationText: { fontSize: 13, lineHeight: 20 },

  descriptionInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    minHeight: 90,
    lineHeight: 21,
  },
  descriptionCount: { fontSize: 11, textAlign: 'right', marginTop: 4 },

  divider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },
  actions: { gap: 10 },

  cameraContainer: { flex: 1, backgroundColor: '#000' },
  cameraView: { flex: 1, justifyContent: 'space-between' },
  cameraHeader: {
    paddingTop: 56, paddingHorizontal: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  cameraTitle: { color: '#FFF', fontSize: 17, fontWeight: '600', letterSpacing: 0.3 },
  cameraHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  camIconBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  camIconText: { color: '#FFF', fontSize: 18 },
  cameraFooter: {
    paddingHorizontal: 28, paddingBottom: 48,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
  },
  cameraActionCol: { width: 64 },
  captureCol: { alignItems: 'center' },
  captureOuter: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 4, borderColor: '#FFF',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  captureInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#FFF' },
  captureLabel: { marginTop: 10, color: '#FFF', fontSize: 13, fontWeight: '600', letterSpacing: 0.3 },
});