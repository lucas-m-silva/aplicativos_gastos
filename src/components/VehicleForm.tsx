import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../contexts/SettingsContext';

export default function VehicleForm({ onSuccess, onCancel }: { onSuccess?: () => void, onCancel?: () => void }) {
  const { colors } = useSettings();
  const styles = getStyles(colors);
  const { session } = useAuth();
  
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [mileage, setMileage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleMileageChange = (text: string) => {
    setMileage(text.replace(/[^0-9]/g, ''));
  };

  const handleYearChange = (text: string) => {
    setYear(text.replace(/[^0-9]/g, ''));
  };

  async function handleSave() {
    if (!name || !mileage) {
      Alert.alert('Erro', 'Nome e KM atual são obrigatórios');
      if (Platform.OS === 'web') window.alert('Nome e KM atual são obrigatórios');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('vehicles').insert([{
        user_id: session?.user.id,
        name: name,
        year: year ? parseInt(year, 10) : null,
        current_mileage: parseInt(mileage, 10),
      }]);

      if (error) throw error;
      
      if (Platform.OS === 'web') window.alert('Veículo cadastrado!');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      Alert.alert('Erro', err.message);
      if (Platform.OS === 'web') window.alert(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.cardContainer}>
      <Text style={styles.label}>Qual é o veículo?</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Yamaha MT-03"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
      />
      
      <Text style={styles.label}>Ano (Opcional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: 2018"
        placeholderTextColor={colors.textMuted}
        value={year}
        onChangeText={handleYearChange}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Quilometragem Atual do Painel</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: 12500"
        placeholderTextColor={colors.textMuted}
        value={mileage}
        onChangeText={handleMileageChange}
        keyboardType="numeric"
      />

      <View style={styles.buttonRow}>
        {onCancel && (
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={isSaving}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.saveBtn, isSaving && { opacity: 0.7 }]} onPress={handleSave} disabled={isSaving}>
          <Text style={styles.saveBtnText}>{isSaving ? 'Salvando...' : 'Cadastrar'}</Text>
        </TouchableOpacity>
      </View>
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
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.background,
    color: colors.text,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
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
  }
});
