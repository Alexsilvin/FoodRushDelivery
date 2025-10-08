# Repository Guidelines

## Project Structure & Module Organization

Source code is organized in the `src/` directory with clear separation of concerns:
- `src/screens/` - UI screens organized by auth and main app sections
- `src/contexts/` - React Context providers for global state management
- `src/services/` - API integration and external service communication
- `src/components/` - Reusable UI components
- `src/navigation/` - React Navigation configuration
- `src/types/` - TypeScript type definitions
- `src/utils/` - Utility functions and data mappers
- `assets/` - Images, icons, and static resources

## Build, Test, and Development Commands

```bash
# Start development server
npm start

# Run on Android device/emulator
npm run android

# Run on iOS device/simulator
npm run ios

# Run in web browser (limited functionality)
npm run web
```

## Coding Style & Naming Conventions

- **Indentation**: 2 spaces (configured in tsconfig.json)
- **File naming**: PascalCase for components (e.g., `DashboardScreen.tsx`)
- **Function/variable naming**: camelCase with descriptive names
- **TypeScript**: Strict mode enabled with path mapping (`@/*` → `./src/*`)
- **Linting**: No ESLint/Prettier configuration currently - follows Expo defaults

## Testing Guidelines

- **Framework**: No testing framework currently configured
- **Test files**: Not implemented yet
- **Running tests**: Testing setup needed for future development
- **Coverage**: No coverage requirements specified

## Commit & Pull Request Guidelines

- **Commit format**: Descriptive messages (examples from repo: "updated dependencies", "design modification for the registration screen")
- **PR process**: Direct commits to master branch currently used
- **Branch naming**: Feature branches recommended for future development

---

# Repository Tour

## 🎯 What This Repository Does

Food Rush Delivery Driver Mobile App is a comprehensive React Native application that enables food delivery drivers to manage their deliveries, navigate to customers, communicate in real-time, and track their earnings. The app provides GPS tracking, Google Maps integration, and complete delivery lifecycle management.

**Key responsibilities:**
- Real-time delivery management and tracking
- GPS navigation with Google Maps integration
- Customer communication and order management
- Driver authentication and profile management

---

## 🏗️ Architecture Overview

### System Context
```
[Driver Mobile App] → [Food Rush Backend API] → [Database]
        ↓                      ↓
[Google Maps API]    [Restaurant Systems]
        ↓
[Device GPS/Location]
```

### Key Components
- **AuthContext** - Manages driver authentication state and API tokens
- **Navigation Stack** - React Navigation with tab and stack navigators
- **API Service Layer** - Centralized backend communication with rider-specific endpoints
- **Map Integration** - Google Maps with real-time tracking and route optimization
- **State Management** - Context-based architecture for theme, language, and call management

### Data Flow
1. Driver authenticates through AuthContext using backend API
2. Dashboard fetches current deliveries from rider API endpoints
3. Map screen integrates with Google Maps for navigation and tracking
4. Real-time location updates sent to backend via rider location API
5. Delivery status updates propagated through API service layer

---

## 📁 Project Structure [Partial Directory Tree]

```
delivery-driver-mobile/
├── src/                           # Main application source code
│   ├── screens/                   # UI screens organized by feature
│   │   ├── auth/                  # Authentication screens
│   │   │   ├── LoginScreen.tsx    # Driver login interface
│   │   │   ├── RegisterScreen.tsx # Driver registration with vehicle info
│   │   │   └── WaitingScreen.tsx  # Pending approval screen
│   │   └── main/                  # Main app screens
│   │       ├── DashboardScreen.tsx # Delivery overview and management
│   │       ├── MapScreen.tsx      # Google Maps with navigation
│   │       ├── ChatScreen.tsx     # Customer communication
│   │       └── ProfileScreen.tsx  # Driver profile management
│   ├── contexts/                  # React Context providers
│   │   ├── AuthContext.tsx        # Authentication state management
│   │   ├── ThemeContext.tsx       # Dark/light theme switching
│   │   └── LanguageContext.tsx    # Internationalization support
│   ├── services/                  # External service integration
│   │   └── api.ts                 # Backend API communication layer
│   ├── navigation/                # React Navigation configuration
│   │   ├── AuthStack.tsx          # Authentication flow navigation
│   │   └── MainStack.tsx          # Main app tab navigation
│   ├── types/                     # TypeScript type definitions
│   │   └── api.ts                 # API response and data types
│   └── utils/                     # Utility functions
│       └── mappers.ts             # Data transformation utilities
├── assets/                        # Static resources
├── app.json                       # Expo configuration
├── eas.json                       # Expo Application Services config
├── package.json                   # Dependencies and scripts
└── tsconfig.json                  # TypeScript configuration
```

### Key Files to Know

