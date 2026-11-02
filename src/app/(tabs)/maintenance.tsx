import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { AlertCircle, CheckCircle2, Wrench, PlusCircle } from 'lucide-react-native';
import { Link } from 'expo-router';
import { useMaintenance } from '../../hooks/useMaintenance';
import { useSettings } from '../../contexts/SettingsContext';
import VehicleForm from '../../components/VehicleForm';
import MaintenanceForm from '../../components/MaintenanceForm';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react-native';

const DEFAULT_SERVICE_INTERVALS = [
  { name: 'Troca de Óleo', km: 5000, months: 6 },
  { name: 'Filtro de Óleo', km: 10000, months: 12 },
  { name: 'Filtro de Ar', km: 10000, months: 12 },
  { name: 'Filtro de Cabine', km: 10000, months: 12 },
  { name: 'Filtro de Combustível', km: 15000, months: 12 },
  { name: 'Pneu Dianteiro', km: 15000, months: 60 },
  { name: 'Pneu Traseiro', km: 10000, months: 60 },
  { name: 'Pastilha de Freio', km: 10000, months: 24 },
  { name: 'Fluido de Freio', km: 20000, months: 24 },
  { name: 'Bateria', km: 0, months: 24 },
  { name: 'Relação / Correia', km: 20000, months: 24 },
  { name: 'Lubrificar Corrente', km: 1000, months: 1 },
  { name: 'Líquido de Arrefecimento', km: 20000, months: 36 },
  { name: 'Vela de Ignição', km: 20000, months: 12 },
  { name: 'Bobina de Ignição', km: 40000, months: 48 },
  { name: 'Amortecedor Dianteiro', km: 40000, months: 48 },
  { name: 'Amortecedor Traseiro', km: 40000, months: 48 },
  { name: 'Revisão Geral', km: 10000, months: 12 }
];

function getServiceIntervalsForVehicle(vehicleName: string) {
  const name = vehicleName.toLowerCase();
  
  if (name.includes('biz')) {
    return DEFAULT_SERVICE_INTERVALS.map(s => {
      if (s.name === 'Troca de Óleo') return { ...s, km: 1000, months: 6 };
      if (s.name === 'Filtro de Óleo') return { ...s, km: 4000, months: 12 };
      if (s.name === 'Filtro de Ar') return { ...s, km: 12000, months: 12 };
      if (s.name === 'Vela de Ignição') return { ...s, km: 8000, months: 12 };
      if (s.name === 'Relação / Correia') return { ...s, km: 15000, months: 24 };
      if (s.name === 'Lubrificar Corrente') return { ...s, km: 1000, months: 1 };
      if (s.name === 'Pneu Dianteiro') return { ...s, km: 12000 };
      if (s.name === 'Pneu Traseiro') return { ...s, km: 8000 };
      if (s.name === 'Líquido de Arrefecimento') return { ...s, km: 0, months: 0 }; // Não possui
      return s;
    }).filter(s => s.km > 0 || s.months > 0);
  }
  
  if (name.includes('fox')) {
    return DEFAULT_SERVICE_INTERVALS.map(s => {
      if (s.name === 'Troca de Óleo') return { ...s, km: 8000, months: 6 };
      if (s.name === 'Filtro de Óleo') return { ...s, km: 8000, months: 12 };
      if (s.name === 'Vela de Ignição') return { ...s, km: 40000, months: 48 };
      if (s.name === 'Relação / Correia') return { ...s, km: 60000, months: 36 }; // Correia dentada
      if (s.name === 'Lubrificar Corrente') return { ...s, km: 0, months: 0 }; // Não aplicável
      if (s.name === 'Pneu Dianteiro') return { ...s, km: 40000 };
      if (s.name === 'Pneu Traseiro') return { ...s, km: 40000 };
      if (s.name === 'Líquido de Arrefecimento') return { ...s, km: 30000, months: 36 };
      return s;
    }).filter(s => s.km > 0 || s.months > 0);
  }

  // Padrão (MT-03)
  return DEFAULT_SERVICE_INTERVALS.map(s => {
    if (s.name === 'Lubrificar Corrente') return { ...s, km: 800 };
    return s;
  }).filter(s => s.km > 0 || s.months > 0);
}

