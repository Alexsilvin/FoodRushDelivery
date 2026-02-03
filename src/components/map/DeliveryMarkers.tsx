import React from 'react';
import { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

interface DeliveryLocation {
  id: string;
  customerName: string;
  address: string;
  lat: number;
  lng: number;
  status: 'pending' | 'accepted' | 'picked_up' | 'delivered';
  distance: string;
  estimatedTime: string;
  restaurant: string;
  payment: string;
}

interface DeliveryMarkersProps {
  deliveries: DeliveryLocation[];
  onDeliveryPress: (delivery: DeliveryLocation) => void;
}

const DeliveryMarkers = React.memo<DeliveryMarkersProps>(({ deliveries, onDeliveryPress }) => {
  return (
    <>
      {deliveries.map((delivery) => {
        if (!delivery.lat || !delivery.lng) return null;

        const getMarkerColor = () => {
          switch (delivery.status) {
            case 'pending':
              return '#F59E0B'; // Amber
            case 'accepted':
              return '#3B82F6'; // Blue
            case 'picked_up':
              return '#10B981'; // Green
            case 'delivered':
              return '#6B7280'; // Gray
            default:
              return '#F59E0B';
          }
        };

        return (
          <Marker
            key={delivery.id}
            coordinate={{ latitude: delivery.lat, longitude: delivery.lng }}
            title={delivery.customerName}
            description={delivery.address}
            onPress={() => onDeliveryPress(delivery)}
            pinColor={getMarkerColor()}
          >
            <Ionicons name="location" size={40} color={getMarkerColor()} />
          </Marker>
        );
      })}
    </>
  );
});

DeliveryMarkers.displayName = 'DeliveryMarkers';

export default DeliveryMarkers;
