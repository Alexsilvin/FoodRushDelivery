# 🍕 Food Rush Delivery - Driver Mobile App

A comprehensive React Native mobile application for delivery drivers, featuring real-time Google Maps integration, route optimization, and complete delivery management system.

## 📱 Features

### 🔐 Authentication System

- **Login/Register**: Secure driver authentication
- **Password Recovery**: Forgot password functionality
- **Demo Credentials**: `driver@demo.com` / `demo123`

### 🗺️ Google Maps Integration

- **Real-time Location**: GPS tracking with live location updates
- **Interactive Markers**: Color-coded delivery status indicators
- **Route Optimization**: Multiple route algorithms (Optimal, Shortest, Fastest)
- **Turn-by-turn Navigation**: Direct integration with device navigation apps
- **Traffic Overlay**: Real-time traffic information

### 📊 Dashboard

- **Active Deliveries**: Live delivery cards with customer info
- **Search & Filter**: Find deliveries by customer, restaurant, or location
- **Status Management**: Track delivery progress through multiple stages
- **Earnings Tracking**: Real-time payment and earnings display

### 💬 Communication System

- **Customer Chat**: Real-time messaging with delivery customers
- **Search Conversations**: Find specific chat threads quickly
- **Call Integration**: Direct calling functionality
- **Message History**: Complete conversation tracking

### 🚗 Delivery Management

- **Detailed Delivery View**: Complete order information and customer details
- **Status Updates**: Mark deliveries as picked up, en route, or delivered
- **Customer Information**: Contact details and delivery instructions
- **Payment Tracking**: Order totals and payment methods

### 👤 Profile Management

- **Driver Profile**: Personal information and vehicle details
- **Settings**: App preferences and configurations
- **Statistics**: Delivery performance metrics

## 🛠️ Technology Stack

- **Framework**: React Native with Expo SDK 53
- **Language**: TypeScript
- **Navigation**: React Navigation 7
- **Maps**: react-native-maps with Google Maps
- **Location**: expo-location
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **UI Components**: Custom styled components with Ionicons
- **Authentication**: expo-secure-store for token management

## 📋 Prerequisites

Before running this application, make sure you have:

- Node.js (v16 or higher)
- npm or yarn package manager
- Expo CLI (`npm install -g @expo/cli`)
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Physical device or emulator for testing

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Alexsilvin/FoodRushDelivery.git
cd FoodRushDelivery
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Location Permissions

The app requires location permissions for map functionality. These are already configured in `app.json`:

**iOS**: Location permission descriptions are included
**Android**: Fine and coarse location permissions are set

### 4. Start the Development Server

```bash
npm start
# or
expo start
```

### 5. Run on Device/Emulator

- **Android**: Press `a` in the terminal or scan QR code with Expo Go app
- **iOS**: Press `i` in the terminal or scan QR code with Expo Go app
- **Web**: Press `w` for web browser (limited functionality)

## 📱 App Structure

```
src/
├── components/
│   └── LoadingScreen.tsx          # Loading screen component
├── contexts/
│   └── AuthContext.tsx            # Authentication context and state
├── navigation/
│   ├── AuthStack.tsx              # Authentication navigation stack
│   └── MainStack.tsx              # Main app navigation with tabs
├── screens/
│   ├── auth/
│   │   ├── LoginScreen.tsx        # Login screen
│   │   ├── RegisterScreen.tsx     # Registration screen
│   │   └── ForgotPasswordScreen.tsx # Password recovery
│   └── main/
│       ├── DashboardScreen.tsx    # Main dashboard with deliveries
│       ├── MapScreen.tsx          # Google Maps with navigation
│       ├── ChatScreen.tsx         # Customer communication
│       ├── DeliveriesScreen.tsx   # Delivery history
│       ├── DeliveryDetailsScreen.tsx # Detailed delivery view
│       └── ProfileScreen.tsx      # Driver profile
assets/
├── dashbackground.png             # Dashboard background image
├── pattern1.png                   # Chat background pattern
├── icon.png                       # App icon
└── splash-icon.png                # Splash screen icon
```

