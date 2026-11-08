import React, { useState } from 'react';
import { Modal, Pressable, Share, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../theme';
import { Card, Header, Label, Page, screenStyles as s } from '../../components/Screen';
import { useAppData } from '../../providers/AppProvider';

export default function ProfileScreen() {
  const { contacts, addContact, vehicle, rides } = useAppData();
  const [modal, setModal] = useState(false); const [name, setName] = useState(''); const [phone, setPhone] = useState('');
  const save = () => { if (!name.trim() || !phone.trim()) return; addContact({ name: name.trim(), phone: phone.trim() }); setName(''); setPhone(''); setModal(false); };
  return <Page>
    <Header title="Mi perfil" subtitle="Tu cuenta de MotoTracer." />
    <Card><View style={[s.row, { justifyContent: 'flex-start', gap: 14 }]}><View style={{ width: 58, height: 58, borderRadius: 30, backgroundColor: '#27323A', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: Colors.activeTelemetry, fontSize: 22, fontWeight: '900' }}>AB</Text></View><View><Text style={{ color: Colors.textPrimary, fontSize: 20, fontWeight: '800' }}>Abejandro</Text><Text style={s.muted}>Biker · Colombia</Text></View></View><View style={[s.row, { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12 }]}><Text style={s.muted}>Rodadas guardadas</Text><Text style={{ color: Colors.textPrimary, fontWeight: '800' }}>{rides.length}</Text></View></Card>
    <Label>MIS MOTOS</Label>
    <Card><View style={s.row}><View><Text style={{ color: Colors.textPrimary, fontWeight: '800', fontSize: 16 }}>{vehicle.make} {vehicle.model}</Text><Text style={s.muted}>{vehicle.year} · {vehicle.odometer.toLocaleString('es-CO')} km</Text></View><Text style={{ color: Colors.gpsOptimal, fontWeight: '700' }}>ACTIVA</Text></View><Pressable onPress={() => router.push('/garage')}><Text style={{ color: Colors.activeTelemetry, fontWeight: '700', paddingTop: 6 }}>Administrar garaje  ›</Text></Pressable></Card>
    <View style={s.row}><Label>CONTACTOS DE EMERGENCIA</Label><Pressable onPress={() => setModal(true)}><Text style={{ color: Colors.primaryAction, fontWeight: '800' }}>＋ Añadir</Text></Pressable></View>
    <Card><Text style={s.muted}>Se abrirá tu aplicación de mensajes con la ubicación y el texto preparados para que confirmes el envío.</Text>{contacts.length === 0 ? <Text style={{ color: Colors.warning, fontSize: 13, fontWeight: '700' }}>Añade un contacto para configurar el SOS.</Text> : contacts.map((person) => <View key={person.id} style={[s.row, { borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 9 }]}><Text style={{ color: Colors.textPrimary, fontWeight: '700' }}>{person.name}</Text><Text style={s.muted}>{person.phone}</Text></View>)}</Card>
    <Pressable onPress={() => router.push('/calibration')} style={s.secondary}><Text style={s.secondaryText}>Calibración del giroscopio</Text></Pressable>
    <Pressable onPress={() => Share.share({ message: 'MotoTracer · Sigue mis rutas en moto.' })} style={s.secondary}><Text style={s.secondaryText}>Compartir MotoTracer</Text></Pressable>
    <Text style={{ color: Colors.textTertiary, textAlign: 'center', fontSize: 11, padding: 8 }}>MotoTracer 1.0 · Datos guardados en este dispositivo</Text>
    <Modal transparent visible={modal} animationType="slide" onRequestClose={() => setModal(false)}><View style={{ flex: 1, backgroundColor: '#0009', justifyContent: 'flex-end' }}><View style={{ backgroundColor: Colors.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 22, gap: 12 }}><Text style={{ color: Colors.textPrimary, fontSize: 20, fontWeight: '800' }}>Contacto de emergencia</Text><TextInput placeholder="Nombre" placeholderTextColor={Colors.textTertiary} value={name} onChangeText={setName} style={{ color: Colors.textPrimary, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: 10 }} /><TextInput placeholder="Teléfono con código de país" placeholderTextColor={Colors.textTertiary} value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={{ color: Colors.textPrimary, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: 10 }} /><Pressable onPress={save} style={s.action}><Text style={s.actionText}>GUARDAR CONTACTO</Text></Pressable><Pressable onPress={() => setModal(false)}><Text style={{ color: Colors.textSecondary, textAlign: 'center', padding: 8 }}>Cancelar</Text></Pressable></View></View></Modal>
  </Page>;
}
