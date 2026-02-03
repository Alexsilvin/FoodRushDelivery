import React from 'react';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Restaurant } from '../../types/api';

interface RestaurantMarkersProps {
  restaurants: Restaurant[];
  onRestaurantPress: (restaurant: Restaurant) => void;
}

const RestaurantMarkers = React.memo<RestaurantMarkersProps>(({ restaurants, onRestaurantPress }) => {
  return (
    <>
      {restaurants.map((restaurant) => {
        if (!restaurant.lat || !restaurant.lng) return null;

        const markerColor = restaurant.isActive ? '#10B981' : '#6B7280';

        return (
          <Marker
            key={restaurant.id}
            coordinate={{ latitude: restaurant.lat, longitude: restaurant.lng }}
            title={restaurant.name}
            description={restaurant.address}
            onPress={() => onRestaurantPress(restaurant)}
          >
            <Ionicons name="restaurant" size={36} color={markerColor} />
          </Marker>
        );
      })}
    </>
  );
});

RestaurantMarkers.displayName = 'RestaurantMarkers';

export default RestaurantMarkers;
