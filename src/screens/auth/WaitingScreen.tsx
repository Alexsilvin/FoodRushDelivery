import React from 'react';
import { RouteProp } from '@react-navigation/native';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

import { TouchableOpacity } from 'react-native';

export default function WaitingScreen({ route, navigation }: any) {
    const { theme } = useTheme();
    const { t } = useLanguage();
    const {reason } = route.params;

     return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.title, { color: theme.colors.text }]}> 
        {t('accountPending') || 'Account Pending'}
      </Text>
      <Text style={[styles.reason, { color: theme.colors.textSecondary }]}> 
        {reason || t('accountNotActive')}
      </Text>
      <TouchableOpacity
        style={styles.goBackButton}
        onPress={() => navigation.replace('Login')}
      >
        <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 16 }}>
          {t('goBack') || 'Go Back'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  goBackButton: {
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ff6b00',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
  },
  reason: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
});
