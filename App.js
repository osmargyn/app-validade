import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Modal, Image, StatusBar, Platform, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { initDB, salvarProduto, buscarProdutos, excluirProduto } from './src/services/db';

// Cores baseadas na sua imagem (83795.jpg)
const COLORS = {
  azulMarinho: '#0D1B2A', // Ler Código
  amarelo: '#FFEB3B',     // Salvar / Tirar Foto
  vermelho: '#D32F2F',    // Cancelar
  cinzaFundo: '#E0E0E0',  // Box da Foto
  bordaInput: '#0D1B2A',  // Borda azul escura
  branco: '#FFFFFF',
  texto: '#000000'
};

export default function App() {
  const [produtos, setProdutos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Dados do Formulário
  const [nome, setNome] = useState('');
  const [ean, setEan] = useState('');
  const [validade, setValidade] = useState('');
  
  // Controle do Calendário
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    async function iniciar() {
      await initDB();
      carregarLista();
    }
    iniciar();
  }, []);

  const carregarLista = async () => {
    const lista = await buscarProdutos();
    setProdutos(lista);
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false); // Fecha o calendário
    if (selectedDate) {
      setDate(selectedDate);
      // Formata para DD/MM/AAAA
      const dia = selectedDate.getDate().toString().padStart(2, '0');
      const mes = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const ano = selectedDate.getFullYear();
      setValidade(`${dia}/${mes}/${ano}`);
    }
  };

  const handleSalvar = async () => {
    if (nome && validade) {
      // Por enquanto salvamos sem EAN e Foto (Passo 3)
      await salvarProduto(nome, validade); 
      setModalVisible(false);
      limparCampos();
      carregarLista();
    } else {
      Alert.alert("Ops!", "Preencha o nome e a validade.");
    }
  };

  const limparCampos = () => {
    setNome('');
    setEan('');
    setValidade('');
    setDate(new Date());
  };

  const handleExcluir = async (id) => {
    await excluirProduto(id);
    carregarLista();
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.azulMarinho} barStyle="light-content" />
      
      {/* HEADER PRINCIPAL */}
      <View style={styles.header}>
        <Image source={require('./src/assets/logo.png')} style={styles.logo} />
      </View>

      {/* LISTA DE PRODUTOS */}
      <FlatList
        data={produtos}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={styles.emptyText}>Toque no + para começar!</Text>}
        renderItem={({ item }) => (
          <View style={styles.cardItem}>
            <View>
              <Text style={styles.cardTitle}>{item.nome}</Text>
              <Text style={styles.cardDate}>Vence: {item.data_validade}</Text>
            </View>
            <TouchableOpacity onPress={() => handleExcluir(item.id)}>
              <Text style={{ fontSize: 20 }}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* BOTÃO FLUTUANTE (+) */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* --- MODAL DE CADASTRO (IGUAL À FOTO) --- */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View style={styles.modalContent}>
          
          <Text style={styles.modalTitle}>Novo Produto</Text>

          {/* ÁREA DA FOTO (Placeholder) */}
          <View style={styles.photoContainer}>
            <View style={styles.photoPlaceholder}>
              <Text style={{ color: '#666' }}>Sem foto</Text>
            </View>
          </View>

          {/* BOTÕES DE CÂMERA (Visuais por enquanto) */}
          <View style={styles.cameraButtonsRow}>
            <TouchableOpacity style={[styles.btnAction, { backgroundColor: COLORS.azulMarinho }]} onPress={() => Alert.alert("Passo 3", "Câmera será ativada no próximo passo!")}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>📷 Ler Código</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.btnAction, { backgroundColor: COLORS.amarelo }]} onPress={() => Alert.alert("Passo 3", "Foto será ativada no próximo passo!")}>
              <Text style={{ color: COLORS.texto, fontWeight: 'bold' }}>📸 Tirar Foto</Text>
            </TouchableOpacity>
          </View>

          {/* FORMULÁRIO */}
          <Text style={styles.label}>Código EAN</Text>
          <TextInput 
            style={styles.input} 
            value={ean} 
            onChangeText={setEan}
            placeholder="Opcional"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Nome do Produto</Text>
          <TextInput 
            style={styles.input} 
            value={nome} 
            onChangeText={setNome}
          />

          <Text style={styles.label}>Data de Validade</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <View pointerEvents="none">
              <TextInput 
                style={styles.input} 
                value={validade} 
                placeholder="DD/MM/AAAA"
                editable={false} // Bloqueia digitação manual para forçar calendário
              />
            </View>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onChangeDate}
              minimumDate={new Date()}
            />
          )}

          {/* BOTÕES DE AÇÃO (CANCELAR / SALVAR) */}
          <View style={styles.footerButtons}>
            <TouchableOpacity style={[styles.btnFooter, { backgroundColor: COLORS.vermelho }]} onPress={() => setModalVisible(false)}>
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btnFooter, { backgroundColor: COLORS.amarelo }]} onPress={handleSalvar}>
              <Text style={{ color: COLORS.texto, fontWeight: 'bold' }}>Salvar</Text>
            </TouchableOpacity>
          </View>

        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    height: 90,
    backgroundColor: COLORS.azulMarinho,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
    elevation: 5
  },
  logo: { width: 140, height: 60, resizeMode: 'contain' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
  
  // Estilos da Lista
  cardItem: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEE',
    elevation: 2
  },
  cardTitle: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  cardDate: { color: '#666', marginTop: 2 },

  // Botão Flutuante (+)
  fab: {
    position: 'absolute',
    bottom: 25,
    right: 20,
    width: 65,
    height: 65,
    borderRadius: 35,
    backgroundColor: COLORS.amarelo,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    borderWidth: 2,
    borderColor: COLORS.azulMarinho
  },
  fabText: { fontSize: 30, fontWeight: 'bold', color: COLORS.azulMarinho, marginTop: -3 },

  // --- ESTILOS DO MODAL (Igual Foto) ---
  modalContent: { flex: 1, padding: 25, backgroundColor: '#FFF' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.azulMarinho, textAlign: 'center', marginBottom: 20, marginTop: 10 },
  
  photoContainer: { alignItems: 'center', marginBottom: 15 },
  photoPlaceholder: { width: 100, height: 100, backgroundColor: COLORS.cinzaFundo, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  
  cameraButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 10 },
  btnAction: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', elevation: 2 },

  label: { fontWeight: 'bold', color: COLORS.azulMarinho, marginBottom: 5, fontSize: 16 },
  input: { 
    borderWidth: 2, 
    borderColor: COLORS.bordaInput, 
    borderRadius: 8, 
    padding: 10, 
    marginBottom: 15, 
    fontSize: 16,
    color: '#333'
  },

  footerButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 15 },
  btnFooter: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center', elevation: 3 }
});
