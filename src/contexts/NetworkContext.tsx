import React, { createContext, useContext, useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

interface NetworkContextType {
  isOffline: boolean;
  isConnected: boolean;
}

const NetworkContext = createContext<NetworkContextType>({
  isOffline: false,
  isConnected: true,
});

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

interface NetworkProviderProps {
  children: React.ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected ?? true;
      setIsConnected(connected);
      setIsOffline(!connected);
    });

    // Get initial state
    NetInfo.fetch().then(state => {
      const connected = state.isConnected ?? true;
      setIsConnected(connected);
      setIsOffline(!connected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ isOffline, isConnected }}>
      {children}
    </NetworkContext.Provider>
  );
};