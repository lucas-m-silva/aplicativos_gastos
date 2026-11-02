import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export function useMaintenance() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchVehiclesAndAlerts() {
    try {
      setLoading(true);
      
      const { data: vehiclesData, error: vehiclesError } = await supabase
        .from('vehicles')
        .select('*');
      if (vehiclesError) throw vehiclesError;
      setVehicles(vehiclesData || []);

      const { data: recData } = await supabase.from('maintenance_records').select('*').order('date', { ascending: false });
      setRecords(recData || []);
      
      const { data: alertsData, error: alertsError } = await supabase
        .from('maintenance_alerts')
        .select(`
          *,
          vehicles (name)
        `)
        .eq('status', 'pending')
        .order('due_km', { ascending: true });
        
      if (!alertsError) {
        setAlerts(alertsData || []);
      } else {
        // Table might not exist yet, just set alerts empty
        setAlerts([]);
      }
    } catch (error) {
      console.error('Erro ao buscar manutenções:', error);
    } finally {
      setLoading(false);
    }
  }

  // Registra uma nova manutenção
  async function addMaintenanceRecord(record: any) {
    try {
      const { error } = await supabase
        .from('maintenance_records')
        .insert([record]);

      if (error) throw error;
      // Ao inserir o registro, a trigger no banco vai atualizar os alertas automaticamente
      // Então, apenas buscamos os dados novamente
      await fetchVehiclesAndAlerts();
    } catch (error) {
      console.error('Erro ao adicionar manutenção:', error);
    }
  }

  useEffect(() => {
    fetchVehiclesAndAlerts();
  }, []);

  return {
    vehicles,
    alerts,
    records,
    loading,
    fetchVehiclesAndAlerts,
    addMaintenanceRecord,
  };
}
