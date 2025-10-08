import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

export default function RejectedScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <LinearGradient
      colors={theme.isDark
        ? [theme.colors.background, theme.colors.surface, theme.colors.error + '40']
        : ['#2a3441', '#ff6b00', '#ff0000']}
      style={styles.container}
    >
      <View style={styles.content}>
        <Image
          source={require('../../../assets/driver.png')}
          style={styles.image}
          resizeMode="contain"
          alt="Driver Rejected"
        />
        <Text style={[styles.title, { color: theme.colors.error }]}>Account Rejected</Text>
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>Your driver account has been rejected. Please contact support for more information or to appeal the decision.</Text>
        <TouchableOpacity
          style={styles.goBackButton}
          onPress={() => navigation.replace('Login')}
        >
          <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 16 }}>
            {t('goBack') || 'Go Back'}
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
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
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  image: {
    width: 120,
    height: 120,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
  },
});
