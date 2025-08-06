import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

interface CallScreenProps {
  customerName: string;
  callType: 'voice' | 'video';
  onEndCall: () => void;
}

export default function CallScreen({ customerName, callType, onEndCall }: CallScreenProps) {
  const { theme } = useTheme();
  const [callDuration, setCallDuration] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);

  useEffect(() => {
    // Simulate call connection after 2 seconds
    const connectTimer = setTimeout(() => {
      setIsCallActive(true);
    }, 2000);

    return () => clearTimeout(connectTimer);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallActive]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    Alert.alert(
      'End Call',
      'Are you sure you want to end this call?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'End Call', style: 'destructive', onPress: onEndCall }
      ]
    );
  };

  const handleMute = () => {
    Alert.alert('Mute', 'Microphone muted');
  };

  const handleSpeaker = () => {
    Alert.alert('Speaker', 'Speaker toggled');
  };

  return (
    <>
      <StatusBar 
        barStyle="light-content"
        backgroundColor="#000000"
        translucent={false}
        hidden={false}
      />
      <View style={[styles.container, { backgroundColor: theme.isDark ? '#1a1a1a' : '#2a2a2a' }]}>
        
        {/* Call Status */}
        <View style={styles.callInfo}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.avatarText}>
              {customerName.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          
          <Text style={styles.customerName}>{customerName}</Text>
          
          <Text style={styles.callStatus}>
            {isCallActive ? formatDuration(callDuration) : 'Connecting...'}
          </Text>
          
          <Text style={styles.callType}>
            {callType === 'video' ? 'Video Call' : 'Voice Call'}
          </Text>
        </View>

        {/* Call Controls */}
        <View style={styles.controls}>
          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={handleMute}
          >
            <Ionicons name="mic-off" size={30} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.controlButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            onPress={handleSpeaker}
          >
            <Ionicons name="volume-high" size={30} color="#FFFFFF" />
          </TouchableOpacity>

          {callType === 'video' && (
            <TouchableOpacity 
              style={[styles.controlButton, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
            >
              <Ionicons name="videocam" size={30} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.controlButton, styles.endCallButton]}
            onPress={handleEndCall}
          >
            <Ionicons name="call" size={30} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
      </View>
    </>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  callInfo: {
    alignItems: 'center',
    marginTop: 80,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  customerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  callStatus: {
    fontSize: 18,
    color: '#CCCCCC',
    marginBottom: 5,
  },
  callType: {
    fontSize: 16,
    color: '#999999',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '80%',
    marginBottom: 40,
  },
  controlButton: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  endCallButton: {
    backgroundColor: '#FF3B30',
    transform: [{ rotate: '135deg' }],
  },
});
