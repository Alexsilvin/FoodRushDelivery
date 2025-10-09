import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { riderService } from '../../services';

interface DaySchedule { day: string; enabled: boolean; start: string; end: string; }

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { day: 'Mon', enabled: true, start: '09:00', end: '17:00' },
  { day: 'Tue', enabled: true, start: '09:00', end: '17:00' },
  { day: 'Wed', enabled: true, start: '09:00', end: '17:00' },
  { day: 'Thu', enabled: true, start: '09:00', end: '17:00' },
  { day: 'Fri', enabled: true, start: '09:00', end: '17:00' },
  { day: 'Sat', enabled: false, start: '10:00', end: '16:00' },
  { day: 'Sun', enabled: false, start: '10:00', end: '16:00' },
];

export default function AvailabilityScheduleScreen({ navigation }: any) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [saving, setSaving] = useState(false);

  const toggleDay = (index: number) => {
    setSchedule(prev => prev.map((d,i)=> i===index ? { ...d, enabled: !d.enabled } : d));
  };

  const adjustTime = (index: number, field: 'start' | 'end') => {
    // Simple rotation through preset slots for MVP
    const presets = ['06:00','08:00','09:00','10:00','12:00','14:00','16:00','17:00','18:00','20:00','22:00'];
    setSchedule(prev => prev.map((d,i)=>{
      if(i!==index) return d;
      const current = d[field];
      const idx = presets.indexOf(current);
      const next = presets[(idx + 1) % presets.length];
      // ensure start < end; if rotating start beyond end, shift end
      if(field==='start' && next >= d.end) {
        const nextEndIdx = (presets.indexOf(next) + 2) % presets.length;
        return { ...d, start: next, end: presets[nextEndIdx] };
      }
      if(field==='end' && next <= d.start) {
        const nextStartIdx = (presets.indexOf(next) - 2 + presets.length) % presets.length;
        return { ...d, start: presets[nextStartIdx], end: next };
      }
      return { ...d, [field]: next } as DaySchedule;
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = schedule.map(d => ({ day: d.day, enabled: d.enabled, start: d.start, end: d.end }));
      await riderService.updateAvailability({ available: true, schedule: payload }); // keep available flag true when saving schedule
      Alert.alert(t('success'), t('availabilitySaved') || 'Availability saved');
      navigation.goBack();
    } catch (e: any) {
      Alert.alert(t('error'), e?.response?.data?.message || 'Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container,{ backgroundColor: theme.colors.background }]}>      
      <View style={styles.header}>        
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>          
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />        
        </TouchableOpacity>        
        <Text style={[styles.title,{ color: theme.colors.text }]}>{t('setWeeklyHours')}</Text>        
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>          
          <Text style={[styles.saveText,{ color: theme.colors.primary }]}>{saving ? t('loading') : t('save')}</Text>        
        </TouchableOpacity>      
      </View>
      <ScrollView contentContainerStyle={styles.content}>        
        {schedule.map((d,i)=>(
          <View key={d.day} style={[styles.dayRow,{ borderColor: theme.colors.border }]}>            
            <View style={styles.dayLeft}>              
              <Text style={[styles.dayLabel,{ color: theme.colors.text }]}>{d.day}</Text>              
              <Switch value={d.enabled} onValueChange={()=>toggleDay(i)} trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }} thumbColor={d.enabled ? theme.colors.primary : theme.colors.textSecondary} />            
            </View>            
            <View style={styles.timeControls}>              
              <TouchableOpacity disabled={!d.enabled} style={[styles.timeBox,{ backgroundColor: theme.colors.card, opacity: d.enabled?1:0.4 }]} onPress={()=>adjustTime(i,'start')}>                
                <Text style={[styles.timeText,{ color: theme.colors.text }]}>{d.start}</Text>              
              </TouchableOpacity>              
              <Ionicons name="arrow-forward" size={16} color={theme.colors.textSecondary} style={{ marginHorizontal:4 }} />              
              <TouchableOpacity disabled={!d.enabled} style={[styles.timeBox,{ backgroundColor: theme.colors.card, opacity: d.enabled?1:0.4 }]} onPress={()=>adjustTime(i,'end')}>                
                <Text style={[styles.timeText,{ color: theme.colors.text }]}>{d.end}</Text>              
              </TouchableOpacity>            
            </View>          
          </View>        ))}        
        <Text style={[styles.helper,{ color: theme.colors.textSecondary }]}>{t('availabilityHint') || 'Tap times to cycle through preset hours. More detailed editing coming soon.'}</Text>      
      </ScrollView>    
    </View>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1 },
  header:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingTop:60, paddingHorizontal:16, paddingBottom:12 },
  backButton:{ padding:8 },
  title:{ fontSize:18, fontWeight:'600' },
  saveBtn:{ padding:8 },
  saveText:{ fontSize:16, fontWeight:'600' },
  content:{ padding:16 },
  dayRow:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:12, borderBottomWidth:StyleSheet.hairlineWidth },
  dayLeft:{ flexDirection:'row', alignItems:'center' },
  dayLabel:{ fontSize:16, width:40, fontWeight:'500' },
  timeControls:{ flexDirection:'row', alignItems:'center' },
  timeBox:{ paddingVertical:8, paddingHorizontal:14, borderRadius:8 },
  timeText:{ fontSize:14, fontWeight:'500' },
  helper:{ marginTop:24, fontSize:12, lineHeight:18 }
});
