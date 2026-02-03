# 🎨 Design System & Style Guide

## Color Palette

### Primary Colors
```
Primary Blue:      #3B82F6
Dark Blue:         #1E40AF
Light Blue:        #60A5FA
Sky Blue:          #93C5FD
```

### Status Colors
```
Success:           #10B981
Warning:           #F59E0B
Error:             #EF4444
Info:              #3B82F6
```

### Neutral Colors
```
Dark BG 1:         #0f172a
Dark BG 2:         #1e293b
Dark BG 3:         #1a3a52
Light Text:        #FFFFFF
Dark Text:         #1F2937
Secondary Text:    #6B7280
```

### Glass Colors (RGBA)
```
Glass Light:       rgba(255, 255, 255, 0.1)
Glass Medium:      rgba(255, 255, 255, 0.15)
Glass Strong:      rgba(255, 255, 255, 0.2)
Border Light:      rgba(255, 255, 255, 0.15)
Border Medium:     rgba(255, 255, 255, 0.2)
Border Strong:     rgba(255, 255, 255, 0.3)
```

---

## Typography System

### Font Sizes
```
Display:           32px, bold
H1:                28px, bold
H2:                24px, bold
H3:                20px, bold
Title:             18px, bold
Subtitle:          16px, 600
Body:              14px, 400
Small:             12px, 400
Caption:           10px, 400
```

### Font Weights
```
Bold:              700
SemiBold:          600
Medium:            500
Regular:           400
Light:             300
```

---

## Spacing Scale

```
2xs:               2px
xs:                4px
sm:                8px
md:                12px
lg:                16px
xl:                20px
2xl:               24px
3xl:               32px
4xl:               40px
5xl:               48px
```

### Application
```
Padding (Cards):   16px (lg)
Margin (Sections): 20px (xl)
Gap (Items):       12px (md)
Border Radius:     12px (default)
```

---

## Radius Scale

```
xs:                4px (small elements)
sm:                8px (buttons, inputs)
md:                12px (cards, modals)
lg:                16px (large sections)
xl:                20px (floating elements)
2xl:               24px (tab bar)
full:              9999px (circles)
```

---

## Shadow System

### Subtle (Cards)
```tsx
shadowColor: '#000'
shadowOffset: { width: 0, height: 1 }
shadowOpacity: 0.1
shadowRadius: 4
elevation: 2
```

### Medium (Floating)
```tsx
shadowColor: '#000'
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.15
shadowRadius: 8
elevation: 8
```

### Strong (Primary Actions)
```tsx
shadowColor: '#3B82F6'
shadowOffset: { width: 0, height: 8 }
shadowOpacity: 0.3
shadowRadius: 16
elevation: 15
```

### Glow (Emphasis)
```tsx
shadowColor: '#3B82F6'
shadowOffset: { width: 0, height: 0 }
shadowOpacity: 0.4
shadowRadius: 12
elevation: 12
```

---

## Gradient System

### Primary Gradient
```tsx
colors={['#3B82F6', '#1E40AF']}
start={{ x: 0, y: 0 }}
end={{ x: 1, y: 1 }}
```

### Glass Gradient
```tsx
colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.08)']}
start={{ x: 0, y: 0 }}
end={{ x: 1, y: 1 }}
```

### Success Gradient
```tsx
colors={['#10B981', '#059669']}
start={{ x: 0, y: 0 }}
end={{ x: 1, y: 1 }}
```

### Warning Gradient
```tsx
colors={['#F59E0B', '#D97706']}
start={{ x: 0, y: 0 }}
end={{ x: 1, y: 1 }}
```

### Error Gradient
```tsx
colors={['#EF4444', '#DC2626']}
start={{ x: 0, y: 0 }}
end={{ x: 1, y: 1 }}
```

### Dark Overlay
```tsx
colors={['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.1)']}
start={{ x: 0, y: 0 }}
end={{ x: 1, y: 1 }}
```

---

## Component Library

### Button States

#### Primary Button
```tsx
// Default
backgroundColor: '#3B82F6'
height: 56px
borderRadius: 12px

// Hover/Pressed
opacity: 0.8
transform: scale(0.95)

// Disabled
opacity: 0.5
pointerEvents: 'none'
```

#### Secondary Button
```tsx
backgroundColor: 'rgba(255, 255, 255, 0.1)'
borderWidth: 1
borderColor: 'rgba(255, 255, 255, 0.2)'
height: 56px
borderRadius: 12px
```

