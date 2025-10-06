import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DeliveryDetailsScreen from '../screens/main/DeliveryDetailsScreen';
import MapScreen from '../screens/main/MapScreen';
import RejectedScreen from '../screens/auth/RejectedScreen';
// ...existing imports...

const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator>
      {/* ...existing screens... */}
      <Stack.Screen
        name="DeliveryDetails"
        component={DeliveryDetailsScreen}
        options={{ title: 'Delivery Details' }}
      />
      <Stack.Screen
        name="Map"
        component={MapScreen}
        options={{ title: 'Map' }}
      />
      <Stack.Screen
        name="Rejected"
        component={RejectedScreen}
        options={{ title: 'Account Rejected' }}
      />
      {/* ...existing screens... */}
    </Stack.Navigator>
  );
}
