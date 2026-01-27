// Adicione isso junto com os outros imports
import * as ImageManipulator from 'expo-image-manipulator';
import React, { useRef } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, 
  Modal, Image, SafeAreaView, StatusBar 
} from 'react-native';
import { CameraView } from 'expo-camera';
import { useAppLogic } from './src/hooks/useAppLogic';

const COLORS = {
  azulBosco: '#002164',
  amareloBosco: '#FFEB3B',
  branco: '#FFFFFF',
  vermelhoAlerta: '#D32F2F',
  fundoTela: '#E8EAF6'
};

export default function App() {
  const { states, setters, actions } = useAppLogic();
  // Referência para controlar a câmera (tirar foto)
  const cameraRef = useRef(null);

  // Função para tirar a foto quando apertar o botão
// Função para tirar a foto e reduzir o tamanho (Otimizada)
  const tirarFotoAgora = async () => {
    if (cameraRef.current) {
      try {
        // 1. Tira a foto bruta
        const photo = await cameraRef.current.takePictureAsync({ 
          quality: 0.5, // Já tira com qualidade média
          skipProcessing: true // Tira mais rápido
        });

        // 2. Processa a redução (Resize)
        // Reduzimos para 600px de largura (aprox. 33% ou menos de uma foto normal)
        const fotoReduzida = await ImageManipulator.manipulateAsync(
          photo.uri,
          [{ resize: { width: 600 } }], // Aqui está a mágica: fixa a largura em 600px
          { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
        );

        // 3. Salva a versão leve
        setters.setFotoUri(fotoReduzida.uri);
        setters.setCameraVisible(false); // Fecha a câmera
      } catch (e) {
        console.log("Erro ao tirar foto:", e);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={COLORS.azulBosco} barStyle="light-content" />
      
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>De Olho na Validade</Text>
        <Image source={require('./src/assets/logo.png')} style={styles.headerLogo} />
      </View>

      {/* LISTA */}
      <FlatList
        data={states.produtos}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
        renderItem={({ item }) => {
          const styleConfig = actions.getCardStyle(item.data_validade, COLORS);
          return (
            <View style={[styles.card, { backgroundColor: styleConfig.bg, borderColor: styleConfig.border }]}>
              {/* Foto (igual estava) */}
              {item.foto_uri ? (
                <Image source={{ uri: item.foto_uri }} style={styles.thumb} />
              ) : (
                <View style={[styles.placeholderThumb, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={{fontSize: 20}}>📷</Text>
                </View>
              )}
              
              {/* Infos (igual estava) */}
              <View style={styles.info}>
                <Text style={[styles.prodName, { color: styleConfig.text }]}>{item.nome}</Text>
                <Text style={{ color: styleConfig.text, opacity: 0.9 }}>Vence em: {item.data_validade}</Text>
                {item.ean ? <Text style={{ color: styleConfig.text, fontSize: 10, opacity: 0.8 }}>EAN: {item.ean}</Text> : null}
              </View>

              {/* --- BOTÕES DE AÇÃO --- */}
              <View style={{flexDirection: 'row'}}>
                {/* Botão EDITAR (Novo) */}
                <TouchableOpacity onPress={() => actions.handleEditar(item)} style={{marginRight: 15}}>
                  <Text style={[styles.deleteBtn, { color: styleConfig.text }]}>✏️</Text>
                </TouchableOpacity>

                {/* Botão EXCLUIR */}
                <TouchableOpacity onPress={() => actions.handleExcluir(item.id, item.notificacao_id)}>
                  <Text style={[styles.deleteBtn, { color: styleConfig.text }]}>🗑️</Text>
                </TouchableOpacity>
              </View>

            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={{textAlign: 'center', marginTop: 50, color: '#999'}}>Nenhum produto. Toque no +</Text>
        }
      />

      {/* FAB (Botão +) */}
      <TouchableOpacity style={styles.fab} onPress={() => setters.setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* MODAL CADASTRO */}
      <Modal visible={states.modalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {states.editingId ? 'Editar Produto' : 'Novo Produto'}
            </Text>
          
          <View style={styles.imageSection}>
             {states.fotoUri ? (
               <Image source={{ uri: states.fotoUri }} style={styles.previewImage} />
             ) : (
               <View style={styles.previewPlaceholder}><Text>Sem foto</Text></View>
             )}
             
             {/* --- AQUI ESTÃO OS DOIS BOTÕES SEPARADOS --- */}
             <View style={{flexDirection: 'row', gap: 10, width: '100%'}}>
                
                {/* Botão 1: Ler Código */}
                <TouchableOpacity 
                  style={[styles.btnScan, {flex: 1, backgroundColor: COLORS.azulBosco}]} 
                  onPress={() => { 
                    setters.setCameraMode('barcode');
                    setters.setScanned(false); 
                    setters.setCameraVisible(true); 
                  }}>
                   <Text style={styles.btnTextWhite}>📷 Ler Código</Text>
                </TouchableOpacity>

                {/* Botão 2: Tirar Foto */}
                <TouchableOpacity 
                  style={[styles.btnScan, {flex: 1, backgroundColor: COLORS.amareloBosco}]} 
                  onPress={() => { 
                    setters.setCameraMode('picture');
                    setters.setCameraVisible(true); 
                  }}>
                   <Text style={[styles.btnTextWhite, {color: COLORS.azulBosco}]}>📸 Tirar Foto</Text>
                </TouchableOpacity>

             </View>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Código EAN</Text>
            <TextInput style={styles.input} value={states.ean} onChangeText={setters.setEan} keyboardType="numeric" placeholder="Opcional" />

            <Text style={styles.label}>Nome do Produto</Text>
            <TextInput style={styles.input} value={states.nome} onChangeText={setters.setNome} />

            <Text style={styles.label}>Data de Validade</Text>
            <TextInput style={styles.input} value={states.validade} onChangeText={actions.handleChangeValidade} placeholder="DD/MM/AAAA" keyboardType="numeric" maxLength={10} />

            <View style={styles.actionButtons}>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={actions.fecharModal}>
                <Text style={styles.btnTextWhite}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={actions.handleSalvar}>
                <Text style={styles.btnTextBlue}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* MODAL CÂMERA (Única tela que muda comportamento) */}
      <Modal visible={states.cameraVisible} animationType="slide">
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          // Só ativa o scanner se o modo for 'barcode'
          onBarcodeScanned={states.cameraMode === 'barcode' && !states.scanned ? actions.handleBarCodeScanned : undefined}
        />
        
        {/* Se o modo for FOTO, mostra o botão de disparar */}
        {states.cameraMode === 'picture' && (
          <View style={styles.shutterContainer}>
            <TouchableOpacity onPress={tirarFotoAgora} style={styles.shutterBtnOuter}>
              <View style={styles.shutterBtnInner} />
            </TouchableOpacity>
          </View>
        )}

        {/* Texto de ajuda */}
        <View style={styles.cameraHeader}>
          <Text style={{color: '#fff', fontSize: 18, fontWeight: 'bold'}}>
            {states.cameraMode === 'barcode' ? 'Aponte para o código' : 'Tire uma foto do produto'}
          </Text>
        </View>

        <TouchableOpacity style={styles.closeCamera} onPress={() => setters.setCameraVisible(false)}>
          <Text style={{color: '#fff', fontSize: 18}}>Cancelar</Text>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.fundoTela },
  headerContainer: {
    backgroundColor: COLORS.azulBosco, paddingVertical: 15, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 4, borderBottomColor: COLORS.amareloBosco, elevation: 5, marginTop: 30
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.amareloBosco, flex: 1 },
  headerLogo: { width: 70, height: 70, resizeMode: 'contain' },
  card: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 15, marginVertical: 6, padding: 12, borderRadius: 10, borderWidth: 1, elevation: 3 },
  thumb: { width: 50, height: 50, borderRadius: 25, marginRight: 15, borderWidth: 1, borderColor: '#fff' },
  placeholderThumb: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  info: { flex: 1 },
  prodName: { fontWeight: 'bold', fontSize: 17, marginBottom: 2 },
  deleteBtn: { fontSize: 20, padding: 5 },
  fab: { position: 'absolute', width: 65, height: 65, alignItems: 'center', justifyContent: 'center', right: 20, bottom: 30, backgroundColor: COLORS.amareloBosco, borderRadius: 35, elevation: 8, borderWidth: 3, borderColor: COLORS.azulBosco },
  fabText: { fontSize: 35, color: COLORS.azulBosco, fontWeight: 'bold', marginTop: -4 },
  modalContent: { flex: 1, backgroundColor: '#fff', padding: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: COLORS.azulBosco, marginTop: 20 },
  imageSection: { alignItems: 'center', marginBottom: 20 },
  previewImage: { width: 100, height: 100, borderRadius: 10, marginBottom: 10, borderWidth: 2, borderColor: COLORS.azulBosco },
  previewPlaceholder: { width: 100, height: 100, backgroundColor: '#eee', borderRadius: 10, marginBottom: 10, justifyContent: 'center', alignItems: 'center' },
  form: { flex: 1 },
  label: { color: COLORS.azulBosco, marginBottom: 5, fontWeight: 'bold', fontSize: 16 },
  input: { borderWidth: 2, borderColor: COLORS.azulBosco, borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16, color: '#333', backgroundColor: '#f9f9f9' },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  btn: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center', marginHorizontal: 5, elevation: 2 },
  btnSave: { backgroundColor: COLORS.amareloBosco },
  btnCancel: { backgroundColor: '#d32f2f' },
  btnScan: { padding: 12, borderRadius: 8, alignItems: 'center', elevation: 2 },
  btnTextWhite: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  btnTextBlue: { color: COLORS.azulBosco, fontWeight: 'bold', fontSize: 16 },
  
  // CAMERA STYLES
  closeCamera: { position: 'absolute', bottom: 30, left: 20, backgroundColor: 'rgba(0,0,0,0.6)', padding: 15, borderRadius: 30 },
  cameraHeader: { position: 'absolute', top: 50, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 10 },
  
  // BOTÃO DISPARADOR (SHUTTER)
  shutterContainer: { position: 'absolute', bottom: 40, alignSelf: 'center' },
  shutterBtnOuter: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  shutterBtnInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' }
});