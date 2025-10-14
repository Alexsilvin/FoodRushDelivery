# Tab Navigation Language Switch Fix

## Problem
When switching from English to French (or any language), the navigation tab labels were not updating to show the translated text.

## Root Cause
The `FloatingTabBar` component had a bug in the `getTabLabel()` function:

```typescript
// ❌ WRONG - Always reading from the currently focused route
const getTabLabel = (routeName: string): string => {
  const descriptor = descriptors[state.routes[state.index].key];  // Bug here!
  const label = descriptor.options.tabBarLabel;
  
  if (typeof label === 'string') {
    return label;
  }
  
  return routeName;
};
```

The bug was that it was always reading `descriptors[state.routes[state.index].key]` which is the **currently focused tab's descriptor**, not the descriptor for the tab being rendered.

## Solution
Fixed the function to read the correct descriptor for each tab:

```typescript
// ✅ CORRECT - Reading from the specific route's descriptor
const getTabLabel = (routeKey: string): string => {
  const descriptor = descriptors[routeKey];  // Fixed!
  const label = descriptor.options.tabBarLabel || descriptor.options.title;
  
  if (typeof label === 'string') {
    return label;
  }
  
  // Handle function labels
  if (typeof label === 'function') {
    const result = label({ focused: false, color: '', position: 'beside-icon', children: '' });
    return String(result || descriptor.route.name);
  }
  
  return descriptor.route.name;
};
```

And updated the call site:

```typescript
// Changed from:
const label = getTabLabel(route.name);

// To:
const label = getTabLabel(route.key);  // Pass route.key instead of route.name
```

## How It Works

1. **MainStack.tsx** defines tabs with translated titles:
   ```typescript
   function TabNavigator() {
     const { t } = useLanguage();  // Gets translation function
     
     return (
       <Tab.Navigator>
         <Tab.Screen 
           name="Dashboard" 
           component={DashboardScreen}
           options={{ title: t('dashboard') }}  // Translated title
         />
         <Tab.Screen 
           name="Map" 
           component={MapScreen}
           options={{ title: t('map') }}  // Translated title
         />
         <Tab.Screen 
           name="Profile" 
           component={ProfileScreen}
           options={{ title: t('profile') }}  // Translated title
         />
       </Tab.Navigator>
     );
   }
   ```

2. **FloatingTabBar** now correctly reads the translated title for each tab
3. When language changes, `TabNavigator` re-renders with new `t()` values
4. The tab labels automatically update

## Files Modified
- `src/components/FloatingTabBar.tsx` - Fixed `getTabLabel()` function

## Testing
After restarting the app:
1. Navigate to Profile → Settings
2. Change language from English to French
3. The tab labels should immediately update:
   - Dashboard → Tableau de bord
   - Map → Carte
   - Profile → Profil

## Expected Result
✅ Tab labels now update immediately when language is changed
✅ All three tabs show translated text
✅ No app restart required
