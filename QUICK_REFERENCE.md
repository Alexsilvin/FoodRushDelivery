# 🎨 Quick Reference Card

## Colors - Copy & Paste

```
Primary:      #3B82F6
Dark:         #1E40AF
Light:        #60A5FA
Success:      #10B981
Warning:      #F59E0B
Error:        #EF4444
```

---

## Glass Effects - Copy & Paste

### Glass Container
```tsx
backgroundColor: 'rgba(255, 255, 255, 0.1)'
borderColor: 'rgba(255, 255, 255, 0.2)'
borderWidth: 1
borderRadius: 12
backdropFilter: 'blur(10px)'
```

### Strong Glass
```tsx
backgroundColor: 'rgba(255, 255, 255, 0.15)'
borderColor: 'rgba(255, 255, 255, 0.3)'
```

---

## Gradient Button

```tsx
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
  <TouchableOpacity>
    <Text>Button Text</Text>
  </TouchableOpacity>
</LinearGradient>
```

---

## Blur View

```tsx
<BlurView intensity={85}>
  {/* Content */}
</BlurView>
```

---

## Gradient Card

```tsx
<LinearGradient
  colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
  style={{
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  }}
>
  {/* Content */}
</LinearGradient>
```

---

## Shadows

### Subtle
```tsx
shadowColor: '#000'
shadowOffset: { width: 0, height: 1 }
shadowOpacity: 0.1
shadowRadius: 4
elevation: 2
```

### Medium
```tsx
shadowColor: '#000'
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.15
shadowRadius: 8
elevation: 8
```

### Strong
```tsx
shadowColor: '#3B82F6'
shadowOffset: { width: 0, height: 8 }
shadowOpacity: 0.3
shadowRadius: 16
elevation: 15
```

---

## Typography

```
H1: fontSize: 28, fontWeight: 'bold'
H2: fontSize: 24, fontWeight: 'bold'
H3: fontSize: 20, fontWeight: 'bold'
Body: fontSize: 14, fontWeight: '400'
Small: fontSize: 12, fontWeight: '400'
```

---

## Spacing

```
xs: 4px
sm: 8px
md: 12px
lg: 16px
xl: 20px
2xl: 24px
3xl: 32px
```

---

## Border Radius

```
sm: 8px
md: 12px (default)
lg: 16px
xl: 20px
full: 9999px
```

---

## Files to Reference

- **Colors**: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md)
- **Code**: [UI_SNIPPETS.md](UI_SNIPPETS.md)
- **Examples**: [LoginScreen.tsx](src/screens/auth/LoginScreen.tsx)
- **Guide**: [UI_ENHANCEMENTS.md](UI_ENHANCEMENTS.md)

---

## Imports

```tsx
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Animated } from 'react-native';
```

---

## Quick Tips

1. **Always use BlurView + LinearGradient together** for glass effect
2. **Blur intensity: 85** is standard
3. **Border radius: 12px** for cards, 16px for large elements
4. **Shadows use elevation for Android, shadow* for iOS**
5. **Test on both platforms**

---

**Last Updated**: February 3, 2026
