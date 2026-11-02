import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Modal, SectionList, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../contexts/SettingsContext';
import { ChevronDown, X, Plus, CreditCard } from 'lucide-react-native';

const DEFAULT_CATEGORIES = [
  { title: 'Alimentação', data: ['Supermercado', 'Lanches e Delivery'] },
  { title: 'Pets', data: ['Ração (Nico e Nina)', 'Carninha e Petiscos', 'Medicamentos Veterinários', 'Consultas e Cirurgias', 'Acessórios e Brinquedos'] },
  { title: 'Manutenção Preventiva', data: ['Yamaha MT-03', 'Honda Biz 125', 'VW Fox 1.6'] },
  { title: 'Manutenção Corretiva', data: ['Yamaha MT-03', 'Honda Biz 125', 'VW Fox 1.6'] },
  { title: 'Veículos (IPVA, licenciamento, seguro, lavagem)', data: ['Yamaha MT-03', 'Honda Biz 125', 'VW Fox 1.6'] },
  { title: 'Gasolina', data: ['Yamaha MT-03', 'Honda Biz 125', 'VW Fox 1.6'] },
  { title: 'Casa', data: ['Móveis e Eletrodomésticos', 'Reforma e Construção'] },
  { title: 'Contas', data: ['Água', 'Energia', 'Internet', 'Gás', 'Telefone'] },
  { title: 'Viagem', data: ['Combustível de Viagem', 'Alimentação de Viagem'] },
  { title: 'Educação', data: ['Cursos e Treinamentos'] },
  { title: 'Lazer', data: ['Cinema', 'Parques e Passeios'] },
  { title: 'Investimentos', data: ['Criptomoedas (Moeda Digital)', 'Poupança', 'Caixinhas e Reserva de Emergência'] },
  { title: 'Saúde', data: ['Plano de Saúde', 'Medicamentos', 'Cirurgias e Exames', 'Academia (Skyfit)', 'Suplementação (Whey, Creatina, etc.)'] },
];