export default function MaintenanceScreen() {
  const { vehicles, alerts, records, loading, fetchVehiclesAndAlerts } = useMaintenance();
  const { colors, t } = useSettings();
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [isAddingMaintenance, setIsAddingMaintenance] = useState(false);
  const [expandedVehicle, setExpandedVehicle] = useState<string | null>(null);

  const getServiceHealth = (serviceName: string, vehicleKm: number, vehicleId: string, vehicleName: string) => {
    const intervals = getServiceIntervalsForVehicle(vehicleName);
    const serviceDef = intervals.find(s => s.name === serviceName);
    if (!serviceDef) return null;

    const vehicleRecords = records.filter(r => r.vehicle_id === vehicleId);
    const lastRecord = vehicleRecords.find(r => r.description === serviceName);
    if (!lastRecord) return { status: 'unknown' };

    const lastDate = new Date(lastRecord.date);
    const lastKm = lastRecord.mileage_at_service;

    const nextKm = serviceDef.km > 0 ? lastKm + serviceDef.km : 0;
    const nextDate = new Date(lastDate);
    nextDate.setMonth(nextDate.getMonth() + serviceDef.months);
    
    const remainingKm = nextKm > 0 ? nextKm - vehicleKm : Infinity;
    const remainingDays = Math.ceil((nextDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    
    const percentKm = nextKm > 0 ? remainingKm / serviceDef.km : 1;
    const percentDays = remainingDays / (serviceDef.months * 30);
    
    const minPercent = Math.min(percentKm, percentDays);
    
    let color = colors.success;
    if (minPercent <= 0) color = colors.textMuted; // Vencido (cinza escuro ou alert)
    else if (minPercent < 0.25) color = colors.danger;
    else if (minPercent < 0.5) color = '#f59e0b';

    if (remainingKm < 0 || remainingDays < 0) color = colors.danger; // Vencido é vermelho

    return { 
      status: 'ok', 
      remainingKm, 
      remainingDays, 
      color, 
      nextKm, 
      nextDate: nextDate.toLocaleDateString('pt-BR') 
    };
  };

  return (
    <ScrollView 
      style={[styles.background, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('vehicles')}</Text>
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={() => setIsAddingVehicle(!isAddingVehicle)}
          >
            <PlusCircle color={colors.primary} size={20} />
            <Text style={{ color: colors.primary, marginLeft: 4, fontWeight: 'bold' }}>Novo Veículo</Text>
          </TouchableOpacity>
        </View>

        {isAddingVehicle && (
          <View style={{ marginBottom: 16 }}>
            <VehicleForm 
              onSuccess={() => {
                setIsAddingVehicle(false);
                fetchVehiclesAndAlerts();
              }}
              onCancel={() => setIsAddingVehicle(false)}
            />
          </View>
        )}
        
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : vehicles.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('noVehicles')}</Text>
        ) : (
          vehicles.map(v => (
            <View key={v.id} style={{ marginBottom: 12 }}>
              <TouchableOpacity 
                style={[styles.vehicleCard, { backgroundColor: colors.card, shadowColor: colors.border, marginBottom: 0 }]}
                onPress={() => setExpandedVehicle(expandedVehicle === v.id ? null : v.id)}
              >
                <Wrench color={colors.textMuted} size={24} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.vehicleName, { color: colors.text }]}>{v.name}{v.year ? ` (${v.year})` : ''}</Text>
                  <Text style={[styles.vehicleMileage, { color: colors.textMuted }]}>{v.current_mileage} km atuais</Text>
                </View>
                {expandedVehicle === v.id ? <ChevronUp color={colors.textMuted} size={20} /> : <ChevronDown color={colors.textMuted} size={20} />}
              </TouchableOpacity>

              {expandedVehicle === v.id && (
                <View style={[styles.healthContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {getServiceIntervalsForVehicle(v.name).map(srv => {
                    const health = getServiceHealth(srv.name, v.current_mileage, v.id, v.name);
                    return (
                      <View key={srv.name} style={[styles.healthItem, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.healthItemName, { color: colors.text }]}>{srv.name}</Text>
                        {!health || health.status === 'unknown' ? (
                          <Text style={{ fontSize: 12, color: colors.textMuted }}>Sem registro</Text>
                        ) : (
                          <View style={{ alignItems: 'flex-end' }}>
                            {srv.km > 0 && health.remainingKm !== undefined && (
                              <Text style={{ fontSize: 12, color: health.remainingKm < 0 ? colors.danger : health.color, fontWeight: 'bold' }}>
                                {health.remainingKm < 0 ? 'Vencido!' : `Faltam ${health.remainingKm} km`}
                              </Text>
                            )}
                            {health.remainingDays !== undefined && (
                              <Text style={{ fontSize: 12, color: health.remainingDays < 0 ? colors.danger : health.color, fontWeight: 'bold' }}>
                                {health.remainingDays < 0 ? 'Vencido!' : `Faltam ${health.remainingDays} dias`}
                              </Text>
                            )}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          ))
        )}

        <View style={[styles.headerRow, { marginTop: 24 }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('maintenance')}</Text>
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={() => setIsAddingMaintenance(!isAddingMaintenance)}
          >
            <PlusCircle color={colors.primary} size={20} />
            <Text style={{ color: colors.primary, marginLeft: 4, fontWeight: 'bold' }}>{t('newMaintenance')}</Text>
          </TouchableOpacity>
        </View>

        {isAddingMaintenance && (
          <View style={{ marginBottom: 16 }}>
            <MaintenanceForm 
              onSuccess={() => setIsAddingMaintenance(false)}
              onCancel={() => setIsAddingMaintenance(false)}
            />
          </View>
        )}

        {alerts.length === 0 && !loading && (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>Nenhum alerta pendente.</Text>
        )}

        {alerts.map(alert => (
          <View key={alert.id} style={[styles.alertCard, { backgroundColor: colors.card, shadowColor: colors.border }]}>
            <View style={styles.alertIcon}>
              {alert.status === 'warning' ? (
                <AlertCircle color="#f59e0b" size={24} />
              ) : (
                <CheckCircle2 color={colors.success} size={24} />
              )}
            </View>
            <View style={styles.alertDetails}>
              <Text style={[styles.alertService, { color: colors.text }]}>{alert.service_type}</Text>
              <Text style={[styles.alertVehicle, { color: colors.textMuted }]}>{alert.vehicles?.name}</Text>
              <Text style={[styles.alertKm, { color: colors.textMuted }]}>Trocar em: {alert.due_mileage} km</Text>
            </View>
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: colors.background }]}
              onPress={() => setIsAddingMaintenance(true)}
            >
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>Concluir</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, padding: 16, width: '100%', maxWidth: 800, alignSelf: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  emptyText: { textAlign: 'center', padding: 16 },
  vehicleCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  vehicleName: { fontSize: 16, fontWeight: '600' },
  vehicleMileage: { fontSize: 14, marginTop: 4 },
  alertCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12, borderLeftWidth: 4, borderLeftColor: '#f59e0b', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  alertIcon: { marginRight: 16 },
  alertDetails: { flex: 1 },
  alertService: { fontSize: 16, fontWeight: 'bold' },
  alertVehicle: { fontSize: 14, marginTop: 2 },
  alertKm: { fontSize: 12, marginTop: 4 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  actionBtnText: { fontSize: 12, fontWeight: 'bold' },
  healthContainer: { paddingHorizontal: 16, paddingBottom: 8, borderBottomLeftRadius: 12, borderBottomRightRadius: 12, borderTopWidth: 1, marginTop: -1, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1 },
  healthItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  healthItemName: { fontSize: 14, fontWeight: '500' }
});
