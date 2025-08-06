import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CallContextType {
  isCallActive: boolean;
  customerName: string;
  callType: 'voice' | 'video';
  startCall: (customerName: string, callType: 'voice' | 'video') => void;
  endCall: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

interface CallProviderProps {
  children: ReactNode;
}

export const CallProvider: React.FC<CallProviderProps> = ({ children }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');

  const startCall = (name: string, type: 'voice' | 'video') => {
    setCustomerName(name);
    setCallType(type);
    setIsCallActive(true);
  };

  const endCall = () => {
    setIsCallActive(false);
    setCustomerName('');
    setCallType('voice');
  };

  const value: CallContextType = {
    isCallActive,
    customerName,
    callType,
    startCall,
    endCall,
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = (): CallContextType => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
