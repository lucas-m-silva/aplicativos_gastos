import { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export function useFinance() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca todas as transações
  async function fetchTransactions() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          categories (name),
          accounts (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
    } finally {
      setLoading(false);
    }
  }

  // Marca uma conta como paga
  async function markAsPaid(transactionId: string, accountId?: string) {
    try {
      const updateData: any = { is_paid: true };
      if (accountId) updateData.account_id = accountId;

      const { error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', transactionId);

      if (error) throw error;
      await fetchTransactions(); // Atualiza a lista
    } catch (error) {
      console.error('Erro ao pagar transação:', error);
    }
  }

  useEffect(() => {
    fetchTransactions();
  }, []);

  return {
    transactions,
    loading,
    fetchTransactions,
    markAsPaid,
  };
}
