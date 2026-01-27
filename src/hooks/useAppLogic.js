import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import * as Notifications from 'expo-notifications';

// Importe a nova função atualizarProduto
import { initDB, salvarProduto, atualizarProduto, buscarProdutos, excluirProduto, buscarFotoPorEan } from '../services/db';
import { agendarNotificacao, cancelarNotificacao } from '../services/notifications';
import { buscarProdutoGlobal, salvarProdutoGlobal } from '../services/cloud'; 

export const useAppLogic = () => {
  const [permission, requestPermission] = useCameraPermissions();

  const [modalVisible, setModalVisible] = useState(false);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraMode, setCameraMode] = useState('barcode');
  const [scanned, setScanned] = useState(false);
  const [produtos, setProdutos] = useState([]);

  // Controle de Edição (Novo Estado)
  const [editingId, setEditingId] = useState(null); // Null = Criando Novo, Número = Editando
  const [oldNotifId, setOldNotifId] = useState(null); // Guarda o ID da notificação antiga para cancelar

  const [ean, setEan] = useState('');
  const [nome, setNome] = useState('');
  const [validade, setValidade] = useState('');
  const [fotoUri, setFotoUri] = useState(null);

  useEffect(() => {
    (async () => {
      if (!permission) await requestPermission();
      await initDB();
      carregarLista();
    })();
  }, []);

  const carregarLista = async () => {
    try {
      const lista = await buscarProdutos();
      setProdutos(lista);
    } catch (e) { console.error(e); }
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (cameraMode !== 'barcode') return;
    setScanned(true);
    setCameraVisible(false);
    setEan(data);

    const dadosLocais = await buscarFotoPorEan(data);
    if (dadosLocais) {
      Alert.alert("Histórico", "Produto encontrado no seu histórico.");
      if (dadosLocais.foto_uri) setFotoUri(dadosLocais.foto_uri);
      if (dadosLocais.nome) setNome(dadosLocais.nome);
      return;
    }

    try {
      const dadosNuvem = await buscarProdutoGlobal(data);
      if (dadosNuvem) {
        Alert.alert("Nuvem ☁️", `Identificado: ${dadosNuvem.nome}`);
        setNome(dadosNuvem.nome);
      } else {
        Alert.alert("Novo Código", `Código ${data} lido com sucesso!`);
      }
    } catch (e) {}
  };

  // --- FUNÇÃO PARA ABRIR O MODAL NO MODO EDIÇÃO ---
  const handleEditar = (item) => {
    setEditingId(item.id);         // Avisa que estamos editando esse ID
    setOldNotifId(item.notificacao_id); // Guarda a notificação antiga
    setNome(item.nome);
    setValidade(item.data_validade);
    setEan(item.ean || '');
    setFotoUri(item.foto_uri);
    setModalVisible(true); // Abre o modal já preenchido
  };

  const handleSalvar = async () => {
    if (!nome || !validade) {
      Alert.alert("Atenção", "Preencha Nome e Validade");
      return;
    }

    try {
      let finalUri = fotoUri;
      // Se a foto mudou e é nova (cache), move para permanente
      if (fotoUri && fotoUri.includes('Cache')) {
        const fileName = fotoUri.split('/').pop();
        const newPath = FileSystem.documentDirectory + fileName;
        await FileSystem.moveAsync({ from: fotoUri, to: newPath });
        finalUri = newPath;
      }

      // Se estava editando, cancela a notificação antiga antes de criar a nova
      if (editingId && oldNotifId) {
        await cancelarNotificacao(oldNotifId);
      }

      // Cria a nova notificação com a data (nova ou igual)
      const notifId = await agendarNotificacao(nome, validade);

      const produtoDados = {
        ean, nome, descricao: '', quantidade: 1,
        dataValidade: validade, fotoUri: finalUri, notificacaoId: notifId
      };

      if (editingId) {
        // --- ATUALIZAR (UPDATE) ---
        await atualizarProduto(editingId, produtoDados);
        Alert.alert("Atualizado", "Produto editado com sucesso!");
      } else {
        // --- CRIAR NOVO (INSERT) ---
        await salvarProduto(produtoDados);
        if (ean) salvarProdutoGlobal(ean, nome);
        Alert.alert("Sucesso", "Produto registrado!");
      }

      fecharModal();
      carregarLista();
    } catch (e) {
      console.error(e);
      Alert.alert("Erro", "Falha ao salvar.");
    }
  };

  const handleExcluir = (id, notifId) => {
    Alert.alert("Excluir", "Remover este produto?", [
      { text: "Cancelar" },
      { text: "Sim", onPress: async () => {
          if (notifId) await cancelarNotificacao(notifId);
          await excluirProduto(id);
          carregarLista();
      }}
    ]);
  };

  const fecharModal = () => {
    setModalVisible(false);
    // Limpa tudo para a próxima vez
    setEditingId(null); 
    setOldNotifId(null);
    setEan(''); setNome(''); setValidade(''); setFotoUri(null); setScanned(false);
  };

  const handleChangeValidade = (text) => {
    let cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length >= 3) cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    if (cleaned.length >= 6) cleaned = cleaned.slice(0, 5) + '/' + cleaned.slice(5, 9);
    setValidade(cleaned);
  };

  const getCardStyle = (dataStr, COLORS) => {
    if (!dataStr) return { bg: COLORS.azulBosco, text: COLORS.branco, border: COLORS.azulBosco };
    const [d, m, a] = dataStr.split('/');
    const diff = new Date(a, m - 1, d) - new Date();
    const days = Math.ceil(diff / (86400000));
    if (days < 0) return { bg: COLORS.vermelhoAlerta, text: COLORS.branco, border: COLORS.vermelhoAlerta };
    if (days <= 7) return { bg: COLORS.amareloBosco, text: COLORS.azulBosco, border: '#FBC02D' };
    return { bg: COLORS.azulBosco, text: COLORS.branco, border: COLORS.azulBosco };
  };

  return {
    states: { modalVisible, cameraVisible, cameraMode, scanned, produtos, ean, nome, validade, fotoUri, editingId },
    setters: { setModalVisible, setCameraVisible, setCameraMode, setScanned, setEan, setNome, setValidade, setFotoUri },
    actions: { handleBarCodeScanned, handleSalvar, handleExcluir, handleEditar, fecharModal, handleChangeValidade, getCardStyle }
  };
};