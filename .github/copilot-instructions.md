# StudyShare Frontend - Copilot Instructions

## Project Overview
**StudyShare** is a React Native mobile app (Expo-based) designed for Vietnamese university students ("Bách Khoa") to share learning resources and collaborate on studies. It targets iOS, Android, and web platforms.

**Tech Stack:**
- **Framework:** Expo Router with React 19 and React Native 0.81
- **Styling:** Tailwind CSS via NativeWind (cross-platform utility-first styling)
- **State/Storage:** AsyncStorage (local persistence)
- **Navigation:** Expo Router (file-based routing)
- **Build:** Expo CLI (`npx expo start`)

## Architecture & Key Patterns

### File-Based Routing (Expo Router)
- Routes are defined by file structure in `app/` directory
- `_layout.tsx` files define navigation stack for their directory level
- Route groups like `(onboarding)/` are used to organize related screens without affecting URL structure
- Navigation: `href="/(onboarding)/step2"` (use group syntax with parentheses)

**Example structure:**
```
app/
  _layout.tsx          // Root Stack (headless - no tab bar yet)
  index.tsx            // Entry point (checks onboarding state)
  login.tsx            // Login screen (empty - WIP)
  (onboarding)/        // Route group for onboarding flow
    _layout.tsx        // Stack with headerShown: false
    index.tsx          // Step 1
    step2.tsx, step3.tsx, step4.tsx
```

### Onboarding Flow
- **Entry:** `app/index.tsx` checks `AsyncStorage.getItem("hasSeenOnboarding")`
- If `"true"` → redirect to `/login`
- If not set → redirect to `/(onboarding)` (step 1)
- **Pattern:** Use AsyncStorage flags to persist onboarding completion across app launches

### Styling with NativeWind
- Use Tailwind utility classes directly in `className` props (e.g., `<View className="flex-1 bg-white">`)
- Fallback to `StyleSheet` for complex or dynamic styles
- Config in `tailwind.config.js` with NativeWind preset—can extend theme if needed
- Global styles in `app/global.css`

## Essential Development Workflows

### Start Development
```powershell
npm install                          # Install dependencies
npx expo start --clear               # Clear cache and start dev server
# Then press 'i' for iOS simulator, 'a' for Android emulator, 'w' for web
```

### Linting & Code Quality
```powershell
npm run lint                         # Run ESLint (Expo config)
npx expo lint                        # Alternative: Expo's lint command
```

### Adding Dependencies
- Use `npm install <package>` for npm packages
- Common dependencies already included: `expo-router`, `@react-navigation/*`, `async-storage`, `nativewind`
- Avoid duplicate navigation libraries—Expo Router is the source of truth

### Asset Management
- Place images in `assets/images/`
- Reference via `require("../../assets/images/filename.png")`
- Requires exact path; incomplete paths (like `require("../../assets/images/")`) will fail
- Update `app.json` for app icons/splash (already configured)

## Code Conventions

### Components & Screens
- Screens live in `app/` directory (route-based)
- Export default function from each screen file
- Use React 19 functional components with Hooks
- Pattern: `export default function ScreenName() { ... }`

### State Management
- **Local state:** `useState` for component-level data
- **Persistent state:** `AsyncStorage` for user preferences, flags, progress
- No Redux/Zustand configured—keep it simple with hooks + AsyncStorage

### Import Aliases
- `@/*` resolves to project root (configured in `tsconfig.json`)
- Rarely needed for `app/` routes but available for shared components (planned `components/` dir)

### TypeScript Strict Mode
- `strict: true` in `tsconfig.json`—enforce type safety
- Provide explicit types for props, state, and function returns
- Use `React.ReactNode` for children props

## Critical Integration Points

### AsyncStorage (Data Persistence)
```tsx
// Reading
const value = await AsyncStorage.getItem("key");

// Writing
await AsyncStorage.setItem("key", "value");
```
- Used for onboarding flag, user auth state, etc.
- Async operations—always use async/await in useEffect

### Expo Router Navigation
```tsx
import { useRouter } from "expo-router";
const router = useRouter();
router.push("/(onboarding)/step2");  // Navigate
router.push("/login");               // Root-level route
```

### Conditional Navigation (index.tsx Pattern)
- Use `<Redirect>` component to trigger navigation at app entry
- Check storage flags in `useEffect` before rendering
- Return `null` during loading state to avoid flash

## Common Issues & Solutions

### Image Path Errors
- ❌ `require("../../assets/images/")` (incomplete—missing filename)
- ✅ `require("../../assets/images/logo.png")`
- Always include the actual image filename

### Expo Start Issues
- If `npx expo start` fails with exit code 1, run with `--clear` flag to reset cache
- Clear `node_modules` and reinstall if dependencies corrupted: `rm -r node_modules; npm install`

### Layout/Navigation Not Showing
- Verify `_layout.tsx` exists in route group
- Check `Stack` import from `expo-router`, not `@react-navigation/native`
- Ensure headerShown config is explicitly set if needed

## File References for Patterns
- **Routing:** `app/_layout.tsx`, `app/(onboarding)/_layout.tsx`
- **Onboarding state logic:** `app/index.tsx`
- **Screen template:** `app/(onboarding)/index.tsx` (styled with Tailwind + StyleSheet)
- **Tailwind config:** `tailwind.config.js`
- **App metadata:** `app.json` (icons, splash, permissions)
