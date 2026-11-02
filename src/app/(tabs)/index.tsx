import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { useSettings } from '../../contexts/SettingsContext';

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const { colors, t } = useSettings();
  
  // Limita a largura do gráfico no navegador (max 800px)
  const chartWidth = Math.min(width - 32, 800 - 32);

  const chartConfig = {
    backgroundGradientFrom: colors.card,
    backgroundGradientTo: colors.card,
    color: (opacity = 1) => `rgba(2, 132, 199, ${opacity})`,
    labelColor: (opacity = 1) => colors.textMuted,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false
  };

  const pieData = [
    { name: 'Moradia', population: 1500, color: '#0ea5e9', legendFontColor: colors.text, legendFontSize: 12 },
    { name: 'Alimentação', population: 800, color: '#8b5cf6', legendFontColor: colors.text, legendFontSize: 12 },
    { name: 'Veículo', population: 350, color: '#f59e0b', legendFontColor: colors.text, legendFontSize: 12 }
  ];

  const lineData = {
    labels: ['1', '5', '10', '15', '20', '25', '30'],
    datasets: [{ data: [2000, 1800, 1750, 1200, 1150, 800, 750], strokeWidth: 2 }]
  };

  return (
    <ScrollView 
      style={[styles.background, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.textMuted }]}>{t('totalBalance')}</Text>
          <Text style={[styles.balance, { color: colors.text }]}>R$ 750,00</Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('monthlyExpenses')}</Text>
        <View style={[styles.chartContainer, { backgroundColor: colors.card, shadowColor: colors.border }]}>
          <PieChart
            data={pieData}
            width={chartWidth}
            height={200}
            chartConfig={chartConfig}
            accessor={"population"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            absolute
          />
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Fluxo de Caixa Mensal</Text>
        <View style={[styles.chartContainer, { backgroundColor: colors.card, shadowColor: colors.border }]}>
          <LineChart
            data={lineData}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={{ borderRadius: 8 }}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, padding: 16, width: '100%', maxWidth: 800, alignSelf: 'center' },
  card: { padding: 24, borderRadius: 12, marginBottom: 24, alignItems: 'center', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  title: { fontSize: 16, marginBottom: 8 },
  balance: { fontSize: 32, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  chartContainer: { borderRadius: 12, padding: 16, marginBottom: 24, alignItems: 'center', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }
});
