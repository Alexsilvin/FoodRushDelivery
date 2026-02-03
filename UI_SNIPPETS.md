# UI/UX Visual Reference & Code Snippets

## 🎨 Color System

### Primary Colors
```
Primary Blue:    #3B82F6
Dark Blue:       #1E40AF
Light Blue:      #60A5FA
Sky Blue:        #93C5FD
```

### Status Colors
```
Success Green:   #10B981
Warning Amber:   #F59E0B
Error Red:       #EF4444
Info Blue:       #3B82F6
```

### Backgrounds
```
Dark BG 1:       #0f172a
Dark BG 2:       #1e293b
Dark BG 3:       #1a3a52
Glass Light:     rgba(255, 255, 255, 0.1)
Glass Medium:    rgba(255, 255, 255, 0.15)
Glass Strong:    rgba(255, 255, 255, 0.2)
```

---

## 🎬 Component Patterns

### 1. Glassmorphic Card
```tsx
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

<BlurView intensity={85}>
  <LinearGradient
    colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={{
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    }}
  >
    <Text>Your content here</Text>
  </LinearGradient>
</BlurView>
```

### 2. Gradient Button
```tsx
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={['#3B82F6', '#1E40AF']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={{
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  }}
>
  <TouchableOpacity style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
      Click Me
    </Text>
  </TouchableOpacity>
</LinearGradient>
```

### 3. Glass Input Field
```tsx
<View
  style={{
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    marginBottom: 16,
  }}
>
  <Ionicons
    name="mail-outline"
    size={20}
    color="rgba(255, 255, 255, 0.6)"
  />
  <TextInput
    style={{
      flex: 1,
      height: 56,
      marginLeft: 12,
      color: '#fff',
      fontSize: 16,
    }}
    placeholder="Enter email"
    placeholderTextColor="rgba(255, 255, 255, 0.5)"
  />
</View>
```

### 4. Gradient Badge
```tsx
<LinearGradient
  colors={['rgba(59, 130, 246, 0.2)', 'rgba(30, 64, 175, 0.1)']}
  style={{
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
  }}
>
  <Text style={{ color: '#60A5FA', fontWeight: '600' }}>
    New Delivery
  </Text>
</LinearGradient>
```

### 5. Animated Fade-In
```tsx
const fadeIn = useRef(new Animated.Value(0)).current;

useEffect(() => {
  Animated.timing(fadeIn, {
    toValue: 1,
    duration: 800,
    useNativeDriver: true,
  }).start();
}, [fadeIn]);

<Animated.View style={{ opacity: fadeIn }}>
  {/* Your content */}
</Animated.View>
```

---

## 📐 Shadow Presets

### Subtle Shadow (Cards)
```tsx
shadowColor: '#000'
shadowOffset: { width: 0, height: 1 }
shadowOpacity: 0.1
shadowRadius: 4
elevation: 2
```

### Medium Shadow (Floating)
```tsx
shadowColor: '#000'
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.15
shadowRadius: 8
elevation: 8
```

### Strong Shadow (Emphasis)
```tsx
shadowColor: '#3B82F6'
shadowOffset: { width: 0, height: 8 }
shadowOpacity: 0.3
shadowRadius: 16
elevation: 15
```

---

## 🔄 Spacing System

```
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 20px
2xl: 24px
3xl: 32px
4xl: 40px
```

---

## 📏 Typography Scale

```
Display: 32px, bold
Heading 1: 28px, bold
Heading 2: 24px, bold
Heading 3: 20px, bold
Title: 18px, bold
Subtitle: 16px, semibold
Body: 14px, regular
Small: 12px, regular
Tiny: 10px, regular
```

---

## 🎯 Common Screen Patterns

### Top Header Gradient
```tsx
<LinearGradient
  colors={['#0f172a', '#1e293b', '#1a3a52']}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={{ padding: 20, paddingTop: 40 }}
>
  <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>
    Screen Title
  </Text>
  <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 14 }}>
    Subtitle
  </Text>
</LinearGradient>
```

### Card List
```tsx
<FlatList
  data={items}
  renderItem={({ item }) => (
    <LinearGradient
      colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
      style={{
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
    >
      <Text style={{ color: '#fff', fontWeight: '600' }}>
        {item.title}
      </Text>
      <Text style={{ color: 'rgba(255, 255, 255, 0.7)', marginTop: 8 }}>
        {item.description}
      </Text>
    </LinearGradient>
  )}
/>
```

### Action Button Bar
```tsx
<BlurView intensity={85} style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
  <LinearGradient
    colors={['rgba(30, 41, 59, 0.5)', 'rgba(30, 41, 59, 0.3)']}
    style={{
      flexDirection: 'row',
      padding: 16,
      gap: 12,
    }}
  >
    <LinearGradient
      colors={['#3B82F6', '#1E40AF']}
      style={{ flex: 1, borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center' }}
    >
      <TouchableOpacity style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Accept</Text>
      </TouchableOpacity>
    </LinearGradient>
    <LinearGradient
      colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
      style={{ flex: 1, borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center' }}
    >
      <TouchableOpacity style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#60A5FA', fontWeight: 'bold' }}>Decline</Text>
      </TouchableOpacity>
    </LinearGradient>
  </LinearGradient>
</BlurView>
```

---

## 🎨 Gradient Presets (Copy-Paste)

### Premium Blue Gradient
```tsx
colors={['#3B82F6', '#1E40AF']}
start={{ x: 0, y: 0 }}
end={{ x: 1, y: 1 }}
```

### Frosted Glass
```tsx
colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.08)']}
start={{ x: 0, y: 0 }}
end={{ x: 1, y: 1 }}
```

### Dark Overlay
```tsx
colors={['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.1)']}
start={{ x: 0, y: 0 }}
end={{ x: 1, y: 1 }}
```

### Green Success
```tsx
colors={['#10B981', '#059669']}
start={{ x: 0, y: 0 }}
end={{ x: 1, y: 1 }}
```

### Amber Warning
```tsx
colors={['#F59E0B', '#D97706']}
start={{ x: 0, y: 0 }}
end={{ x: 1, y: 1 }}
```

### Red Error
```tsx
colors={['#EF4444', '#DC2626']}
start={{ x: 0, y: 0 }}
end={{ x: 1, y: 1 }}
```

---

## 🚀 Quick Implementation Tips

1. **Always add borders with glass effects**
   ```tsx
   borderWidth: 1,
   borderColor: 'rgba(255, 255, 255, 0.2)',
   ```

2. **Combine blur + gradient for best effect**
   ```tsx
   <BlurView intensity={85}>
     <LinearGradient colors={...}>
   ```

3. **Use proper shadows for elevation**
   ```tsx
   shadowColor: '#3B82F6',
   shadowOpacity: 0.3,
   elevation: 8,
   ```

4. **Keep text contrast readable**
   ```tsx
   // On glass background
   color: '#fff' // or #60A5FA for secondary
   ```

5. **Test on both light and dark modes**
   ```tsx
   colors={theme.isDark ? darkColors : lightColors}
   ```

---

*Last Updated: February 3, 2026 UTC*
