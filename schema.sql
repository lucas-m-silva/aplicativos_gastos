-- Rode este script INTEIRO no SQL Editor do seu Supabase

-- 1. Criar Tabela de Contas (Bancos)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) DEFAULT 'checking',
  balance DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Criar Tabela de Categorias
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Criar Tabela de Transações
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'investment')),
  date DATE NOT NULL,
  is_paid BOOLEAN DEFAULT true,
  recurrence VARCHAR(20) CHECK (recurrence IN ('none', 'monthly', 'yearly', 'installments')),
  installments_count INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Criar Tabela de Veículos
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  year INT,
  current_mileage INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Criar Tabela de Manutenção
CREATE TABLE IF NOT EXISTS maintenance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  cost DECIMAL(12,2) NOT NULL,
  mileage_at_service INT NOT NULL,
  next_service_mileage INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Atualizar Saldo do Banco Automaticamente
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_paid = true THEN
    IF NEW.type = 'income' THEN
      UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'expense' THEN
      UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS transaction_insert_trigger ON transactions;

CREATE TRIGGER transaction_insert_trigger
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_account_balance();

-- 6.1 Atualizar Saldo ao Pagar uma Conta Pendente (Ex: Fatura do Cartão)
CREATE OR REPLACE FUNCTION update_account_balance_on_update()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_paid = true AND OLD.is_paid = false THEN
    IF NEW.type = 'income' THEN
      UPDATE accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'expense' THEN
      UPDATE accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS transaction_update_trigger ON transactions;

CREATE TRIGGER transaction_update_trigger
AFTER UPDATE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_account_balance_on_update();

-- Aviso ao Supabase para atualizar a API (esvaziar cache)
NOTIFY pgrst, 'reload schema';

-- 7. Configuração de RLS (Row Level Security)
-- Isso garante que cada usuário só possa ver e editar seus próprios dados

-- Habilitar RLS para todas as tabelas
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

-- Políticas para accounts
CREATE POLICY "Usuários gerenciam próprias contas" ON accounts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Políticas para categories
CREATE POLICY "Usuários gerenciam próprias categorias" ON categories FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Políticas para transactions
CREATE POLICY "Usuários gerenciam próprias transações" ON transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Políticas para vehicles
CREATE POLICY "Usuários gerenciam próprios veículos" ON vehicles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Políticas para maintenance_records
CREATE POLICY "Usuários gerenciam próprias manutenções" ON maintenance_records FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. Criar Tabela de Investimentos (Caixinhas, Poupança, etc)
CREATE TABLE IF NOT EXISTS account_investments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  amount DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE account_investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuários gerenciam próprios investimentos" ON account_investments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

