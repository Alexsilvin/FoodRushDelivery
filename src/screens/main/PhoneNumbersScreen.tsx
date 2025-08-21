import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';

type PhoneNumber = {
  id: string;
  number: string;
  isPrimary: boolean;
};

export default function PhoneNumbersScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, updateUserPhoneNumbers } = useAuth();
  
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>(() => {
    if (user?.phoneNumbers && user.phoneNumbers.length > 0) {
      return user.phoneNumbers.map(phone => ({
        id: phone.id,
        number: phone.number,
        isPrimary: phone.isPrimary
      }));
    } else if (user?.phoneNumber) {
      return [
        {
          id: '1',
          number: user.phoneNumber,
          isPrimary: true,
        }
      ];
    }
    return [];
  });
  
  const [loading, setLoading] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [isAddingNumber, setIsAddingNumber] = useState(false);

  const handleSave = async () => {
    if (phoneNumbers.length === 0) {
      Alert.alert(t('error'), t('atLeastOnePhone'));
      return;
    }
    
    setLoading(true);
    try {
      const primaryNumber = phoneNumbers.find(p => p.isPrimary)?.number || '';
      const success = await updateUserPhoneNumbers(phoneNumbers, primaryNumber);
      if (success) {
        Alert.alert(t('success'), t('phoneNumbersUpdated'));
        navigation.goBack();
      } else {
        Alert.alert(t('error'), t('updateFailed'));
      }
    } catch (error) {
      console.error('Phone number update error:', error);
      Alert.alert(t('error'), t('somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const validatePhoneNumber = (number: string): boolean => {
    // Basic validation - can be enhanced based on requirements
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(number.trim());
  };

  const addPhoneNumber = () => {
    if (!newPhoneNumber.trim()) {
      Alert.alert(t('error'), t('phoneNumberRequired'));
      return;
    }

    if (!validatePhoneNumber(newPhoneNumber)) {
      Alert.alert(t('error'), t('invalidPhoneNumber'));
      return;
    }

    // Check if the phone number already exists
    if (phoneNumbers.some(p => p.number === newPhoneNumber.trim())) {
      Alert.alert(t('error'), t('phoneNumberAlreadyExists'));
      return;
    }

    const newPhone: PhoneNumber = {
      id: Date.now().toString(),
      number: newPhoneNumber.trim(),
      isPrimary: phoneNumbers.length === 0, // Make primary if it's the first number
    };

    setPhoneNumbers([...phoneNumbers, newPhone]);
    setNewPhoneNumber('');
    setIsAddingNumber(false);
  };

  const removePhoneNumber = (id: string) => {
    const numberToRemove = phoneNumbers.find(p => p.id === id);
    const isPrimary = numberToRemove?.isPrimary || false;
    
    setPhoneNumbers(prevNumbers => {
      const updatedNumbers = prevNumbers.filter(p => p.id !== id);
      
      // If the removed number was primary, set a new primary
      if (isPrimary && updatedNumbers.length > 0) {
        updatedNumbers[0].isPrimary = true;
      }
      
      return updatedNumbers;
    });
  };

  const setPrimaryNumber = (id: string) => {
    setPhoneNumbers(prevNumbers => 
      prevNumbers.map(phone => ({
        ...phone,
        isPrimary: phone.id === id
      }))
    );
  };

  const renderPhoneItem = ({ item }: { item: PhoneNumber }) => (
    <View style={[styles.phoneItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.phoneInfo}>
        <View style={styles.phoneIconContainer}>
          <Ionicons name="call-outline" size={24} color={theme.colors.primary} />
        </View>
        <Text style={[styles.phoneNumber, { color: theme.colors.text }]}>{item.number}</Text>
      </View>
      <View style={styles.phoneActions}>
        {item.isPrimary ? (
          <View style={[styles.primaryBadge, { backgroundColor: theme.colors.primary + '20' }]}>
            <Text style={[styles.primaryText, { color: theme.colors.primary }]}>{t('primary')}</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.setPrimaryButton} 
            onPress={() => setPrimaryNumber(item.id)}
          >
            <Text style={[styles.setPrimaryText, { color: theme.colors.primary }]}>{t('setPrimary')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={() => {
            if (phoneNumbers.length === 1) {
              Alert.alert(t('error'), t('cannotRemoveLastNumber'));
              return;
            }
            removePhoneNumber(item.id);
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {t('phoneNumbers')}
        </Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : (
            <Text style={[styles.saveText, { color: theme.colors.primary }]}>
              {t('save')}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={phoneNumbers}
        renderItem={renderPhoneItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            {t('yourPhoneNumbers')}
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="call-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {t('noPhoneNumbersAdded')}
            </Text>
          </View>
        }
      />

      {isAddingNumber ? (
        <View style={[styles.addPhoneForm, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.formTitle, { color: theme.colors.text }]}>{t('addNewPhoneNumber')}</Text>
          
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            {t('phoneNumber')}
          </Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder={t('enterPhoneNumber')}
              placeholderTextColor={theme.colors.textSecondary}
              value={newPhoneNumber}
              onChangeText={setNewPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.colors.border }]}
              onPress={() => {
                setIsAddingNumber(false);
                setNewPhoneNumber('');
              }}
            >
              <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>
                {t('cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
              onPress={addPhoneNumber}
            >
              <Text style={styles.addText}>{t('add')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.addPhoneButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setIsAddingNumber(true)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
          <Text style={styles.addPhoneText}>{t('addPhoneNumber')}</Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  saveButton: {
    padding: 8,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  phoneItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  phoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  phoneNumber: {
    fontSize: 16,
    fontWeight: '500',
  },
  phoneActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 16,
  },
  primaryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  setPrimaryButton: {
    marginRight: 16,
  },
  setPrimaryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
  },
  addPhoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  addPhoneText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  addPhoneForm: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    borderRadius: 8,
    borderWidth: 1,
    height: 48,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '500',
  },
  addButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  addText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});
