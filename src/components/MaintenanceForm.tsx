import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Modal, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../contexts/SettingsContext';
import { ChevronDown, X, Plus } from 'lucide-react-native';

const PREDEFINED_SERVICES = [
  'Troca de Óleo',
  'Filtro de Óleo',
  'Filtro de Ar',
  'Filtro de Cabine',
  'Filtro de Combustível',
  'Pneu Dianteiro',
  'Pneu Traseiro',
  'Pastilha de Freio',
  'Fluido de Freio',
  'Bateria',
  'Relação / Correia',
  'Líquido de Arrefecimento',
  'Vela de Ignição',
  'Bobina de Ignição',
  'Amortecedor Dianteiro',
  'Amortecedor Traseiro',
  'Revisão Geral',
  'Lavagem / Estética'
];

export default function MaintenanceForm({ onSuccess, onCancel }: { onSuccess?: () => void, onCancel?: () => void }) {
  const { session } = useAuth();
  const { colors } = useSettings();
  const styles = getStyles(colors);
  const [serviceType, setServiceType] = useState('');
  const [isServiceModalVisible, setServiceModalVisible] = useState(false);
  const [newService, setNewService] = useState('');
  
  const [mileage, setMileage] = useState('');
  const [cost, setCost] = useState('');
  
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isVehicleModalVisible, setVehicleModalVisible] = useState(false);

  useEffect(() => {
    fetchVehicles();
  }, []);

  async function fetchVehicles() {
    const { data } = await supabase.from('vehicles').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setVehicles(data);
      setSelectedVehicle(data[0]);
    }
  }

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  async function handleSave() {
    if (!serviceType || !mileage) {
      showAlert('Erro', 'Preencha o serviço e a quilometragem');
      return;
    }

    if (!selectedVehicle) {
      showAlert('Erro', 'Selecione um veículo.');
      return;
    }

    const newMileage = parseInt(mileage.replace(/[^0-9]/g, ''), 10);
    if (newMileage < selectedVehicle.current_mileage) {
      showAlert('Erro', `A quilometragem informada (${newMileage} km) não pode ser menor que a atual do veículo (${selectedVehicle.current_mileage} km). Verifique se digitou corretamente.`);
      return;
    }

    try {
      const { error } = await supabase.from('maintenance_records').insert([{
        user_id: session?.user.id,
        vehicle_id: selectedVehicle.id,
        description: serviceType,
        date: new Date().toISOString().split('T')[0],
        mileage_at_service: newMileage,
        cost: cost ? parseFloat(cost.replace(',', '.')) : 0,
      }]);

      if (error) throw error;
      
      // Update vehicle current mileage
      if (newMileage > selectedVehicle.current_mileage) {
        await supabase.from('vehicles').update({ current_mileage: newMileage }).eq('id', selectedVehicle.id);
      }
      
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showAlert('Erro', err.message);
    }
  }

  const handleCostChange = (text: string) => {
    setCost(text.replace(/[^0-9.,]/g, ''));
  };

  return (
    <View style={styles.cardContainer}>
      <Text style={styles.label}>Veículo</Text>
      <TouchableOpacity style={styles.pickerButton} onPress={() => setVehicleModalVisible(true)}>
        <Text style={{ color: selectedVehicle ? colors.text : colors.textMuted }}>
          {selectedVehicle ? selectedVehicle.name : 'Selecione o veículo...'}
        </Text>
        <ChevronDown color={colors.textMuted} size={20} />
      </TouchableOpacity>

      <Text style={styles.label}>Serviço</Text>
      <TouchableOpacity style={styles.pickerButton} onPress={() => setServiceModalVisible(true)}>
        <Text style={{ color: serviceType ? colors.text : colors.textMuted }}>
          {serviceType || 'Selecione o serviço...'}
        </Text>
        <ChevronDown color={colors.textMuted} size={20} />
      </TouchableOpacity>
      
      <Text style={styles.label}>Quilometragem no painel</Text>
      <TextInput
        style={styles.input}
        placeholder="Quilometragem no painel"
        placeholderTextColor={colors.textMuted}
        value={mileage}
        onChangeText={setMileage}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Valor R$</Text>
      <TextInput
        style={styles.input}
        placeholder="Valor R$"
        placeholderTextColor={colors.textMuted}
        value={cost}
        onChangeText={handleCostChange}
        keyboardType="decimal-pad"
      />

      <View style={styles.buttonRow}>
        {onCancel && (
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Registrar</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isVehicleModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecione o Veículo</Text>
            <TouchableOpacity onPress={() => setVehicleModalVisible(false)}><X color={colors.textMuted} size={24}/></TouchableOpacity>
          </View>
          <ScrollView>
            {vehicles.map(v => (
              <TouchableOpacity 
                key={v.id} 
                style={styles.categoryItem} 
                onPress={() => { setSelectedVehicle(v); setVehicleModalVisible(false); }}
              >
                <Text style={styles.categoryItemText}>{v.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={isServiceModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecione o Serviço</Text>
            <TouchableOpacity onPress={() => setServiceModalVisible(false)}><X color={colors.textMuted} size={24}/></TouchableOpacity>
          </View>
          
          <View style={styles.newCategoryContainer}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 8 }]}
              placeholder="Outro serviço..."
              placeholderTextColor={colors.textMuted}
              value={newService}
              onChangeText={setNewService}
            />
            <TouchableOpacity style={styles.addBtn} onPress={() => {
              if (newService) {
                setServiceType(newService);
                setNewService('');
                setServiceModalVisible(false);
              }
            }}>
              <Plus color="#fff" size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            {PREDEFINED_SERVICES.map(srv => (
              <TouchableOpacity 
                key={srv} 
                style={styles.categoryItem} 
                onPress={() => { setServiceType(srv); setServiceModalVisible(false); }}
              >
                <Text style={styles.categoryItemText}>{srv}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border
  },
  label: { fontSize: 14, fontWeight: 'bold', color: colors.text, marginBottom: 8, marginTop: 8 },
  input: {
    backgroundColor: colors.background,
    color: colors.text,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerButton: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.background, padding: 16, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  cancelBtn: { padding: 12, borderRadius: 8, alignItems: 'center', backgroundColor: colors.border },
  cancelBtnText: { color: colors.text, fontWeight: 'bold' },
  saveBtn: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: { flex: 1, backgroundColor: colors.background, paddingTop: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: colors.border },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  categoryItem: { padding: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.border },
  categoryItemText: { fontSize: 16, color: colors.text },
  newCategoryContainer: { flexDirection: 'row', padding: 16, backgroundColor: colors.card },
  addBtn: { backgroundColor: colors.success, paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }
});
