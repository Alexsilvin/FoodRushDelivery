import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageSelector() {
  const { theme } = useTheme();
  const { currentLanguage, changeLanguage, t, availableLanguages } = useLanguage();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  
  // Animation values
  const modalScale = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  useEffect(() => {
    if (isModalVisible) {
      // Animate modal appearance
      Animated.parallel([
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(modalScale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate modal disappearance
      Animated.parallel([
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: Dimensions.get('window').height,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(modalScale, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isModalVisible, modalOpacity, modalScale, slideAnim]);

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === currentLanguage) {
      setIsModalVisible(false);
      return;
    }

    setIsChanging(true);
    try {
      await changeLanguage(languageCode as any);
      setIsModalVisible(false);
      Alert.alert(
        t('success'),
        'Language changed successfully', // This will still be in English until next app restart
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        t('error'),
        'Failed to change language',
        [{ text: 'OK' }]
      );
    } finally {
      setIsChanging(false);
    }
  };

  const currentLanguageInfo = availableLanguages.find(lang => lang.code === currentLanguage);

  return (
    <View>
      <TouchableOpacity
        style={[styles.languageSelector, { backgroundColor: theme.colors.card }]}
        onPress={() => setIsModalVisible(true)}
      >
        <View style={styles.languageSelectorContent}>
          <View style={styles.languageInfo}>
            <Ionicons name="language-outline" size={24} color={theme.colors.primary} />
            <View style={styles.languageText}>
              <Text style={[styles.languageLabel, { color: theme.colors.text }]}>
                {t('language')}
              </Text>
              <Text style={[styles.languageValue, { color: theme.colors.textSecondary }]}>
                {currentLanguageInfo?.nativeName || 'English'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="none"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <Animated.View 
          style={[
            styles.modalOverlay,
            {
              opacity: modalOpacity,
            }
          ]}
        >
          <BlurView intensity={20} tint={theme.isDark ? "dark" : "light"} style={styles.blurOverlay}>
            <TouchableOpacity 
              style={styles.dismissArea} 
              activeOpacity={1}
              onPress={() => setIsModalVisible(false)}
            />
            
            <Animated.View 
              style={[
                styles.modalContent, 
                { 
                  backgroundColor: theme.isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  transform: [
                    { translateY: slideAnim },
                    { scale: modalScale }
                  ]
                }
              ]}
            >
              <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                  {t('selectLanguage')}
                </Text>
                <TouchableOpacity
                  onPress={() => setIsModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.languageList}>
              {availableLanguages.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageOption,
                    { borderBottomColor: theme.colors.border },
                    currentLanguage === language.code && {
                      backgroundColor: theme.colors.primary + '20',
                    },
                  ]}
                  onPress={() => handleLanguageChange(language.code)}
                  disabled={isChanging}
                >
                  <View style={styles.languageOptionContent}>
                    <View>
                      <Text style={[styles.languageName, { color: theme.colors.text }]}>
                        {language.nativeName}
                      </Text>
                      <Text style={[styles.languageSubname, { color: theme.colors.textSecondary }]}>
                        {language.name}
                      </Text>
                    </View>
                    {currentLanguage === language.code && (
                      <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            </Animated.View>
          </BlurView>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  languageSelector: {
    borderRadius: 12,
    marginHorizontal: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  languageSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  languageText: {
    marginLeft: 16,
    flex: 1,
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  languageValue: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  blurOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  modalContent: {
    width: '100%',
    maxHeight: '70%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  languageList: {
    maxHeight: 400,
  },
  languageOption: {
    borderBottomWidth: 1,
  },
  languageOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  languageSubname: {
    fontSize: 14,
  },
});
