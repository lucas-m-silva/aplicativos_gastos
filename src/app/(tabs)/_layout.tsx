import { Tabs } from 'expo-router';
import { Home, DollarSign, Wrench, Landmark, Settings } from 'lucide-react-native';
import { useSettings } from '../../contexts/SettingsContext';

export default function TabLayout() {
  const { colors, t } = useSettings();

  return (
    <Tabs screenOptions={{ 
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle: {
        backgroundColor: colors.card,
        borderTopColor: colors.border,
      },
      headerStyle: {
        backgroundColor: colors.card,
        shadowColor: colors.border,
      },
      headerTintColor: colors.text,
      sceneStyle: { backgroundColor: colors.background }
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('dashboard'),
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="banks"
        options={{
          title: t('banks'),
          tabBarIcon: ({ color }) => <Landmark color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: t('expenses'),
          tabBarIcon: ({ color }) => <DollarSign color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="maintenance"
        options={{
          title: t('maintenance'),
          tabBarIcon: ({ color }) => <Wrench color={color} size={24} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('settings'),
          tabBarIcon: ({ color }) => <Settings color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
