# Travel Diary

A minimalist travel diary app built with React Native and Expo. Capture photos, automatically tag your location, and keep a record of your travels.

---

## Features

- **Camera** — Take photos directly from the app
- **Location** — Automatically fetches and reverse-geocodes your address after each photo
- **Persistent storage** — Entries saved locally using AsyncStorage
- **Notifications** — Local notification sent after each entry is saved
- **Dark / Light mode** — Toggle with persistence across sessions

---

## Tech Stack

| Layer | Library |
|---|---|
| Framework | React Native + Expo SDK 54 |
| Navigation | React Navigation (Native Stack) |
| Storage | AsyncStorage |
| Camera | expo-image-picker |
| Location | expo-location |
| Notifications | expo-notifications |
| Safe Area | react-native-safe-area-context |
| Language | TypeScript |

---

## Project Structure

```
src/
├── components/
│   ├── EntryCard/       # Travel entry card
│   ├── EmptyState/      # Empty list placeholder
│   └── UI/              # Button, ThemedText
├── screens/
│   ├── HomeScreen/      # Entry list
│   └── AddEntryScreen/  # Create new entry
├── services/
│   ├── cameraService.ts
│   ├── locationService.ts
│   ├── notificationService.ts
│   └── storageService.ts
├── hooks/
│   ├── usePermissions.ts
│   └── useAppInit.ts
├── context/
│   └── ThemeContext.tsx
├── constants/
│   └── theme.ts
├── navigation/
│   └── RootNavigator.tsx
├── types/
│   └── index.ts
└── utils/
    └── validators.ts
```

---

**Run on device**
- Scan the QR code with Expo Go (iOS / Android)
- Or press `i` for iOS simulator / `a` for Android emulator

---

## Permissions Required

| Permission | Platform | Purpose |
|---|---|---|
| Camera | iOS + Android | Taking photos |
| Location (foreground) | iOS + Android | Tagging entry location |
| Notifications | iOS + Android | Entry saved confirmation |

Permissions are requested on first launch. If denied, relevant features will show a prompt to enable them in device Settings.

---