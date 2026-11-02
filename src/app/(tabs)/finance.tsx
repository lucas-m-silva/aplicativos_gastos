import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { PlusCircle, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react-native';
import { Link } from 'expo-router';
import { useFinance } from '../../hooks/useFinance';
import { useSettings } from '../../contexts/SettingsContext';
import TransactionForm from '../../components/TransactionForm';
import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Modal } from 'react-native';
import { X } from 'lucide-react-native';

export default function FinanceScreen() {
  const { transactions, loading, markAsPaid, fetchTransactions } = useFinance();
  const { colors, t } = useSettings();
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [payingTxId, setPayingTxId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('accounts').select('id, name').order('balance', { ascending: false }).then(({data}) => {
      if (data) setAccounts(data);
    });
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.transactionCard, { backgroundColor: colors.card, shadowColor: colors.border }]}>
      <View style={styles.iconContainer}>
        {item.type === 'income' ? (
          <ArrowUpRight color={colors.success} size={24} />
        ) : (
          <ArrowDownRight color={colors.danger} size={24} />
        )}
      </View>
      <View style={styles.details}>
        <Text style={[styles.transactionTitle, { color: colors.text }]}>{item.description}</Text>
        <Text style={[styles.transactionDate, { color: colors.textMuted }]}>
          {item.date ? new Date(item.date).toLocaleDateString(t('language') === 'Idioma' ? 'pt-BR' : 'en-US') : 'Sem data'}
        </Text>
        <Text style={[styles.transactionMeta, { color: colors.textMuted }]}>
          {item.categories?.name || 'Sem categoria'} • {item.accounts?.name || 'Sem conta'} • {item.description.includes('[Cartão]') || (!item.is_paid && item.type === 'expense') ? 'Crédito' : 'Débito'}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[
          styles.amount,
          item.type === 'income' ? { color: colors.success } : { color: colors.danger }
        ]}>
          {item.type === 'income' ? '+ ' : '- '}
          R$ {item.amount.toFixed(2)}
        </Text>
        
        {!item.is_paid && item.type === 'expense' && (
          <TouchableOpacity 
            style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}
            onPress={() => setPayingTxId(item.id)}
          >
            <CheckCircle2 size={16} color={colors.primary} />
            <Text style={{ fontSize: 12, color: colors.primary, marginLeft: 4 }}>Pagar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <ScrollView 
      style={[styles.background, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t('expenses')}</Text>
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={() => setIsAddingTransaction(!isAddingTransaction)}
          >
            <PlusCircle color={colors.primary} size={20} />
            <Text style={{ color: colors.primary, marginLeft: 4, fontWeight: 'bold' }}>Nova Despesa</Text>
          </TouchableOpacity>
        </View>

        {isAddingTransaction && (
          <View style={{ paddingTop: 16, paddingBottom: 16 }}>
            <TransactionForm 
              onSuccess={() => {
                setIsAddingTransaction(false);
                fetchTransactions();
              }} 
              onCancel={() => setIsAddingTransaction(false)} 
            />
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
        ) : transactions.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 24, color: colors.textMuted }}>{t('noTransactions')}</Text>
        ) : (
          <View style={{ marginTop: 16 }}>
            {transactions.map(item => (
              <View key={item.id}>
                {renderItem({ item })}
              </View>
            ))}
          </View>
        )}
      </View>

      <Modal visible={!!payingTxId} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Pagar com qual conta?</Text>
            <TouchableOpacity onPress={() => setPayingTxId(null)}><X color={colors.textMuted} size={24}/></TouchableOpacity>
          </View>
          <ScrollView>
            {accounts.map(acc => (
              <TouchableOpacity 
                key={acc.id} 
                style={[styles.accountItem, { backgroundColor: colors.card, borderColor: colors.border }]} 
                onPress={() => {
                  if (payingTxId) {
                    markAsPaid(payingTxId, acc.id);
                  }
                  setPayingTxId(null);
                }}
              >
                <Text style={{ fontSize: 16, color: colors.text }}>{acc.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, padding: 16, width: '100%', maxWidth: 800, alignSelf: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 20, fontWeight: 'bold' },
  transactionCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 12, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  iconContainer: { marginRight: 16 },
  details: { flex: 1 },
  transactionTitle: { fontSize: 16, fontWeight: '600' },
  transactionDate: { fontSize: 12, marginTop: 4 },
  transactionMeta: { fontSize: 11, marginTop: 4, fontWeight: '500' },
  amount: { fontSize: 16, fontWeight: 'bold' },
  modalContainer: { flex: 1, paddingTop: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  accountItem: { padding: 16, borderBottomWidth: 1 }
});
