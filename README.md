# 💰 Finanças & Manutenção Veicular

<p align="center">
  <img src="https://img.shields.io/badge/React_Native-0.86-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-SDK_57-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <b>Um aplicativo móvel moderno e multiplataforma para gestão financeira pessoal integrada ao controle preventivo de manutenção de veículos.</b>
</p>

---

## 📌 Visão Geral

O **Finanças & Manutenção** é um aplicativo desenvolvido com **React Native** e **Expo SDK 57**, projetado para centralizar a saúde financeira e a manutenção automotiva do usuário em uma única ferramenta simples, rápida e segura.

Com sincronização em tempo real via **Supabase (PostgreSQL)**, o app conta com controle de transações, contas bancárias, caixinhas de investimento, faturas de cartão de crédito e monitoramento inteligente de revisões preventivas de veículos (carros e motocicletas), além de suporte nativo a **Modo Escuro (Dark Mode)** e **Multi-idioma (PT / EN / ES)**.

---

## ✨ Principais Funcionalidades

### 📊 Dashboard & Métricas
- **Patrimônio Consolidado**: Visualização clara do saldo total disponível em todas as contas.
- **Gráficos Interativos**:
  - Gráfico de pizza com detalhamento percentual de gastos por categoria.
  - Gráfico de linhas com acompanhamento do fluxo de caixa temporal.

### 💳 Gestão Financeira & Despesas
- **Lançamentos Detalhados**: Cadastro de receitas e despesas com categoria, conta de débito ou cartão, data e descrição.
- **Cartão de Crédito e Despesas Pendentes**: Registro de compras no crédito e liquidação posterior de faturas com 1 clique.
- **Recorrência & Parcelas**: Controle para despesas parceladas e contas fixas recorrentes (mensal e anual).

### 🏦 Contas Bancárias & Investimentos
- **Multi-Bancos**: Cadastro de múltiplas instituições e contas correntes.
- **Automação no Banco de Dados**: Atualização automática de saldos através de *Triggers* e *Functions* do PostgreSQL no Supabase.
- **Aporte Rápido de Receitas**: Adicione receitas instantaneamente a uma conta selecionada.
- **Caixinhas & Investimentos**: Acompanhamento de metas financeiras, reserva de emergência, poupança, CDB/LCI/LCA, Tesouro Direto, Ações, FIIs e Criptomoedas.

### 🚗 Gestão Inteligente de Manutenção Veicular
- **Controle de Frota Pessoal**: Cadastro de veículos (carros e motos) com acompanhamento contínuo do odômetro (quilometragem atual).
- **Perfis Pré-configurados**: Intervalos de manutenção adaptados por modelo (ex.: perfis inteligentes para *Honda Biz*, *VW Fox*, etc.).
- **Monitoramento de Itens Críticos**:
  - Troca de óleo de motor e filtros (óleo, ar, combustível, cabine).
  - Pneus dianteiros e traseiros.
  - Sistema de freios (pastilhas e fluido).
  - Velas e bobinas de ignição, arrefecimento e correia dentada / relação.
- **Alertas Preventivos Inteligentes**: Cálculo automático de dias e quilômetros restantes até a próxima revisão, destacando itens em dia, próximos do prazo ou vencidos.

