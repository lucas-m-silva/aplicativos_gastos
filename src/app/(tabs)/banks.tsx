import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform, Modal } from 'react-native';
import { Landmark, PlusCircle, ArrowUpCircle, Pencil, Trash2, ChevronDown, X } from 'lucide-react-native';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../contexts/SettingsContext';

export default function BanksScreen() {
  const { session } = useAuth();
  const { colors, t } = useSettings();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [creditBills, setCreditBills] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // New Bank state
  const [isAddingBank, setIsAddingBank] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [newBankBalance, setNewBankBalance] = useState('');

  // Add Income state
  const [isAddingIncome, setIsAddingIncome] = useState<string | null>(null);
  const [incomeSource, setIncomeSource] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [previousSources, setPreviousSources] = useState<string[]>([]);

  // Edit Balance state
  const [isEditingBalance, setIsEditingBalance] = useState<string | null>(null);
  const [editBalanceValue, setEditBalanceValue] = useState('');

  // Add/Edit Investment state
  const [isAddingInvestment, setIsAddingInvestment] = useState<string | null>(null);
  const [editingInvestmentId, setEditingInvestmentId] = useState<string | null>(null);
  const [invName, setInvName] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [isInvTypeModalVisible, setInvTypeModalVisible] = useState(false);

  const PREDEFINED_INVESTMENTS = [
    'Caixinha / Reserva',
    'Poupança',
    'CDB / LCI / LCA',
    'Tesouro Direto',
    'Ações',
    'Fundos Imobiliários',
    'Criptomoedas',
    'Previdência Privada',
    'Outros'
  ];

  useEffect(() => {
    fetchAccounts();
    fetchPreviousSources();
  }, []);

  async function fetchPreviousSources() {
    const { data } = await supabase
      .from('transactions')
      .select('description')
      .eq('type', 'income')
      .order('created_at', { ascending: false });
    
    if (data) {
      const unique = Array.from(new Set(data.map(d => d.description))).filter(Boolean);
      setPreviousSources(unique.slice(0, 5));
    }
  }

  async function fetchAccounts() {
    setLoading(true);
    const { data: accountsData, error } = await supabase
      .from('accounts')
      .select('*')
      .order('balance', { ascending: false });
    
    if (accountsData) {
      setAccounts(accountsData);
      
      // Fetch credit bills (unpaid expenses per account)
      const { data: pendingData } = await supabase
        .from('transactions')
        .select('account_id, amount')
        .eq('type', 'expense')
        .eq('is_paid', false);
        
      if (pendingData) {
        const bills: Record<string, number> = {};
        pendingData.forEach(tx => {
          if (!bills[tx.account_id]) bills[tx.account_id] = 0;
          bills[tx.account_id] += tx.amount;
        });
        setCreditBills(bills);
      }

      // Fetch investments
      const { data: invData, error: invError } = await supabase
        .from('account_investments')
        .select('*');
      if (!invError && invData) {
        setInvestments(invData);
      } else {
        setInvestments([]);
      }
    }
    setLoading(false);
  }

  const handleBankBalanceChange = (text: string) => {
    setNewBankBalance(text.replace(/[^0-9.,]/g, ''));
  };

  const handleIncomeAmountChange = (text: string) => {
    setIncomeAmount(text.replace(/[^0-9.,]/g, ''));
  };

  const handleEditBalanceChange = (text: string) => {
    setEditBalanceValue(text.replace(/[^0-9.,]/g, ''));
  };

  async function handleAddBank() {
    if (!newBankName) return;
    
    const { error } = await supabase.from('accounts').insert([{
      user_id: session?.user.id,
      name: newBankName,
      balance: parseFloat(newBankBalance.replace(',', '.') || '0')
    }]);

    if (error) {
      Alert.alert('Erro', error.message);
      if (Platform.OS === 'web') window.alert(error.message);
    } else {
      if (Platform.OS === 'web') window.alert('Banco adicionado com sucesso!');
      setNewBankName('');
      setNewBankBalance('');
      setIsAddingBank(false);
      fetchAccounts();
    }
  }

  async function handleAddIncome(accountId: string) {
    if (!incomeSource || !incomeAmount) {
      Alert.alert('Erro', 'Preencha a fonte e o valor da entrada.');
      if (Platform.OS === 'web') window.alert('Preencha a fonte e o valor da entrada.');
      return;
    }

    const { error } = await supabase.from('transactions').insert([{
      user_id: session?.user.id,
      account_id: accountId,
      description: incomeSource,
      amount: parseFloat(incomeAmount.replace(',', '.')),
      type: 'income',
      is_paid: true,
      date: new Date().toISOString().split('T')[0]
    }]);

    if (error) {
      Alert.alert('Erro', error.message);
      if (Platform.OS === 'web') window.alert(error.message);
    } else {
      if (Platform.OS === 'web') window.alert('Entrada adicionada com sucesso!');
      setIncomeSource('');
      setIncomeAmount('');
      setIsAddingIncome(null);
      fetchPreviousSources();
      setTimeout(() => fetchAccounts(), 500); 
    }
  }

  async function handleSaveBalance(accountId: string) {
    if (!editBalanceValue) return;
    
    const num = parseFloat(editBalanceValue.replace(',', '.'));
    const { error } = await supabase.from('accounts').update({ balance: num }).eq('id', accountId);
    
    if (error) {
      Alert.alert('Erro', error.message);
      if (Platform.OS === 'web') window.alert(error.message);
    } else {
      setIsEditingBalance(null);
      fetchAccounts();
    }
  }

  async function handleAddInvestment(accountId: string) {
    if (!invName || !invAmount) {
      Alert.alert('Erro', 'Preencha o tipo de investimento e o valor.');
      if (Platform.OS === 'web') window.alert('Preencha o tipo de investimento e o valor.');
      return;
    }

    if (editingInvestmentId) {
      const { error } = await supabase.from('account_investments')
        .update({ name: invName, amount: parseFloat(invAmount.replace(',', '.')) })
        .eq('id', editingInvestmentId);
        
      if (error) {
        Alert.alert('Erro', error.message);
        if (Platform.OS === 'web') window.alert(error.message);
      } else {
        setInvName('');
        setInvAmount('');
        setIsAddingInvestment(null);
        setEditingInvestmentId(null);
        fetchAccounts();
      }
      return;
    }

    const { error } = await supabase.from('account_investments').insert([{
      user_id: session?.user.id,
      account_id: accountId,
      name: invName,
      amount: parseFloat(invAmount.replace(',', '.'))
    }]);

    if (error) {
      // If table missing, tell user
      if (error.code === '42P01') {
        const msg = 'Você precisa rodar o novo script SQL no Supabase para criar a tabela de investimentos!';
        Alert.alert('Erro', msg);
        if (Platform.OS === 'web') window.alert(msg);
      } else {
        Alert.alert('Erro', error.message);
        if (Platform.OS === 'web') window.alert(error.message);
      }
    } else {
      setInvName('');
      setInvAmount('');
      setIsAddingInvestment(null);
      fetchAccounts();
    }
  }

  async function handleDeleteInvestment(id: string) {
    const { error } = await supabase.from('account_investments').delete().eq('id', id);
    if (!error) {
      fetchAccounts();
    } else {
      Alert.alert('Erro', error.message);
      if (Platform.OS === 'web') window.alert(error.message);
    }
  }

  return (
    <ScrollView 
      style={[styles.background, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>{t('banks')}</Text>
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={() => setIsAddingBank(!isAddingBank)}
          >
            <PlusCircle color={colors.primary} size={20} />
            <Text style={{ color: colors.primary, marginLeft: 4, fontWeight: 'bold' }}>Novo Banco</Text>
          </TouchableOpacity>
        </View>

        {isAddingBank && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('addBank')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder={t('bankName')}
              placeholderTextColor={colors.textMuted}
              value={newBankName}
              onChangeText={setNewBankName}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
              placeholder={t('initialBalance')}
              placeholderTextColor={colors.textMuted}
              value={newBankBalance}
              onChangeText={handleBankBalanceChange}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: colors.primary }]} onPress={handleAddBank}>
              <Text style={styles.btnPrimaryText}>{t('saveBank')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
        ) : accounts.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 24, color: colors.textMuted }}>{t('noBanks')}</Text>
        ) : (
          accounts.map(acc => (
            <View key={acc.id} style={[styles.accountCard, { backgroundColor: colors.card, shadowColor: colors.border }]}>
              <View style={styles.accountHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Landmark color={colors.textMuted} size={24} style={{ marginRight: 12 }} />
                  <Text style={[styles.accountName, { color: colors.text }]}>{acc.name}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.accountBalance, { color: colors.text }]}>R$ {acc.balance.toFixed(2)}</Text>
                  <TouchableOpacity 
                    style={{ marginLeft: 8, padding: 4 }}
                    onPress={() => {
                      setIsEditingBalance(acc.id);
                      setEditBalanceValue(acc.balance.toFixed(2));
                      setIsAddingIncome(null);
                    }}
                  >
                    <Pencil color={colors.textMuted} size={16} />
                  </TouchableOpacity>
                </View>
              </View>

              {(creditBills[acc.id] > 0) && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, padding: 12, backgroundColor: colors.danger + '10', borderRadius: 8 }}>
                  <Text style={{ color: colors.danger, fontWeight: 'bold' }}>Fatura / Pendente</Text>
                  <Text style={{ color: colors.danger, fontWeight: 'bold' }}>- R$ {creditBills[acc.id].toFixed(2)}</Text>
                </View>
              )}

              {isEditingBalance === acc.id && (
                <View style={[styles.incomeForm, { borderColor: colors.border, marginBottom: 16 }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Ajustar Saldo</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="Novo saldo"
                    placeholderTextColor={colors.textMuted}
                    value={editBalanceValue}
                    onChangeText={handleEditBalanceChange}
                    keyboardType="decimal-pad"
                  />
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                    <TouchableOpacity style={[styles.btnSecondary, { backgroundColor: colors.border }]} onPress={() => setIsEditingBalance(null)}>
                      <Text style={[styles.btnSecondaryText, { color: colors.text }]}>{t('cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btnSuccess, { backgroundColor: colors.primary }]} onPress={() => handleSaveBalance(acc.id)}>
                      <Text style={styles.btnPrimaryText}>Salvar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Investments Section */}
              {(() => {
                const bankInvs = investments.filter(i => i.account_id === acc.id);
                if (bankInvs.length === 0) return null;
                const totalInv = bankInvs.reduce((sum, curr) => sum + curr.amount, 0);
                return (
                  <View style={[styles.investmentsContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.invTitle, { color: colors.text }]}>Investimentos / Caixinhas</Text>
                    {bankInvs.map(inv => (
                      <View key={inv.id} style={styles.invRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.textMuted }}>{inv.name}</Text>
                          <Text style={{ color: colors.text, fontWeight: 'bold' }}>R$ {inv.amount.toFixed(2)}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                          <TouchableOpacity onPress={() => {
                            setEditingInvestmentId(inv.id);
                            setInvName(inv.name);
                            setInvAmount(inv.amount.toFixed(2));
                            setIsAddingInvestment(acc.id);
                            setIsAddingIncome(null);
                            setIsEditingBalance(null);
                          }}>
                            <Pencil color={colors.textMuted} size={16} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => {
                            if (Platform.OS === 'web') {
                              if (window.confirm('Tem certeza que deseja apagar?')) handleDeleteInvestment(inv.id);
                            } else {
                              Alert.alert('Excluir', 'Tem certeza que deseja apagar este investimento?', [
                                { text: 'Cancelar', style: 'cancel' },
                                { text: 'Apagar', style: 'destructive', onPress: () => handleDeleteInvestment(inv.id) }
                              ]);
                            }
                          }}>
                            <Trash2 color={colors.danger} size={16} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                    <View style={[styles.invTotalRow, { borderTopColor: colors.border }]}>
                      <Text style={{ color: colors.text, fontWeight: 'bold' }}>Total Investido</Text>
                      <Text style={{ color: colors.primary, fontWeight: 'bold' }}>R$ {totalInv.toFixed(2)}</Text>
                    </View>
                  </View>
                );
              })()}

              {isAddingInvestment === acc.id && (
                <View style={[styles.incomeForm, { borderColor: colors.border, marginBottom: 16 }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {editingInvestmentId ? 'Editar Investimento' : 'Novo Investimento (Caixinha, etc)'}
                  </Text>
                  
                  <TouchableOpacity 
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]} 
                    onPress={() => setInvTypeModalVisible(true)}
                  >
                    <Text style={{ color: invName ? colors.text : colors.textMuted }}>
                      {invName || 'Selecione o tipo...'}
                    </Text>
                    <ChevronDown color={colors.textMuted} size={20} />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="Valor investido"
                    placeholderTextColor={colors.textMuted}
                    value={invAmount}
                    onChangeText={(t) => setInvAmount(t.replace(/[^0-9.,]/g, ''))}
                    keyboardType="decimal-pad"
                  />
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                    <TouchableOpacity style={[styles.btnSecondary, { backgroundColor: colors.border }]} onPress={() => {
                      setIsAddingInvestment(null);
                      setEditingInvestmentId(null);
                    }}>
                      <Text style={[styles.btnSecondaryText, { color: colors.text }]}>{t('cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btnSuccess, { backgroundColor: colors.primary }]} onPress={() => handleAddInvestment(acc.id)}>
                      <Text style={styles.btnPrimaryText}>{editingInvestmentId ? 'Atualizar' : 'Salvar'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {isAddingIncome === acc.id && (
                <View style={[styles.incomeForm, { borderColor: colors.border }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('addIncome')}</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder={t('source')}
                    placeholderTextColor={colors.textMuted}
                    value={incomeSource}
                    onChangeText={setIncomeSource}
                  />
                  {previousSources.length > 0 && (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                      {previousSources.map(src => (
                        <TouchableOpacity 
                          key={src} 
                          style={{ backgroundColor: colors.border, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 }}
                          onPress={() => setIncomeSource(src)}
                        >
                          <Text style={{ fontSize: 12, color: colors.text }}>{src}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder={t('value')}
                    placeholderTextColor={colors.textMuted}
                    value={incomeAmount}
                    onChangeText={handleIncomeAmountChange}
                    keyboardType="decimal-pad"
                  />
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                    <TouchableOpacity style={[styles.btnSecondary, { backgroundColor: colors.border }]} onPress={() => setIsAddingIncome(null)}>
                      <Text style={[styles.btnSecondaryText, { color: colors.text }]}>{t('cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btnSuccess, { backgroundColor: colors.success }]} onPress={() => handleAddIncome(acc.id)}>
                      <Text style={styles.btnPrimaryText}>{t('add')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {!isAddingIncome && !isAddingInvestment && !isEditingBalance && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: colors.success + '20', flex: 1 }]}
                    onPress={() => {
                      setIsAddingIncome(acc.id);
                      setIsEditingBalance(null);
                      setIsAddingInvestment(null);
                    }}
                  >
                    <ArrowUpCircle color={colors.success} size={16} />
                    <Text style={[styles.actionBtnText, { color: colors.success }]}>{t('addIncome')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: colors.primary + '20', flex: 1 }]}
                    onPress={() => {
                      setIsAddingInvestment(acc.id);
                      setIsAddingIncome(null);
                      setIsEditingBalance(null);
                    }}
                  >
                    <PlusCircle color={colors.primary} size={16} />
                    <Text style={[styles.actionBtnText, { color: colors.primary }]}>+ Investimento</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </View>

      <Modal visible={isInvTypeModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: colors.border }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>Tipo de Investimento</Text>
            <TouchableOpacity onPress={() => setInvTypeModalVisible(false)}><X color={colors.textMuted} size={24}/></TouchableOpacity>
          </View>
          
          <ScrollView>
            {PREDEFINED_INVESTMENTS.map(srv => (
              <TouchableOpacity 
                key={srv} 
                style={{ padding: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.border }} 
                onPress={() => { setInvName(srv); setInvTypeModalVisible(false); }}
              >
                <Text style={{ fontSize: 16, color: colors.text }}>{srv}</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  card: { padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1 },
  input: { padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1 },
  btnPrimary: { padding: 12, borderRadius: 8, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: 'bold' },
  btnSecondary: { padding: 12, borderRadius: 8, alignItems: 'center' },
  btnSecondaryText: { fontWeight: 'bold' },
  btnSuccess: { padding: 12, borderRadius: 8, alignItems: 'center' },
  accountCard: { padding: 16, borderRadius: 12, marginBottom: 16, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  accountHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  accountName: { fontSize: 18, fontWeight: 'bold' },
  accountBalance: { fontSize: 20, fontWeight: 'bold' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8 },
  actionBtnText: { fontWeight: 'bold', marginLeft: 8, fontSize: 12 },
  incomeForm: { marginTop: 12, borderTopWidth: 1, paddingTop: 16 },
  investmentsContainer: { padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 16 },
  invTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  invRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  invTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1 }
});
