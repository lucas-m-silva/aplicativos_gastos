import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark';
type Language = 'PT' | 'EN' | 'ES';

interface SettingsContextData {
  theme: Theme;
  language: Language;
  setTheme: (t: Theme) => void;
  setLanguage: (l: Language) => void;
  colors: any;
  t: (key: string) => string;
}

const SettingsContext = createContext<SettingsContextData>({} as SettingsContextData);

export const darkColors = {
  background: '#0f172a',
  card: '#1e293b',
  text: '#f8fafc',
  textMuted: '#94a3b8',
  primary: '#38bdf8',
  border: '#334155',
  success: '#34d399',
  danger: '#f87171'
};

export const lightColors = {
  background: '#f1f5f9',
  card: '#ffffff',
  text: '#334155',
  textMuted: '#94a3b8',
  primary: '#0284c7',
  border: '#e2e8f0',
  success: '#10b981',
  danger: '#ef4444'
};

const translations = {
  PT: {
    dashboard: 'Dashboard',
    banks: 'Bancos',
    expenses: 'Despesas',
    vehicles: 'Veículos',
    settings: 'Configurações',
    logout: 'Sair do Aplicativo',
    theme: 'Modo Escuro',
    language: 'Idioma',
    account: 'Conta',
    addBank: 'Adicionar Conta',
    noBanks: 'Nenhum banco cadastrado.',
    addIncome: 'Registrar Entrada',
    saveBank: 'Salvar Conta',
    cancel: 'Cancelar',
    add: 'Adicionar',
    bankName: 'Nome do Banco (Ex: Nubank)',
    initialBalance: 'Saldo Inicial (R$)',
    source: 'Fonte (Ex: Salário)',
    value: 'Valor (R$)',
    expenseTitle: 'Título da Despesa',
    category: 'Categoria',
    payment: 'Recorrência e Pagamento',
    single: 'Único',
    recurring: 'Recorrente',
    installments: 'Parcelado',
    dueDate: 'Data de Vencimento',
    installmentsCount: 'Quantidade de Parcelas',
    saveExpense: 'Salvar Transação',
    selectCategory: 'Selecione uma categoria...',
    newCategory: 'Criar nova categoria...',
    vehicleName: 'Qual é o veículo?',
    year: 'Ano (Opcional)',
    mileage: 'Quilometragem Atual do Painel',
    saveVehicle: 'Cadastrar Veículo',
    maintenance: 'Manutenções',
    newMaintenance: 'Registrar Manutenção',
    noTransactions: 'Nenhuma transação',
    noVehicles: 'Nenhum veículo',
    totalBalance: 'Saldo Total',
    recentActivity: 'Atividade Recente',
    monthlyExpenses: 'Despesas do Mês',
    addExpense: 'Nova Despesa'
  },
  EN: {
    dashboard: 'Dashboard',
    banks: 'Banks',
    expenses: 'Expenses',
    vehicles: 'Vehicles',
    settings: 'Settings',
    logout: 'Logout',
    theme: 'Dark Mode',
    language: 'Language',
    account: 'Account',
    addBank: 'Add Account',
    noBanks: 'No banks registered.',
    addIncome: 'Add Income',
    saveBank: 'Save Account',
    cancel: 'Cancel',
    add: 'Add',
    bankName: 'Bank Name',
    initialBalance: 'Initial Balance',
    source: 'Source (e.g. Salary)',
    value: 'Amount',
    expenseTitle: 'Expense Title',
    category: 'Category',
    payment: 'Payment Type',
    single: 'Single',
    recurring: 'Recurring',
    installments: 'Installments',
    dueDate: 'Due Date',
    installmentsCount: 'Number of Installments',
    saveExpense: 'Save Transaction',
    selectCategory: 'Select category...',
    newCategory: 'Create new category...',
    vehicleName: 'Vehicle Name',
    year: 'Year (Optional)',
    mileage: 'Current Mileage',
    saveVehicle: 'Save Vehicle',
    maintenance: 'Maintenance',
    newMaintenance: 'Add Service',
    noTransactions: 'No transactions',
    noVehicles: 'No vehicles',
    totalBalance: 'Total Balance',
    recentActivity: 'Recent Activity',
    monthlyExpenses: 'Monthly Expenses',
    addExpense: 'New Expense'
  },
  ES: {
    dashboard: 'Tablero',
    banks: 'Bancos',
    expenses: 'Gastos',
    vehicles: 'Vehículos',
    settings: 'Ajustes',
    logout: 'Cerrar Sesión',
    theme: 'Modo Oscuro',
    language: 'Idioma',
    account: 'Cuenta',
    addBank: 'Añadir Banco',
    noBanks: 'Sin bancos registrados.',
    addIncome: 'Añadir Ingreso',
    saveBank: 'Guardar Cuenta',
    cancel: 'Cancelar',
    add: 'Añadir',
    bankName: 'Nombre del Banco',
    initialBalance: 'Saldo Inicial',
    source: 'Fuente (ej. Salario)',
    value: 'Monto',
    expenseTitle: 'Título del Gasto',
    category: 'Categoría',
    payment: 'Tipo de Pago',
    single: 'Único',
    recurring: 'Recurrente',
    installments: 'A plazos',
    dueDate: 'Fecha de Vencimiento',
    installmentsCount: 'Cantidad de Plazos',
    saveExpense: 'Guardar Transacción',
    selectCategory: 'Seleccionar categoría...',
    newCategory: 'Crear categoría...',
    vehicleName: 'Nombre del Vehículo',
    year: 'Año (Opcional)',
    mileage: 'Kilometraje Actual',
    saveVehicle: 'Guardar Vehículo',
    maintenance: 'Mantenimiento',
    newMaintenance: 'Registrar Servicio',
    noTransactions: 'Sin transacciones',
    noVehicles: 'Sin vehículos',
    totalBalance: 'Saldo Total',
    recentActivity: 'Actividad Reciente',
    monthlyExpenses: 'Gastos del Mes',
    addExpense: 'Nuevo Gasto'
  }
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [language, setLanguageState] = useState<Language>('PT');

  useEffect(() => {
    AsyncStorage.getItem('@theme').then(t => { if (t) setThemeState(t as Theme); });
    AsyncStorage.getItem('@language').then(l => { if (l) setLanguageState(l as Language); });
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    AsyncStorage.setItem('@theme', t);
  };

  const setLanguage = (l: Language) => {
    setLanguageState(l);
    AsyncStorage.setItem('@language', l);
  };

  const colors = theme === 'dark' ? darkColors : lightColors;
  
  const t = (key: string) => {
    return (translations as any)[language][key] || key;
  };

  return (
    <SettingsContext.Provider value={{ theme, language, setTheme, setLanguage, colors, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
