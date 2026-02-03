import React from 'react';
import { Polyline } from 'react-native-maps';

interface RoutePolylineProps {
  coordinates: Array<{ latitude: number; longitude: number }>;
  strokeColor?: string;
  strokeWidth?: number;
}

const RoutePolyline = React.memo<RoutePolylineProps>(({ 
  coordinates, 
  strokeColor = '#3B82F6', 
  strokeWidth = 4 
}) => {
  if (!coordinates || coordinates.length === 0) return null;

  return (
    <Polyline
      coordinates={coordinates}
      strokeColor={strokeColor}
      strokeWidth={strokeWidth}
      lineDashPattern={[1]}
    />
  );
});

RoutePolyline.displayName = 'RoutePolyline';

export default RoutePolyline;