export default function TransactionForm({ onSuccess, onCancel }: { onSuccess?: () => void, onCancel?: () => void }) {
  const { session } = useAuth();
  const { colors } = useSettings();
  const styles = getStyles(colors);
  
  const type = 'expense';
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Despesa fields
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [customCategories, setCustomCategories] = useState<{title: string, data: string[]}[]>([{title: 'Minhas Categorias', data: []}]);

  // Recorrencia / Parcelamento
  const [paymentType, setPaymentType] = useState('single');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [installments, setInstallments] = useState('2');
  const [isInstallmentsModalVisible, setInstallmentsModalVisible] = useState(false);
  const [isCreditCard, setIsCreditCard] = useState(false);

  // Contas
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [isAccountModalVisible, setAccountModalVisible] = useState(false);

  useEffect(() => {
    fetchCustomCategories();
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    const { data } = await supabase.from('accounts').select('id, name').order('balance', { ascending: false });
    if (data && data.length > 0) {
      setAccounts(data);
      setSelectedAccount(data[0]); // Seleciona o primeiro banco por padrão
    }
  }

  async function fetchCustomCategories() {
    const { data } = await supabase.from('categories').select('name').eq('type', 'expense');
    if (data && data.length > 0) {
      const defaultNames = DEFAULT_CATEGORIES.flatMap(c => c.data);
      const customNames = data.map(c => c.name).filter(name => !defaultNames.includes(name));
      
      if (customNames.length > 0) {
        setCustomCategories([{ title: 'Minhas Categorias', data: customNames }]);
      } else {
        setCustomCategories([{ title: 'Minhas Categorias', data: [] }]);
      }
    }
  }

  async function handleAddCustomCategory() {
    if (!newCategory) return;
    const { error } = await supabase.from('categories').insert([{ user_id: session?.user.id, name: newCategory, type: 'expense' }]);
    if (!error) {
      setSelectedCategory(newCategory);
      setNewCategory('');
      setCategoryModalVisible(false);
      fetchCustomCategories();
    }
  }

  async function handleSave() {
    if (!description || !amount) {
      Alert.alert('Erro', 'Preencha a descrição e valor.');
      return;
    }

    if (!selectedAccount) {
      Alert.alert('Erro', 'Selecione uma conta (banco).');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Erro', 'Selecione uma categoria.');
      return;
    }

    setIsSaving(true);

    try {
      let categoryId = null;
      let { data: catData } = await supabase.from('categories').select('id').eq('name', selectedCategory).single();
      if (!catData) {
        const res = await supabase.from('categories').insert([{ user_id: session?.user.id, name: selectedCategory, type: 'expense' }]).select().single();
        if (res.data) catData = res.data;
      }
      categoryId = catData?.id;

      const numAmount = parseFloat(amount.replace(',', '.'));
      let recurrence = 'none';
      if (paymentType === 'recurring') recurrence = 'monthly';
      if (paymentType === 'installments') recurrence = 'installments';

      const txDate = dueDate ? new Date(dueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      // Se for no cartão de crédito, a despesa não foi paga (não saiu do saldo ainda). Se for single debit, foi paga.
      const isPaid = isCreditCard ? false : (paymentType === 'single');

      const { error } = await supabase.from('transactions').insert([{
        user_id: session?.user.id,
        account_id: selectedAccount.id,
        description: isCreditCard ? `[Cartão] ${description}` : description,
        amount: numAmount,
        type: type,
        category_id: categoryId,
        is_paid: isPaid,
        date: txDate,
        recurrence: recurrence,
        installments_count: paymentType === 'installments' ? parseInt(installments, 10) : 1
      }]);

      if (error) throw error;
      
      if (Platform.OS === 'web') window.alert('Salvo com sucesso!');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      Alert.alert('Erro', err.message);
      if (Platform.OS === 'web') window.alert(err.message);
    } finally {
      setIsSaving(false);
    }
  }

  const handleAmountChange = (text: string) => {
    setAmount(text.replace(/[^0-9.,]/g, ''));
  };

  const renderDatePicker = () => {
    if (Platform.OS === 'web') {
      return (
        <input 
          type="date" 
          value={dueDate} 
          onChange={(e) => setDueDate(e.target.value)} 
          style={{ padding: 12, borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: colors.background, color: colors.text, marginBottom: 12, width: '100%', fontSize: 16, fontFamily: 'inherit' }}
        />
      );
    }
    return (
      <TextInput
        style={styles.input}
        placeholder="Ex: 2024-10-15"
        value={dueDate}
        onChangeText={setDueDate}
      />
    );
  };

  return (
    <View style={styles.cardContainer}>
      <Text style={styles.label}>Título da Despesa</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Mercado, Conta de Luz..."
        placeholderTextColor={colors.textMuted}
        value={description}
        onChangeText={setDescription}
      />
      
      <Text style={styles.label}>Valor (R$)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: 150.00"
        placeholderTextColor={colors.textMuted}
        value={amount}
        onChangeText={handleAmountChange}
        keyboardType="decimal-pad"
      />

      <Text style={styles.label}>Conta (Banco)</Text>
      <TouchableOpacity style={styles.pickerButton} onPress={() => setAccountModalVisible(true)}>
        <Text style={{ color: selectedAccount ? colors.text : colors.textMuted }}>
          {selectedAccount ? selectedAccount.name : 'Selecione a conta...'}
        </Text>
        <ChevronDown color={colors.textMuted} size={20} />
      </TouchableOpacity>

      <Text style={styles.label}>Categoria</Text>
      <TouchableOpacity style={styles.pickerButton} onPress={() => setCategoryModalVisible(true)}>
        <Text style={{ color: selectedCategory ? colors.text : colors.textMuted }}>
          {selectedCategory || 'Selecione uma categoria...'}
        </Text>
        <ChevronDown color={colors.textMuted} size={20} />
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.pickerButton, { backgroundColor: isCreditCard ? colors.primary + '20' : colors.background, borderColor: isCreditCard ? colors.primary : colors.border }]} 
        onPress={() => setIsCreditCard(!isCreditCard)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <CreditCard color={isCreditCard ? colors.primary : colors.textMuted} size={20} style={{ marginRight: 12 }} />
          <Text style={{ color: isCreditCard ? colors.primary : colors.text, fontWeight: isCreditCard ? 'bold' : 'normal' }}>
            Foi no Cartão de Crédito?
          </Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.label}>Recorrência e Pagamento</Text>
      <View style={styles.paymentSelector}>
        <TouchableOpacity style={[styles.payBtn, paymentType === 'single' && styles.payBtnActive]} onPress={() => setPaymentType('single')}>
          <Text style={[styles.payBtnText, paymentType === 'single' && { color: '#fff' }]}>Único</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.payBtn, paymentType === 'recurring' && styles.payBtnActive]} onPress={() => setPaymentType('recurring')}>
          <Text style={[styles.payBtnText, paymentType === 'recurring' && { color: '#fff' }]}>Recorrente</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.payBtn, paymentType === 'installments' && styles.payBtnActive]} onPress={() => setPaymentType('installments')}>
          <Text style={[styles.payBtnText, paymentType === 'installments' && { color: '#fff' }]}>Parcelado</Text>
        </TouchableOpacity>
      </View>

      {paymentType !== 'single' && (
        <>
          <Text style={styles.label}>Data de Vencimento / 1ª Parcela</Text>
          {renderDatePicker()}
        </>
      )}

      {paymentType === 'installments' && (
        <>
          <Text style={styles.label}>Quantidade de Parcelas</Text>
          <TouchableOpacity style={styles.pickerButton} onPress={() => setInstallmentsModalVisible(true)}>
            <Text style={{ color: colors.text }}>{installments}x vezes</Text>
            <ChevronDown color={colors.textMuted} size={20} />
          </TouchableOpacity>
        </>
      )}

      <View style={styles.buttonRow}>
        {onCancel && (
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={isSaving}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.saveBtn, isSaving && { opacity: 0.7 }]} onPress={handleSave} disabled={isSaving}>
          <Text style={styles.saveBtnText}>{isSaving ? 'Salvando...' : 'Salvar Transação'}</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={isCategoryModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecione a Categoria</Text>
            <TouchableOpacity onPress={() => setCategoryModalVisible(false)}><X color={colors.textMuted} size={24}/></TouchableOpacity>
          </View>
          
          <View style={styles.newCategoryContainer}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 8 }]}
              placeholder="Criar nova categoria..."
              placeholderTextColor={colors.textMuted}
              value={newCategory}
              onChangeText={setNewCategory}
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleAddCustomCategory}>
              <Plus color="#fff" size={20} />
            </TouchableOpacity>
          </View>

          <SectionList
            sections={customCategories[0].data.length > 0 ? [...customCategories, ...DEFAULT_CATEGORIES] : DEFAULT_CATEGORIES}
            keyExtractor={(item, index) => item + index}
            renderSectionHeader={({ section: { title } }) => (
              <Text style={styles.sectionHeader}>{title}</Text>
            )}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.categoryItem} onPress={() => { setSelectedCategory(item); setCategoryModalVisible(false); }}>
                <Text style={styles.categoryItemText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      <Modal visible={isAccountModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecione a Conta</Text>
            <TouchableOpacity onPress={() => setAccountModalVisible(false)}><X color={colors.textMuted} size={24}/></TouchableOpacity>
          </View>
          <ScrollView>
            {accounts.map(acc => (
              <TouchableOpacity 
                key={acc.id} 
                style={styles.categoryItem} 
                onPress={() => { setSelectedAccount(acc); setAccountModalVisible(false); }}
              >
                <Text style={styles.categoryItemText}>{acc.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={isInstallmentsModalVisible} transparent={true} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>Quantidade de Parcelas</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {Array.from({length: 48}, (_, i) => i + 1).map(num => (
                <TouchableOpacity key={num} style={styles.dialogItem} onPress={() => { setInstallments(num.toString()); setInstallmentsModalVisible(false); }}>
                  <Text style={styles.dialogItemText}>{num}x</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={{ padding: 16, alignItems: 'center' }} onPress={() => setInstallmentsModalVisible(false)}>
              <Text style={{ color: colors.danger, fontWeight: 'bold' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  cardContainer: { backgroundColor: colors.card, padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: 14, fontWeight: 'bold', color: colors.text, marginBottom: 8, marginTop: 8 },
  input: { backgroundColor: colors.background, color: colors.text, padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  pickerButton: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.background, padding: 16, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  paymentSelector: { flexDirection: 'row', marginBottom: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 4 },
  payBtn: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 6 },
  payBtnActive: { backgroundColor: colors.primary },
  payBtnText: { fontWeight: '600', color: colors.textMuted, fontSize: 12 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  cancelBtn: { padding: 12, borderRadius: 8, alignItems: 'center', backgroundColor: colors.border },
  cancelBtnText: { color: colors.text, fontWeight: 'bold' },
  saveBtn: { backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalContainer: { flex: 1, backgroundColor: colors.background, paddingTop: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: colors.border },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text },
  sectionHeader: { backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 8, fontSize: 14, fontWeight: 'bold', color: colors.textMuted, marginTop: 8 },
  categoryItem: { padding: 16, backgroundColor: colors.card, borderBottomWidth: 1, borderColor: colors.border },
  categoryItemText: { fontSize: 16, color: colors.text },
  newCategoryContainer: { flexDirection: 'row', padding: 16, backgroundColor: colors.card },
  addBtn: { backgroundColor: colors.success, paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  dialog: { width: '80%', backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden' },
  dialogTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, padding: 16, borderBottomWidth: 1, borderColor: colors.border, textAlign: 'center' },
  dialogItem: { padding: 16, borderBottomWidth: 1, borderColor: colors.border, alignItems: 'center' },
  dialogItemText: { fontSize: 16, color: colors.text }
});