| File | Purpose | When You'd Touch It |
|------|---------|---------------------|
| `App.tsx` | Application entry point with context providers | Adding new global contexts |
| `src/services/api.ts` | Backend API integration | Adding new API endpoints |
| `src/contexts/AuthContext.tsx` | Authentication state management | Modifying login/registration flow |
| `src/navigation/MainStack.tsx` | Main app navigation structure | Adding new screens to tab navigation |
| `src/screens/main/DashboardScreen.tsx` | Primary delivery management interface | Updating delivery card UI or functionality |
| `src/screens/main/MapScreen.tsx` | Google Maps integration | Modifying navigation or map features |
| `package.json` | Dependencies and build scripts | Adding new libraries |
| `app.json` | Expo configuration and permissions | Changing app metadata or permissions |
| `tsconfig.json` | TypeScript configuration | Modifying compiler settings or path mapping |

---

## 🔧 Technology Stack

### Core Technologies
- **Language:** TypeScript (5.9.2) - Type safety and better developer experience
- **Framework:** React Native (0.81.4) with Expo SDK (54.0.12) - Cross-platform mobile development
- **Navigation:** React Navigation 7 - Screen navigation and routing
- **Maps:** react-native-maps with Google Maps - Real-time tracking and navigation

### Key Libraries
- **@react-native-async-storage/async-storage** - Local data persistence
- **expo-location** - GPS tracking and location services
- **expo-secure-store** - Secure token storage
- **axios** - HTTP client for API communication
- **react-native-maps-directions** - Route calculation and display
- **expo-notifications** - Push notification support

### Development Tools
- **Expo CLI** - Development server and build tools
- **TypeScript** - Static type checking
- **Metro** - JavaScript bundler with TypeScript support
- **EAS Build** - Cloud-based app building service

---

## 🌐 External Dependencies

### Required Services
- **Food Rush Backend API** - Core delivery and driver management (https://foodrush-be.onrender.com/api/v1)
- **Google Maps API** - Navigation, geocoding, and directions (API key configured)
- **Expo Services** - Push notifications and app distribution

### API Endpoints
- **Authentication:** `/riders/auth/login`, `/riders/auth/register-and-apply`
- **Delivery Management:** `/riders/deliveries/current`, `/riders/deliveries/{id}/accept`
- **Location Tracking:** `/riders/my/location`, `/riders/status`
- **Earnings:** `/riders/earnings`, `/analytics/riders/my/summary`

---

## 🔄 Common Workflows

### Driver Registration & Onboarding
1. Driver completes registration form with personal and vehicle information
2. Document and vehicle photo upload (optional)
3. Backend processes application and sets driver state
4. Driver receives approval notification and can access main app

**Code path:** `RegisterScreen.tsx` → `AuthContext.registerAndApply()` → `riderAuthAPI.registerAndApply()`

### Delivery Acceptance & Navigation
1. Driver views available deliveries on dashboard
2. Selects delivery and calculates route (driver → restaurant → customer)
3. Accepts delivery and enters driving mode
4. Real-time GPS tracking with turn-by-turn navigation
5. Updates delivery status at pickup and completion

**Code path:** `DashboardScreen.tsx` → `MapScreen.tsx` → `riderAPI.acceptDelivery()` → Google Maps integration

### Real-time Location Tracking
1. App requests location permissions on startup
2. Continuous GPS tracking while driver is online
3. Location updates sent to backend every few seconds
4. Route optimization based on current position

**Code path:** `expo-location` → `MapScreen.tsx` → `riderAPI.updateLocation()`

---

## 📈 Performance & Scale

### Performance Considerations
- **Location Updates:** Optimized GPS polling to balance accuracy and battery life
- **Map Rendering:** Efficient marker clustering and route polyline rendering
- **API Caching:** Local storage of delivery data to reduce network requests

### Monitoring
- **Location Accuracy:** GPS coordinate validation and fallback handling
- **API Response Times:** Error handling and retry logic for network requests
- **Battery Usage:** Optimized location services and background processing

---

## 🚨 Things to Be Careful About

### 🔒 Security Considerations
- **API Keys:** Google Maps API key stored in environment variables and app.json
- **Authentication:** JWT tokens stored securely using expo-secure-store
- **Location Data:** GPS coordinates transmitted over HTTPS to backend API

### 📱 Platform-Specific Notes
- **iOS:** Location permissions require usage descriptions in app.json
- **Android:** Fine and coarse location permissions configured
- **Maps:** Google Maps provider used for both platforms (requires API key)

### 🔧 Development Gotchas
- **Expo Managed Workflow:** Some native modules require custom development builds
- **TypeScript Paths:** Path mapping configured for `@/*` imports
- **API Integration:** Backend endpoints use rider-specific routes with authentication headers

*Updated at: 2024-12-19 UTC*