#### Ghost Button
```tsx
backgroundColor: 'transparent'
borderWidth: 1
borderColor: '#3B82F6'
color: '#3B82F6'
height: 56px
borderRadius: 12px
```

### Input Fields

#### Glass Input
```tsx
backgroundColor: 'rgba(255, 255, 255, 0.1)'
borderWidth: 1
borderColor: 'rgba(255, 255, 255, 0.2)'
borderRadius: 12px
height: 56px
paddingHorizontal: 16px
color: '#FFFFFF'
placeholderTextColor: 'rgba(255, 255, 255, 0.5)'
```

#### Focus State
```tsx
borderColor: 'rgba(255, 255, 255, 0.4)'
backgroundColor: 'rgba(255, 255, 255, 0.15)'
```

### Cards

#### Glass Card
```tsx
backgroundColor: 'rgba(255, 255, 255, 0.1)'
borderWidth: 1
borderColor: 'rgba(255, 255, 255, 0.2)'
borderRadius: 16px
padding: 16px
backdropFilter: 'blur(10px)'
```

#### Gradient Card
```tsx
// Use LinearGradient
colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
borderRadius: 16px
padding: 16px
borderWidth: 1
borderColor: 'rgba(255, 255, 255, 0.15)'
```

---

## Breakpoints (Responsive)

```
Mobile:            < 600px
Tablet:            600px - 1024px
Desktop:           > 1024px
```

### Safe Area
```
Horizontal Padding:    16px - 24px
Top Padding:          20px - 60px (status bar)
Bottom Padding:       20px - 34px (safe area)
```

---

## Animations

### Fade In
```tsx
duration: 300ms
useNativeDriver: true
```

### Scale
```tsx
duration: 200ms
tension: 100
friction: 10
useNativeDriver: true
```

### Slide
```tsx
duration: 300ms
easing: Easing.inOut(Easing.cubic)
useNativeDriver: true
```

---

## Accessibility

### Contrast Ratios
```
Text on Primary:   7:1 (AAA)
Text on Glass:     5:1 (AA)
Button on Card:    5:1 (AA)
Icons:             4.5:1 (minimum)
```

### Font Sizes
```
Minimum:           12px
Readable:          14px+
Large:             16px+
```

### Touch Targets
```
Minimum:           44x44px
Comfortable:       56x56px
Large:             64x64px
```

---

## Dark Mode

### Colors
```
Background:        #0f172a
Surface:           #1e293b
Card:              #1e293b with border
Text:              #FFFFFF
Text Secondary:    #94a3b8
```

### Glass Effect
```
Light Glass:       rgba(255, 255, 255, 0.1)
Border:            rgba(255, 255, 255, 0.2)
Hover:             rgba(255, 255, 255, 0.15)
```

---

## Light Mode

### Colors
```
Background:        #FFFFFF
Surface:           #F8FAFC
Card:              #FFFFFF with border
Text:              #1F2937
Text Secondary:    #6B7280
```

### Glass Effect
```
Light Glass:       rgba(0, 0, 0, 0.05)
Border:            rgba(0, 0, 0, 0.1)
Hover:             rgba(0, 0, 0, 0.08)
```

---

## Usage Examples

### Complete Screen
```tsx
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

export default function Screen() {
  return (
    <LinearGradient
      colors={['#0f172a', '#1e293b', '#1a3a52']}
      style={{ flex: 1 }}
    >
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff' }}>
          Title
        </Text>
      </View>

      {/* Content Cards */}
      <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 20 }}>
        <BlurView intensity={85}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
            style={{
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.2)',
            }}
          >
            <Text style={{ color: '#fff' }}>Card Content</Text>
          </LinearGradient>
        </BlurView>
      </View>

      {/* Action Button */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        <LinearGradient
          colors={['#3B82F6', '#1E40AF']}
          style={{
            borderRadius: 12,
            height: 56,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#3B82F6',
            shadowOpacity: 0.3,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <TouchableOpacity style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
              Action
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    </LinearGradient>
  );
}
```

---

## Export & Reference

Save this as your design system reference:
- Colors: Use hex codes from this guide
- Typography: Reference font sizes and weights
- Spacing: Use the scale provided
- Shadows: Copy-paste shadow values
- Gradients: Use preset gradients

---

**Version**: 1.0  
**Last Updated**: February 3, 2026 UTC  
**Maintainer**: Design System Team
