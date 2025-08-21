import React from 'react';
import { Modal, StyleSheet } from 'react-native';
import { useCall } from '../contexts/CallContext';
import CallScreen from '../screens/main/CallScreen';

export default function GlobalCallOverlay() {
  const { isCallActive, customerName, callType, endCall } = useCall();

  if (!isCallActive) {
    return null;
  }

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isCallActive}
      onRequestClose={endCall}
      statusBarTranslucent={true}
    >
      <CallScreen 
        customerName={customerName}
        callType={callType}
        onEndCall={endCall}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
});