## 🎨 UI/UX Features

### Color Scheme

- **Primary Blue**: `#1E40AF` - Navigation, buttons, and highlights
- **Success Green**: `#10B981` - Completed deliveries and success states
- **Warning Yellow**: `#FCD34D` - Pending deliveries and alerts
- **Background**: `#F9FAFB` - Light gray background
- **Text**: `#111827` - Primary text color

### Design Elements

- **Card-based Layout**: Clean, modern card designs
- **Smooth Animations**: Animated transitions and interactions
- **Responsive Design**: Optimized for various screen sizes
- **Intuitive Icons**: Ionicons for consistent iconography

## 🗺️ Map Features

### Marker System

- **🔵 Blue**: Accepted deliveries
- **🟡 Yellow**: Pending deliveries
- **🟢 Green**: Picked up orders
- **⚫ Gray**: Completed deliveries

### Route Options

1. **Optimal Route**: Best balance of time and distance
2. **Shortest Distance**: Minimum total distance
3. **Fastest Time**: Quickest delivery time

### Navigation Integration

- Tap any delivery marker to view details
- Press "Navigate" to open device's default map app
- Real-time route visualization with polylines

## 💬 Chat System

### Features

- Real-time messaging with customers
- Search functionality for finding conversations
- Avatar generation based on customer names
- Message timestamps and read status
- Pattern background for visual appeal

### Message Types

- Driver messages (blue bubbles, right-aligned)
- Customer messages (white bubbles, left-aligned)
- Timestamp display for all messages

## 🔒 Security Features

- Secure token storage using expo-secure-store
- Form validation for authentication
- Password requirements and validation
- Secure API communication patterns

## 🧪 Testing

### Demo Data

The app includes comprehensive mock data for testing:

- Sample delivery locations in New York City
- Mock customer conversations
- Realistic delivery scenarios

### Test Credentials

- **Email**: `driver@demo.com`
- **Password**: `demo123`

## 📦 Dependencies

### Core Dependencies

```json
{
  "@expo/vector-icons": "^14.1.0",
  "@react-navigation/bottom-tabs": "^7.4.5",
  "@react-navigation/native": "^7.1.17",
  "@react-navigation/stack": "^7.4.5",
  "expo": "~53.0.20",
  "expo-location": "^18.1.6",
  "expo-secure-store": "^14.2.3",
  "react": "19.0.0",
  "react-native": "0.79.5",
  "react-native-maps": "^1.18.0",
  "react-native-safe-area-context": "^5.4.0",
  "react-native-screens": "^4.11.1"
}
```

## 🚀 Deployment

### Build for Production

#### Android APK

```bash
expo build:android
```

#### iOS IPA

```bash
expo build:ios
```

#### Expo Application Services (EAS)

```bash
npm install -g @expo/eas-cli
eas build --platform android
eas build --platform ios
```

## 📈 Future Enhancements

### Planned Features

- [ ] Real-time order tracking
- [ ] Push notifications for new deliveries
- [ ] Photo capture for delivery confirmation
- [ ] Offline mode support
- [ ] Performance analytics dashboard
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Voice navigation commands

### API Integration

- [ ] Backend API integration for real data
- [ ] Real-time WebSocket connections
- [ ] Google Directions API for accurate routing
- [ ] Payment processing integration
- [ ] Customer feedback system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Alex Silvin** - [@Alexsilvin](https://github.com/Alexsilvin)

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

## 🙏 Acknowledgments

- React Native community for excellent documentation
- Expo team for the amazing development platform
- Google Maps for reliable mapping services
- Ionicons for beautiful iconography

---

**Made with ❤️ for food delivery drivers everywhere**

> This app represents a complete solution for delivery drivers, combining modern mobile development practices with practical functionality for real-world delivery operations.
