import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Modal, Image, StatusBar, SafeAreaView } from 'react-native';
import { initDB, salvarProduto, buscarProdutos, excluirProduto } from './src/services/db';

const COLORS = {
  azulBosco: '#4CAF50',
  amareloBosco: '#FFC107',
  fundoTela: '#FAFAFA',
  vermelho: '#E53935',
  branco: '#FFFFFF'
};

export default function App() {
  const [produtos, setProdutos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [nome, setNome] = useState('');
  const [validade, setValidade] = useState('');

  // Ao abrir o app
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

  const handleSalvar = async () => {
    if (nome && validade) {
      await salvarProduto(nome, validade);
      setModalVisible(false);
      setNome('');
      setValidade('');
      carregarLista();
    }
  };

  const handleExcluir = async (id) => {
    await excluirProduto(id);
    carregarLista();
  };

  // Formata data enquanto digita (DD/MM/AAAA)
  const formatarData = (text) => {
    let v = text.replace(/\D/g, '');
    if (v.length > 2) v = v.replace(/^(\d{2})(\d)/, '$1/$2');
    if (v.length > 5) v = v.replace(/^(\d{2})\/(\d{2})(\d)/, '$1/$2/$3');
    setValidade(v);
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      {/* HEADER SIMPLES */}
      <View style={styles.header}>
        <Image source={require('./src/assets/logo.png')} style={styles.logo} />
      </View>

      {/* LISTA DE PRODUTOS */}
      <FlatList
        data={produtos}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 20 }}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum produto cadastrado.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.cardTitle}>{item.nome}</Text>
              <Text style={styles.cardDate}>Vence em: {item.data_validade}</Text>
            </View>
            <TouchableOpacity onPress={() => handleExcluir(item.id)}>
              <Text style={styles.deleteBtn}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* BOTÃO ADICIONAR */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* MODAL DE CADASTRO MANUAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo Produto</Text>
            
            <TextInput 
              placeholder="Nome do Produto" 
              style={styles.input} 
              value={nome} 
              onChangeText={setNome} 
            />
            
            <TextInput 
              placeholder="Validade (DD/MM/AAAA)" 
              style={styles.input} 
              value={validade} 
              onChangeText={formatarData} 
              keyboardType="numeric" 
              maxLength={10}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.vermelho }]} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.azulBosco }]} onPress={handleSalvar}>
                <Text style={styles.btnText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fundoTela },
  header: { 
    height: 100, 
    backgroundColor: COLORS.azulBosco, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingTop: 30,
    borderBottomWidth: 4,
    borderBottomColor: COLORS.amareloBosco
  },
  logo: { width: 120, height: 60, resizeMode: 'contain' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999', fontSize: 16 },
  card: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 10, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    elevation: 2 
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cardDate: { color: '#666' },
  deleteBtn: { fontSize: 24 },
  fab: { 
    position: 'absolute', 
    bottom: 30, 
    right: 20, 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: COLORS.amareloBosco, 
    justifyContent: 'center', 
    alignItems: 'center', 
    elevation: 5,
    borderWidth: 2,
    borderColor: COLORS.azulBosco
  },
  fabText: { fontSize: 30, color: COLORS.azulBosco, fontWeight: 'bold', marginTop: -4 },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 15, padding: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: COLORS.azulBosco },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  btn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
