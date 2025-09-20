import React from 'react';
import { RouteProp } from '@react-navigation/native';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

export default function WaitingScreen(  { route}: any ) {
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
    </View>
  );
}

const styles = StyleSheet.create({
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
