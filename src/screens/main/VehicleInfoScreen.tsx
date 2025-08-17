import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
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
import { Vehicle as ApiVehicle } from '../../types/api';

// Local Vehicle ensures required fields while tolerating optional id from API
type Vehicle = Required<Pick<ApiVehicle, 'name' | 'type'>> & {
  id: string; // force presence in UI list
  default: boolean;
};

export default function VehicleInfoScreen({ navigation }: { navigation: any }) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user, updateUserVehicles } = useAuth();
  
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    if (user?.vehicles && user.vehicles.length > 0) {
      return user.vehicles.map(v => ({
        id: (v.id as string) || Math.random().toString(36).slice(2),
        name: v.name || 'Vehicle',
        type: (v.type as string) || 'Car',
        default: !!v.default,
      }));
    }
    return [];
  });
  
  const [loading, setLoading] = useState(false);
  const [newVehicleName, setNewVehicleName] = useState('');
  const [newVehicleType, setNewVehicleType] = useState('Car');
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const defaultVehicle = vehicles.find(v => v.default)?.name || '';
      const success = await updateUserVehicles(vehicles, defaultVehicle);
      if (success) {
        Alert.alert(t('success'), t('vehiclesUpdated'));
        navigation.goBack();
      } else {
        Alert.alert(t('error'), t('updateFailed'));
      }
    } catch (error) {
      console.error('Vehicle update error:', error);
      Alert.alert(t('error'), t('somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const addVehicle = () => {
    if (!newVehicleName.trim()) {
      Alert.alert(t('error'), t('vehicleNameRequired'));
      return;
    }

    const newVehicle: Vehicle = {
      id: Date.now().toString(),
      name: newVehicleName,
      type: newVehicleType,
      default: vehicles.length === 0, // Make default if it's the first vehicle
    };

    setVehicles([...vehicles, newVehicle]);
    setNewVehicleName('');
    setNewVehicleType('Car');
    setIsAddingVehicle(false);
  };

  const removeVehicle = (id: string) => {
    const vehicleToRemove = vehicles.find(v => v.id === id);
    const isDefault = vehicleToRemove?.default || false;
    
    setVehicles(prevVehicles => {
      const updatedVehicles = prevVehicles.filter(v => v.id !== id);
      
      // If the removed vehicle was the default, set a new default
      if (isDefault && updatedVehicles.length > 0) {
        updatedVehicles[0].default = true;
      }
      
      return updatedVehicles;
    });
  };

  const setDefaultVehicle = (id: string) => {
    setVehicles(prevVehicles => 
      prevVehicles.map(vehicle => ({
        ...vehicle,
        default: vehicle.id === id
      }))
    );
  };

  const renderVehicleItem = ({ item }: { item: Vehicle }) => (
    <View style={[styles.vehicleItem, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.vehicleInfo}>
        <View style={styles.vehicleIconContainer}>
          <Ionicons 
            name={item.type === 'Car' ? 'car-outline' : 
                  item.type === 'Motorcycle' ? 'bicycle-outline' : 'cube-outline'} 
            size={24} 
            color={theme.colors.primary} 
          />
        </View>
        <View style={styles.vehicleDetails}>
          <Text style={[styles.vehicleName, { color: theme.colors.text }]}>{item.name}</Text>
          <Text style={[styles.vehicleType, { color: theme.colors.textSecondary }]}>{item.type}</Text>
        </View>
      </View>
      <View style={styles.vehicleActions}>
        {item.default ? (
          <View style={[styles.defaultBadge, { backgroundColor: theme.colors.primary + '20' }]}>
            <Text style={[styles.defaultText, { color: theme.colors.primary }]}>{t('default')}</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.setDefaultButton} 
            onPress={() => setDefaultVehicle(item.id)}
          >
            <Text style={[styles.setDefaultText, { color: theme.colors.primary }]}>{t('setDefault')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={() => {
            if (vehicles.length === 1) {
              Alert.alert(t('error'), t('cannotRemoveLastVehicle'));
              return;
            }
            removeVehicle(item.id);
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
          {t('vehicleInformation')}
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
        data={vehicles}
        renderItem={renderVehicleItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
            {t('yourVehicles')}
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              {t('noVehiclesAdded')}
            </Text>
          </View>
        }
      />

      {isAddingVehicle ? (
        <View style={[styles.addVehicleForm, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.formTitle, { color: theme.colors.text }]}>{t('addNewVehicle')}</Text>
          
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            {t('vehicleName')}
          </Text>
          <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
            <TextInput
              style={[styles.input, { color: theme.colors.text }]}
              placeholder={t('enterVehicleName')}
              placeholderTextColor={theme.colors.textSecondary}
              value={newVehicleName}
              onChangeText={setNewVehicleName}
            />
          </View>

          <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 16 }]}>
            {t('vehicleType')}
          </Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeOption,
                newVehicleType === 'Car' && [styles.selectedType, { borderColor: theme.colors.primary }],
                { backgroundColor: theme.colors.background }
              ]}
              onPress={() => setNewVehicleType('Car')}
            >
              <Ionicons 
                name="car-outline" 
                size={24} 
                color={newVehicleType === 'Car' ? theme.colors.primary : theme.colors.textSecondary} 
              />
              <Text 
                style={[
                  styles.typeText, 
                  { color: newVehicleType === 'Car' ? theme.colors.primary : theme.colors.textSecondary }
                ]}
              >
                {t('car')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeOption,
                newVehicleType === 'Motorcycle' && [styles.selectedType, { borderColor: theme.colors.primary }],
                { backgroundColor: theme.colors.background }
              ]}
              onPress={() => setNewVehicleType('Motorcycle')}
            >
              <Ionicons 
                name="bicycle-outline" 
                size={24} 
                color={newVehicleType === 'Motorcycle' ? theme.colors.primary : theme.colors.textSecondary} 
              />
              <Text 
                style={[
                  styles.typeText, 
                  { color: newVehicleType === 'Motorcycle' ? theme.colors.primary : theme.colors.textSecondary }
                ]}
              >
                {t('motorcycle')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeOption,
                newVehicleType === 'Other' && [styles.selectedType, { borderColor: theme.colors.primary }],
                { backgroundColor: theme.colors.background }
              ]}
              onPress={() => setNewVehicleType('Other')}
            >
              <Ionicons 
                name="cube-outline" 
                size={24} 
                color={newVehicleType === 'Other' ? theme.colors.primary : theme.colors.textSecondary} 
              />
              <Text 
                style={[
                  styles.typeText, 
                  { color: newVehicleType === 'Other' ? theme.colors.primary : theme.colors.textSecondary }
                ]}
              >
                {t('other')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.colors.border }]}
              onPress={() => {
                setIsAddingVehicle(false);
                setNewVehicleName('');
                setNewVehicleType('Car');
              }}
            >
              <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>
                {t('cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
              onPress={addVehicle}
            >
              <Text style={styles.addText}>{t('add')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.addVehicleButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => setIsAddingVehicle(true)}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
          <Text style={styles.addVehicleText}>{t('addVehicle')}</Text>
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
  vehicleItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  vehicleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  vehicleType: {
    fontSize: 14,
  },
  vehicleActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 16,
  },
  defaultText: {
    fontSize: 12,
    fontWeight: '600',
  },
  setDefaultButton: {
    marginRight: 16,
  },
  setDefaultText: {
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
  addVehicleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  addVehicleText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  addVehicleForm: {
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
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  typeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedType: {
    borderWidth: 2,
  },
  typeText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
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
