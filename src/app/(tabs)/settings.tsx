import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { LogOut, Moon, Globe } from 'lucide-react-native';
import { supabase } from '../../services/supabase';
import { useSettings } from '../../contexts/SettingsContext';

export default function SettingsScreen() {
  const { theme, setTheme, language, setLanguage, colors, t } = useSettings();
  const isDarkTheme = theme === 'dark';

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Erro', error.message);
    }
  };

  return (
    <ScrollView 
      style={[styles.background, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        
        <View style={[styles.section, { backgroundColor: colors.card, shadowColor: colors.border }]}>
          <Text style={styles.sectionTitle}>{t('settings')}</Text>
          
          <View style={styles.settingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Moon color={colors.textMuted} size={24} style={{ marginRight: 12 }} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>Modo Escuro (Dark Theme)</Text>
            </View>
            <Switch
              value={isDarkTheme}
              onValueChange={(val) => setTheme(val ? 'dark' : 'light')}
              trackColor={{ false: '#cbd5e1', true: colors.primary }}
            />
          </View>

          <View style={[styles.settingRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Globe color={colors.textMuted} size={24} style={{ marginRight: 12 }} />
              <Text style={[styles.settingLabel, { color: colors.text }]}>Idioma</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {['PT', 'EN', 'ES'].map((lang) => (
                <TouchableOpacity 
                  key={lang}
                  style={[styles.langBtn, language === lang && { backgroundColor: colors.primary }]} 
                  onPress={() => setLanguage(lang as any)}
                >
                  <Text style={[styles.langBtnText, language === lang && { color: '#fff' }]}>{lang}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, shadowColor: colors.border }]}>
          <Text style={styles.sectionTitle}>Conta</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut color="#ef4444" size={20} style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: { flex: 1, padding: 16, width: '100%', maxWidth: 800, alignSelf: 'center' },
  section: { borderRadius: 12, padding: 16, marginBottom: 24, elevation: 2 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#94a3b8', marginBottom: 16, textTransform: 'uppercase' },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f1f5f9' },
  settingLabel: { fontSize: 16 },
  langBtn: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  langBtnText: { fontWeight: 'bold', color: '#64748b' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#ef4444' }
});