### ⚙️ Customização & Segurança
- **Dark Mode / Light Mode**: Alternância de temas claro e escuro instantânea via Context API.
- **Internacionalização**: Interface traduzida para Português (PT), Inglês (EN) e Espanhol (ES).
- **Segurança de Nível Bancário**: Autenticação segura pelo Supabase Auth e isolamento total de dados com **Row Level Security (RLS)** em todas as tabelas.

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Finalidade |
| :--- | :--- |
| **[React Native 0.86](https://reactnative.dev/)** | Framework para desenvolvimento mobile nativo multiplataforma |
| **[Expo SDK 57](https://expo.dev/)** | Plataforma de ferramentas e serviços para desenvolvimento React Native |
| **[Expo Router](https://docs.expo.dev/router/introduction/)** | Navegação tipada baseada no sistema de arquivos |
| **[TypeScript](https://www.typescriptlang.org/)** | Tipagem estática para robustez e manutenção do código |
| **[Supabase](https://supabase.com/)** | Backend BaaS: PostgreSQL, Auth e Row Level Security (RLS) |
| **[Lucide React Native](https://lucide.dev/)** | Biblioteca de ícones modernos e minimalistas |
| **[React Native Chart Kit](https://github.com/indiespirit/react-native-chart-kit)** | Renderização de gráficos visuais (Linha e Pizza) |
| **Async Storage** | Persistência local de sessões e preferências |

---

## 📁 Estrutura de Pastas

```text
aplicativos_gastos/
├── assets/                 # Imagens, ícones do aplicativo e splash screen
├── src/
│   ├── app/                # Rotas e telas (Expo Router)
│   │   ├── (tabs)/         # Navegação por abas principais
│   │   │   ├── index.tsx       # Dashboard e gráficos de visão geral
│   │   │   ├── finance.tsx     # Lançamentos e extrato de despesas/receitas
│   │   │   ├── banks.tsx       # Contas bancárias, faturas e investimentos
│   │   │   ├── maintenance.tsx # Veículos, histórico de revisões e alertas
│   │   │   ├── settings.tsx    # Tema (Dark/Light), idioma e logout
│   │   │   └── _layout.tsx     # Layout e barra de abas (Tabs)
│   │   ├── login.tsx       # Tela de autenticação (Login / Cadastro)
│   │   ├── index.tsx       # Redirecionamento inicial
│   │   └── _layout.tsx     # Configuração raiz de navegação e Provedores
│   ├── components/         # Componentes reutilizáveis e modais de formulário
│   │   ├── TransactionForm.tsx # Formulário de despesas e receitas
│   │   ├── VehicleForm.tsx     # Formulário de cadastro de veículo
│   │   └── MaintenanceForm.tsx # Formulário de registro de manutenção
│   ├── contexts/           # Contextos globais (Tema, Tradução/Idioma)
│   │   └── SettingsContext.tsx
│   ├── hooks/              # Custom hooks para consumo do Supabase
│   │   ├── useAuth.ts          # Estado da sessão do usuário
│   │   ├── useFinance.ts       # Carregamento e manipulação de transações
│   │   └── useMaintenance.ts   # Veículos, manutenções e alertas
│   └── services/           # Clientes de APIs externas
│       └── supabase.ts         # Inicialização e cliente do Supabase
├── app.json                # Configurações do Expo
├── package.json            # Dependências e scripts do projeto
├── schema.sql              # Script SQL completo (Tabelas, RLS, Triggers)
└── tsconfig.json           # Configurações do compilador TypeScript
```

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão LTS recomendada)
- Gerenciador de pacotes `npm` ou `bun`
- Aplicativo **Expo Go** instalado no seu dispositivo físico ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779)) ou um emulador configurado
- Uma conta gratuita no [Supabase](https://supabase.com/)

### 1. Clonar o Repositório
```bash
git clone https://github.com/lucas-m-silva/aplicativos_gastos.git
cd aplicativos_gastos
```

### 2. Instalar as Dependências
```bash
npm install
```

### 3. Configurar o Banco de Dados (Supabase)
1. Crie um novo projeto no [Supabase Dashboard](https://app.supabase.com/).
2. Acesse a aba **SQL Editor** no painel do Supabase.
3. Abra o arquivo [`schema.sql`](./schema.sql) deste repositório, copie seu conteúdo e execute-o por completo.
   > Este script cria as tabelas (`accounts`, `categories`, `transactions`, `vehicles`, `maintenance_records`, `account_investments`), ativa as políticas de **Row Level Security (RLS)** e configura as **Triggers** para atualização automática de saldo.
4. Vá em **Project Settings > API** e copie a sua **URL do Projeto** e a chave pública **Anon Key**.
5. Configure suas credenciais no arquivo `src/services/supabase.ts`:
   ```typescript
   const supabaseUrl = 'SUA_SUPABASE_URL';
   const supabaseAnonKey = 'SUA_SUPABASE_ANON_KEY';
   ```

### 4. Executar o Aplicativo
Inicie o servidor de desenvolvimento do Expo:
```bash
npx expo start
```

No terminal interativo, você pode:
- Escanear o QR Code exibido com o **Expo Go** no Android ou com a Câmera no iOS.
- Pressionar `a` para abrir no emulador Android.
- Pressionar `i` para abrir no simulador iOS (somente macOS).
- Pressionar `w` para testar a versão Web no navegador.

---

## 📜 Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm start` / `npx expo start` | Inicia o Metro Bundler do Expo |
| `npm run android` | Inicia e abre diretamente no emulador/dispositivo Android |
| `npm run ios` | Inicia e abre no simulador iOS |
| `npm run web` | Inicia a aplicação no navegador Web |
| `npx tsc --noEmit` | Executa a verificação estática de tipos com TypeScript |

---

## 🗄️ Modelo do Banco de Dados

O banco de dados PostgreSQL estruturado no Supabase contém:

- **`accounts`**: Contas e instituições financeiras (nome, tipo, saldo).
- **`categories`**: Categorias de receitas e despesas vinculadas a cada usuário.
- **`transactions`**: Transações financeiras com valor, tipo, data, status de pagamento (`is_paid`), recorrência e parcelas.
- **`account_investments`**: Caixinhas, poupança e investimentos associados a contas.
- **`vehicles`**: Veículos cadastrados com ano e quilometragem atual.
- **`maintenance_records`**: Registros de manutenções realizadas, custo, odômetro do serviço e previsão de próxima revisão.
- **Automação (Triggers)**: Gatilhos `transaction_insert_trigger` e `transaction_update_trigger` que recalculam e atualizam o saldo das contas automaticamente sempre que uma transação é registrada ou paga.

---

## 📄 Licença

Este projeto está sob a licença [MIT](./LICENSE). Veja o arquivo de licença para mais detalhes.

---

<p align="center">
  Desenvolvido por <a href="https://github.com/lucas-m-silva"><b>Lucas Silva</b></a>
</p>
