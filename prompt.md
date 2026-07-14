# Design Prompt: [Vidsaver]

## 1. Overview
An Android-exclusive React Native application built with **Expo SDK 56** and the **`@expo/ui`** package. The UI renders native **Jetpack Compose** components for optimal Android performance and a true Material You experience. The app consists of exactly **two main screens**: **Home** and **Downloads**.

## 2. Strict Constraints
- ❌ **No Linear Gradients** – Absolutely forbidden in the **Header** and **Bottom Tab Bar**.
- ❌ **No Tailwind CSS / NativeWind** – Styling is handled via `@expo/ui` props and `StyleSheet`.
- ❌ **No iOS-specific considerations** – This app targets Android exclusively.
- ✅ **Use `@expo/ui`** – All UI components come from `@expo/ui`, which maps directly to Jetpack Compose.

## 3. Design Principles
- **Material You (Android)**: Follow Material Design 3 guidelines with dynamic color support (if enabled) or a fixed solid color palette.
- **Flat & Solid**: Depth is created using `elevation` (Compose's `Surface` elevation) and subtle borders—**never** with gradients.
- **Minimalist Navigation**: With only two screens, navigation is simple and focused.

## 4. Color Palette (Solid Colors Only)
Use a Material 3 color scheme with solid fills.

| Role | Color (Example) |
|------|----------------|
| Primary | `#2563EB` |
| Primary Container | `#DBEAFE` |
| Secondary | `#7C3AED` |
| Background | `#FFFFFF` |
| Surface | `#F8FAFC` |
| Surface Variant | `#E2E8F0` |
| Text Primary | `#0F172A` |
| Text Secondary | `#475569` |
| Outline | `#94A3B8` |

> *Replace these with your brand colors.*

## 5. Header (Android, No Gradients)
- **Background**: Solid `Primary` or solid `Surface` with a bottom `Divider` (`SurfaceVariant` color).
- **Height**: Standard 56dp + status bar inset.
- **Elevation**: Optional – wrap in `Surface` with `elevation={2}` for a subtle shadow.

## 6. Bottom Tab Bar (Android, No Gradients)
- **Implementation**: Use `NavigationBar` from `@expo/ui` (Jetpack Compose's `NavigationBar`).
- **Items**: Exactly **2 tabs** – **Home** and **Downloads**.
- **Background**: Solid `Surface` color.
- **Height**: ~56dp + bottom inset.
- **Active State**: Icon and label use `Primary` solid color.
- **Inactive State**: Icon and label use `Text Secondary` color.
- **Indicator**: If an active indicator is shown (e.g., a pill or underline), it must be a solid `Primary` block—**no gradient**.

## 7. Screen Breakdown

### Screen 1: Home
- **Purpose**: Input a video URL, fetch metadata, and trigger downloads.
- **Components**:
  - `TextField` (outlined) for URL input with a "Paste" button.
  - `Button` (contained, solid `Primary`) for "Fetch / Download".
  - `Card` (`ElevatedCard`) to display video metadata (thumbnail, title, quality options) – solid background, no gradients.
  - Download progress indicator (`LinearProgressIndicator` – solid accent color).

### Screen 2: Downloads
- **Purpose**: Display a list of all saved videos.
- **Components**:
  - `LazyColumn` for performant scrolling.
  - Each list item as an `OutlinedCard` or `ElevatedCard` showing:
    - Thumbnail (left)
    - Video title (bold, `Text Primary`)
    - File size / date (`Text Secondary`)
    - A "Delete" or "Share" `IconButton` (right).
  - An empty state with an illustration and helper text when no downloads exist.

## 8. Navigation Structure
- **Root**: A single `NavigationBar` with 2 tabs.
- **Tab 1**: `Home` screen.
- **Tab 2**: `Downloads` screen.
- No nested navigation or deep stacks are required (keeping it simple).

## 9. `@expo/ui` Component Mapping (Android/Jetpack Compose)

| Purpose | `@expo/ui` Component | Compose Equivalent |
|---------|-----------------------|---------------------|
| Layout containers | `Column`, `Row`, `Box` | `Column`, `Row`, `Box` |
| Surface with elevation | `Surface` | `Surface` (with `elevation`) |
| Cards | `Card`, `ElevatedCard`, `OutlinedCard` | `Card`, `ElevatedCard`, `OutlinedCard` |
| Text input | `TextField`, `OutlinedTextField` | `TextField`, `OutlinedTextField` |
| Buttons | `Button` | `Button` |
| Scrolling list | `LazyColumn` | `LazyColumn` |
| Bottom navigation | `NavigationBar` | `NavigationBar` |
| Icons | `Icon`, `IconButton` | `Icon`, `IconButton` |

## 10. Code Example (Header & Tabs)

```tsx
import { Host, Surface, Row, Column, Text, IconButton, NavigationBar, NavigationBarItem, OutlinedTextField, Button, ElevatedCard } from '@expo/ui';
import { StyleSheet } from 'react-native';

// Header – No Gradients
function AppHeader({ title }) {
  return (
    <Surface style={styles.header} elevation={0}>
      <Row style={styles.headerRow}>
        <IconButton icon="menu" onPress={() => {}} />
        <Text style={styles.headerTitle}>{title}</Text>
        <IconButton icon="search" onPress={() => {}} />
      </Row>
    </Surface>
  );
}

// Bottom Tab – 2 items, No Gradients
function AppTabs() {
  return (
    <NavigationBar style={styles.tabBar}>
      <NavigationBarItem
        icon="home"
        label="Home"
        selected={selectedTab === 0}
        onPress={() => setSelectedTab(0)}
      />
      <NavigationBarItem
        icon="download"
        label="Downloads"
        selected={selectedTab === 1}
        onPress={() => setSelectedTab(1)}
      />
    </NavigationBar>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerRow: {
    paddingHorizontal: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    height: 56,
  },
});
```

## 11. Required Dependencies
- `expo@~56.0.0`
- `@expo/ui`

## 12. Android-Specific Enhancements
- **Edge-to-Edge**: Enable edge-to-edge display with transparent status/navigation bars (using `expo-navigation-bar` and `expo-status-bar`).
- **Ripple Effect**: Use `@expo/ui`'s built-in ripple feedback on buttons and cards (enabled by default in Compose).
- **Dynamic Color**: Optionally support Material You dynamic theming (Android 12+) via the `@expo/ui` theme provider.

---
