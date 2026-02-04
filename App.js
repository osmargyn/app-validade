import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, Modal, Image, StatusBar, Alert, Platform, ScrollView, Share, BackHandler, Linking } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as NavigationBar from 'expo-navigation-bar';
import * as Notifications from 'expo-notifications';
import { writeAsStringAsync, documentDirectory, readAsStringAsync } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import Constants from 'expo-constants';
import * as IntentLauncher from 'expo-intent-launcher';

// Importações DB
import { initDB, salvarProduto, atualizarProduto, buscarProdutos, buscarProdutosArquivados, restaurarProdutoArquivado, buscarProdutoPorEAN, excluirProduto, salvarConfiguracao, buscarConfiguracao, pegarDadosCompletos, importarDadosJSON, limparVencidosAntigos, arquivarProdutos } from './src/services/db';

const COLORS = {
  azulMarinho: '#0D1B2A',
  amarelo: '#FFEB3B',
  vermelho: '#D32F2F',
  verde: '#2E7D32',
  cinzaFundo: '#E0E0E0',
  bordaInput: '#0D1B2A',
  branco: '#FFFFFF',
  texto: '#000000',
  laranja: '#F57C00'
};

// Config Notification
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
});

// Idioma
const getSystemLocale = () => {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const langCode = locale.split('-')[0];
    const supported = ['pt', 'en', 'es', 'fr', 'it', 'ru'];
    return supported.includes(langCode) ? langCode : 'en';
  } catch (e) { return 'en'; }
};

const TEXTS = {
  pt: {
    back: "Voltar", settings: "Configurações", notifications: "Notificações", remindMe: "Me lembre", daysBefore: "dias antes de vencer.", atTime: "às", change: "Alterar", chooseDays: "Escolha os dias", chooseTime: "Escolha o horário", close: "Fechar", backupData: "Backup de Dados", createBackup: "☁️ Criar Backup", restoreBackup: "📥 Restaurar Backup", about: "Sobre", version: "Versão", marketEdition: "Edição Mercado", devBy: "Desenvolvido por", updated: "Atualizado em", expired: "Vencidos", expiring: "Vencendo", good: "No Prazo", emptyList: "Lista vazia.", modeSelection: "MODO DE SELEÇÃO ATIVO", modeInstruction: "Toque nos itens para adicionar à lista de baixa.", sendList: "Enviar Lista 📤", newProduct: "Novo Produto", editProduct: "Editar Produto", noPhoto: "Sem foto", scanCode: "📷 Ler Código", takePhoto: "📸 Tirar Foto", ean: "EAN", quantity: "Quantidade", stock: "Estoque", name: "Nome do Produto", validity: "Data de Validade", cancel: "Cancelar", save: "Salvar", alertTitle: "Atenção", fillFields: "Preencha Nome e Validade.", backupError: "Erro no Backup", restoreConfirm: "Isso substituirá os dados atuais. Continuar?", restoreSuccess: "Dados restaurados!", restoreError: "Arquivo inválido.", found: "Encontrado!", foundMsg: "Dados carregados. Informe a nova validade.", emptySelection: "Selecione pelo menos um item.", shareTitle: "*LISTA DE BAIXA / TROCA*", date: "Data", notificationTitle: "Produto Vencendo!", notificationBody: "vence em breve.", permError: "Permissão de notificação negada.", archived: "Itens Arquivados", archivedMsg: "Produtos enviados na lista. Eles serão excluídos 5 dias após o vencimento.", restore: "Restaurar", permissionAlarm: "Permissão de Alarme", permissionAlarmMsg: "Para notificar na hora exata, precisamos dessa permissão."
  },
  en: {
    back: "Back", settings: "Settings", notifications: "Notifications", remindMe: "Remind me", daysBefore: "days before expiration.", atTime: "at", change: "Change", chooseDays: "Choose days", chooseTime: "Choose time", close: "Close", backupData: "Data Backup", createBackup: "☁️ Create Backup", restoreBackup: "📥 Restore Backup", about: "About", version: "Version", marketEdition: "Market Edition", devBy: "Developed by", updated: "Updated on", expired: "Expired", expiring: "Expiring", good: "Fresh", emptyList: "List is empty.", modeSelection: "SELECTION MODE ACTIVE", modeInstruction: "Tap items to add to removal list.", sendList: "Send List 📤", newProduct: "New Product", editProduct: "Edit Product", noPhoto: "No photo", scanCode: "📷 Scan Code", takePhoto: "📸 Take Photo", ean: "EAN", quantity: "Quantity", stock: "Stock", name: "Product Name", validity: "Expiry Date", cancel: "Cancel", save: "Save", alertTitle: "Attention", fillFields: "Fill Name and Expiry Date.", backupError: "Backup Error", restoreConfirm: "This will replace current data. Continue?", restoreSuccess: "Data restored!", restoreError: "Invalid file.", found: "Found!", foundMsg: "Data loaded. Please set new expiry date.", emptySelection: "Select at least one item.", shareTitle: "*REMOVAL / EXCHANGE LIST*", date: "Date", notificationTitle: "Product Expiring!", notificationBody: "is expiring soon.", permError: "Notification permission denied.", archived: "Archived Items", archivedMsg: "Items sent in list. Deleted 5 days after expiry.", restore: "Restore", permissionAlarm: "Alarm Permission", permissionAlarmMsg: "To notify at exact time, we need permission."
  }
};

export default function App() {
  const [lang, setLang] = useState('pt');
  const t = (key) => TEXTS[lang] ? TEXTS[lang][key] : TEXTS['pt'][key];

  const [tela, setTela] = useState('home'); 
  const [produtos, setProdutos] = useState([]);
  const [produtosArquivados, setProdutosArquivados] = useState([]);
  const [produtosFiltrados, setProdutosFiltrados] = useState([]); 
  const [filtroAtivo, setFiltroAtivo] = useState('todos');

  const [modoSelecao, setModoSelecao] = useState(false);
  const [itensSelecionados, setItensSelecionados] = useState({});

  const [modalVisible, setModalVisible] = useState(false);
  const [modalDiasVisible, setModalDiasVisible] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [modalArquivadosVisible, setModalArquivadosVisible] = useState(false);
  
  const [counts, setCounts] = useState({ vencidos: 0, vencendo: 0, bons: 0 });

  const [idEdicao, setIdEdicao] = useState(null);
  const [nome, setNome] = useState('');
  const [ean, setEan] = useState('');
  const [validade, setValidade] = useState('');
  const [quantidade, setQuantidade] = useState('1'); 
  const [fotoUri, setFotoUri] = useState(null); 
  
  const [diasAviso, setDiasAviso] = useState('5');
  const [horaAviso, setHoraAviso] = useState('08:00');

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraMode, setCameraMode] = useState('barcode');
  const [scanned, setScanned] = useState(false);
  const cameraRef = useRef(null);

  useEffect(() => {
    async function iniciar() {
      setLang(getSystemLocale());
      if (Platform.OS === 'android') {
        try { await NavigationBar.setVisibilityAsync("hidden"); await NavigationBar.setBehaviorAsync("overlay-swipe"); } catch (e) {}
      }
      await initDB();
      await limparVencidosAntigos();
      carregarConfig();
      carregarLista();
      if (!permission) await requestPermission();
      await registerForPushNotificationsAsync();
    }
    iniciar();
  }, []);

  async function registerForPushNotificationsAsync() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') Alert.alert("Aviso", t('permError'));
  }

  // --- SOLICITAÇÃO PERMISSÃO ALARME EXATO (ANDROID 12+) ---
  const verificarPermissaoAlarme = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 31) {
        // Tenta abrir as configurações de alarme
        Alert.alert(
            t('permissionAlarm'),
            t('permissionAlarmMsg'),
            [
                { text: t('cancel'), style: 'cancel' },
                { text: "Abrir Configurações", onPress: () => {
                    if (Platform.OS === 'android') {
                        IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.REQUEST_SCHEDULE_EXACT_ALARM);
                    }
                }}
            ]
        );
    }
  };

  async function agendarNotificacao(nomeProduto, dataValidadeStr) {
    try {
        const [dia, mes, ano] = dataValidadeStr.split('/').map(Number);
        const dataValidade = new Date(ano, mes - 1, dia);
        const diasAntes = parseInt(diasAviso);
        
        const [hora, minuto] = horaAviso.split(':').map(Number);

        const dataAviso = new Date(dataValidade);
        dataAviso.setDate(dataValidade.getDate() - diasAntes);
        dataAviso.setHours(hora, minuto, 0, 0);

        const agora = new Date();
        if (dataAviso > agora) {
            await Notifications.scheduleNotificationAsync({
                content: { title: t('notificationTitle'), body: `${nomeProduto} ${t('notificationBody')}` },
                trigger: { date: dataAviso },
            });
        }
    } catch (e) { console.log("Erro ao agendar:", e); }
  }

  // BackHandler
  useEffect(() => {
    const backAction = () => {
      if (modoSelecao) { setModoSelecao(false); setItensSelecionados({}); return true; }
      if (modalVisible) { setModalVisible(false); return true; }
      if (modalDiasVisible) { setModalDiasVisible(false); return true; }
      if (modalArquivadosVisible) { setModalArquivadosVisible(false); return true; }
      if (cameraVisible) { setCameraVisible(false); return true; }
      if (tela === 'config') { setTela('home'); return true; }
      return false; 
    };
    BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => BackHandler.removeEventListener('hardwareBackPress', backAction);
  }, [modoSelecao, modalVisible, modalDiasVisible, modalArquivadosVisible, cameraVisible, tela]);

  useEffect(() => { calcularDashboardEFiltrar(); }, [produtos, diasAviso, filtroAtivo]);

  const carregarLista = async () => { const lista = await buscarProdutos(); setProdutos(lista); };
  
  const carregarArquivados = async () => { 
      const lista = await buscarProdutosArquivados(); 
      setProdutosArquivados(lista);
      setModalArquivadosVisible(true);
  };

  const carregarConfig = async () => { 
      const conf = await buscarConfiguracao(); 
      setDiasAviso(conf.dias); 
      setHoraAviso(conf.hora);
  };

  const selecionarDias = async (numero) => {
    const strNum = numero.toString();
    setDiasAviso(strNum);
    await salvarConfiguracao(strNum, horaAviso);
    setModalDiasVisible(false);
  };

  const selecionarHora = async (event, selectedDate) => {
    setShowTimePicker(false);
    if (selectedDate) {
        const h = selectedDate.getHours().toString().padStart(2, '0');
        const m = selectedDate.getMinutes().toString().padStart(2, '0');
        const novaHora = `${h}:${m}`;
        setHoraAviso(novaHora);
        await salvarConfiguracao(diasAviso, novaHora);
        // Sugere ativar permissão se mudou a hora
        verificarPermissaoAlarme();
    }
  };

  const toggleModoSelecao = () => { if (modoSelecao) { setModoSelecao(false); setItensSelecionados({}); } else { setModoSelecao(true); setFiltroAtivo('todos'); setItensSelecionados({}); } };
  const toggleSelecaoItem = (item) => { const n = { ...itensSelecionados }; if (n[item.id]) delete n[item.id]; else n[item.id] = item.quantidade || 1; setItensSelecionados(n); };
  const alterarQtdSelecao = (id, delta) => { const n = { ...itensSelecionados }; if (n[id]) { const k = n[id] + delta; if (k > 0) n[id] = k; setItensSelecionados(n); } };
  
  const compartilharLista = async () => {
    const ids = Object.keys(itensSelecionados);
    if (ids.length === 0) { Alert.alert(t('alertTitle'), t('emptySelection')); return; }
    let msg = `${t('shareTitle')}\n\n${t('date')}: ${new Date().toLocaleDateString(lang==='pt'?'pt-BR':'en-US')}\n----------------------\n`;
    ids.forEach(id => { const p = produtos.find(x => x.id.toString() === id); if (p) msg += `${p.ean?`[${p.ean}] `:"[S/ EAN] "}${p.nome}\nQtd: ${itensSelecionados[id]} | Val: ${p.data_validade}\n- - - - - - - - - -\n`; });
    try { await Share.share({ message: msg }); await arquivarProdutos(ids); setItensSelecionados({}); setModoSelecao(false); carregarLista(); } catch (e) { Alert.alert("Erro", e.message); }
  };

  const verificarProdutoExistente = async (c) => { if (!c) return; const p = await buscarProdutoPorEAN(c); if (p) { setNome(p.nome); if (p.foto_uri) setFotoUri(p.foto_uri); Alert.alert(t('found'), `${t('foundMsg')} ("${p.nome}")`); } };
  const aoTerminarDigitarEAN = () => { verificarProdutoExistente(ean); };
  const getStatusProduto = (dStr) => { if (!dStr) return 'bom'; const [d, m, a] = dStr.split('/').map(Number); const diff = Math.ceil((new Date(a, m - 1, d) - new Date().setHours(0,0,0,0)) / 86400000); if (diff < 0) return 'vencido'; if (diff <= parseInt(diasAviso)) return 'vencendo'; return 'bom'; };
  const calcularDashboardEFiltrar = () => { let v=0, va=0, b=0; produtos.forEach(p => { const s = getStatusProduto(p.data_validade); if (s === 'vencido') v++; else if (s === 'vencendo') va++; else b++; }); setCounts({ vencidos: v, vencendo: va, bons: b }); if (filtroAtivo === 'todos') setProdutosFiltrados(produtos); else setProdutosFiltrados(produtos.filter(p => getStatusProduto(p.data_validade) === filtroAtivo)); };
  const toggleFiltro = (f) => { if (modoSelecao) return; if (filtroAtivo === f) setFiltroAtivo('todos'); else setFiltroAtivo(f); };
  
  const handleEditar = (item) => { if (modoSelecao) { toggleSelecaoItem(item); return; } setIdEdicao(item.id); setNome(item.nome); setValidade(item.data_validade); setEan(item.ean || ''); setQuantidade(item.quantidade ? item.quantidade.toString() : '1'); setFotoUri(item.foto_uri); setModalVisible(true); };
  const handleSalvar = async () => { if (nome && validade) { const d = { nome, data_validade: validade, ean, foto_uri: fotoUri, quantidade: quantidade ? parseInt(quantidade) : 1 }; if (idEdicao) await atualizarProduto({ id: idEdicao, ...d }); else { const pid = await salvarProduto(d); if (pid) await agendarNotificacao(nome, validade); } setModalVisible(false); limparCampos(); carregarLista(); } else Alert.alert(t('alertTitle'), t('fillFields')); };
  const limparCampos = () => { setIdEdicao(null); setNome(''); setEan(''); setValidade(''); setQuantidade('1'); setFotoUri(null); setDate(new Date()); };
  const handleBackup = async () => { try { const d = await pegarDadosCompletos(); if (!d) return; const f = documentDirectory + 'backup_validade.json'; await writeAsStringAsync(f, JSON.stringify(d)); if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(f); else Alert.alert("Erro", "Indisponível"); } catch (e) { Alert.alert(t('backupError'), e.message); } };
  const handleRestaurar = async () => { Alert.alert(t('alertTitle'), t('restoreConfirm'), [{ text: t('cancel'), style: "cancel" }, { text: t('restoreSuccess'), onPress: async () => { try { const r = await DocumentPicker.getDocumentAsync({ type: 'application/json' }); if (!r.canceled && r.assets) { const c = await readAsStringAsync(r.assets[0].uri); if (await importarDadosJSON(JSON.parse(c))) { Alert.alert("Sucesso", t('restoreSuccess')); carregarLista(); carregarConfig(); } else Alert.alert("Erro", t('restoreError')); } } catch (e) { Alert.alert("Erro", "Falha."); } } }]); };
  const abrirCamera = (m) => { setCameraMode(m); setScanned(false); setCameraVisible(true); };
  const handleBarCodeScanned = async ({ type, data }) => { setScanned(true); setEan(data); setCameraVisible(false); await verificarProdutoExistente(data); };
  const tirarFoto = async () => { if (cameraRef.current) { try { const p = await cameraRef.current.takePictureAsync({ quality: 0.5, skipProcessing: true }); setFotoUri(p.uri); setCameraVisible(false); } catch (e) { Alert.alert("Erro", "Foto falhou."); } } };
  const onChangeDate = (e, s) => { setShowDatePicker(false); if (s) { setDate(s); setValidade(`${s.getDate().toString().padStart(2,'0')}/${(s.getMonth()+1).toString().padStart(2,'0')}/${s.getFullYear()}`); } };

  if (tela === 'config') {
    return (
      <View style={styles.container}>
        <StatusBar backgroundColor={COLORS.azulMarinho} barStyle="light-content" />
        <View style={styles.header}>
            <TouchableOpacity onPress={() => setTela('home')} style={{flexDirection: 'row', alignItems: 'center', padding: 10}}>
                <Text style={{fontSize: 28, color: COLORS.branco, fontWeight: 'bold', marginRight: 10}}>←</Text>
                <Text style={{fontSize: 20, color: COLORS.branco, fontWeight: 'bold'}}>{t('back')}</Text>
            </TouchableOpacity>
            <View style={{flex: 1}}/>
        </View>
        <ScrollView contentContainerStyle={{padding: 20}}>
            <Text style={styles.sectionTitle}>{t('notifications')}</Text>
            <View style={styles.cardConfig}>
                <Text style={{fontSize: 18, color: '#333', marginBottom: 10, textAlign: 'center'}}>
                    {t('remindMe')} <Text style={{fontWeight:'bold', color: COLORS.azulMarinho, fontSize: 24}}>[ {diasAviso} ]</Text> {t('daysBefore')}
                </Text>
                <Text style={{fontSize: 18, color: '#333', marginBottom: 20, textAlign: 'center'}}>
                    {t('atTime')} <Text style={{fontWeight:'bold', color: COLORS.azulMarinho, fontSize: 24}}>[ {horaAviso} ]</Text>
                </Text>
                
                <View style={{flexDirection:'row', justifyContent:'center', gap: 10}}>
                    <TouchableOpacity style={[styles.btnAction, {backgroundColor: COLORS.azulMarinho, width: 140}]} onPress={() => setModalDiasVisible(true)}>
                        <Text style={{color: '#FFF', fontWeight:'bold'}}>{t('change')} Dias</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btnAction, {backgroundColor: COLORS.azulMarinho, width: 140}]} onPress={() => setShowTimePicker(true)}>
                        <Text style={{color: '#FFF', fontWeight:'bold'}}>{t('change')} Hora</Text>
                    </TouchableOpacity>
                </View>
                {showTimePicker && (<DateTimePicker value={new Date()} mode="time" display="default" onChange={selecionarHora} is24Hour={true} />)}
            </View>

            <Text style={styles.sectionTitle}>{t('backupData')}</Text>
            <View style={styles.cardConfig}>
                <View style={{gap: 15}}>
                    <TouchableOpacity style={[styles.btnAction, {backgroundColor: COLORS.azulMarinho}]} onPress={handleBackup}><Text style={{color:'#fff', fontWeight:'bold', fontSize: 16}}>{t('createBackup')}</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.btnAction, {backgroundColor: COLORS.amarelo}]} onPress={handleRestaurar}><Text style={{color: COLORS.texto, fontWeight:'bold', fontSize: 16}}>{t('restoreBackup')}</Text></TouchableOpacity>
                    
                    {/* BOTAO PARA VER ARQUIVADOS */}
                    <TouchableOpacity style={[styles.btnAction, {backgroundColor: '#EEE', borderWidth: 1, borderColor: '#CCC'}]} onPress={carregarArquivados}>
                        <Text style={{color: '#333', fontWeight:'bold', fontSize: 16}}>📦 {t('archived')}</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Text style={styles.sectionTitle}>{t('about')}</Text>
            <View style={[styles.cardConfig, {alignItems: 'center'}]}>
                <Image source={require('./src/assets/logo.png')} style={{width: 100, height: 40, resizeMode:'contain', marginBottom: 10}} />
                <Text style={{fontWeight:'bold', fontSize: 16, color: COLORS.azulMarinho}}>De Olho na Validade</Text>
                <Text style={{color: '#666'}}>{t('version')} 2.2.0 ({t('marketEdition')})</Text>
                <View style={{height: 1, width: '100%', backgroundColor: '#eee', marginVertical: 10}} />
                <Text style={{color: '#888', fontSize: 12}}>{t('devBy')}</Text>
                <Text style={{fontWeight:'bold', color: '#333', fontSize: 16}}>Osmar Cruz</Text>
                <Text style={{color: '#888', fontSize: 10, marginTop: 5}}>{t('updated')} 02/02/2026</Text>
            </View>
        </ScrollView>

        <Modal visible={modalDiasVisible} animationType="fade" transparent={true}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContentSmall}>
                    <Text style={styles.modalTitle}>{t('chooseDays')}</Text>
                    <View style={styles.gridContainer}>
                        {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => (
                            <TouchableOpacity key={num} style={[styles.numButton, diasAviso === num.toString() && styles.numButtonSelected]} onPress={() => selecionarDias(num)}>
                                <Text style={[styles.numText, diasAviso === num.toString() && styles.numTextSelected]}>{num}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <TouchableOpacity style={{marginTop: 20}} onPress={() => setModalDiasVisible(false)}>
                        <Text style={{fontSize: 18, color: COLORS.azulMarinho, fontWeight: 'bold'}}>{t('close')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

        {/* MODAL DE ARQUIVADOS */}
        <Modal visible={modalArquivadosVisible} animationType="slide" transparent={false}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => setModalArquivadosVisible(false)} style={{flexDirection: 'row', alignItems: 'center', padding: 10}}>
                        <Text style={{fontSize: 28, color: COLORS.branco, fontWeight: 'bold', marginRight: 10}}>←</Text>
                        <Text style={{fontSize: 20, color: COLORS.branco, fontWeight: 'bold'}}>{t('back')}</Text>
                    </TouchableOpacity>
                    <Text style={{fontSize: 20, color: COLORS.branco, fontWeight: 'bold', marginRight: 20}}>📦 {t('archived')}</Text>
                </View>
                <View style={{padding: 15, backgroundColor: '#FFF3E0'}}>
                    <Text style={{color: '#E65100', textAlign:'center'}}>{t('archivedMsg')}</Text>
                </View>
                <FlatList
                    data={produtosArquivados}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ padding: 20 }}
                    ListEmptyComponent={<Text style={styles.emptyText}>{t('emptyList')}</Text>}
                    renderItem={({ item }) => (
                        <View style={[styles.cardItem, {opacity: 0.7}]}>
                            {item.foto_uri && <Image source={{ uri: item.foto_uri }} style={{width: 50, height: 50, borderRadius: 25, marginRight: 10}} />}
                            <View style={{flex: 1}}>
                                <Text style={styles.cardTitle}>{item.nome}</Text>
                                <Text style={styles.cardDate}>{t('validity')}: {item.data_validade}</Text>
                            </View>
                            <TouchableOpacity onPress={async () => { await restaurarProdutoArquivado(item.id); carregarArquivados(); carregarLista(); }} style={{marginRight: 15}}>
                                <Text style={{fontSize: 20}}>🔄</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={async () => { await excluirProduto(item.id); carregarArquivados(); }}>
                                <Text style={{fontSize: 20}}>🗑️</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.azulMarinho} barStyle="light-content" />
      <View style={styles.headerHome}>
        <Image source={require('./src/assets/logo.png')} style={styles.logo} />
        <View style={{flexDirection: 'row', gap: 15}}>
            <TouchableOpacity style={styles.gearButton} onPress={toggleModoSelecao}><Text style={{fontSize: 26}}>{modoSelecao ? '❌' : '📤'}</Text></TouchableOpacity>
            <TouchableOpacity style={styles.gearButton} onPress={() => setTela('config')}><Text style={{fontSize: 28}}>⚙️</Text></TouchableOpacity>
        </View>
      </View>

      {modoSelecao && (<View style={{backgroundColor: COLORS.amarelo, padding: 10, alignItems: 'center'}}><Text style={{fontWeight: 'bold', color: COLORS.azulMarinho}}>{t('modeSelection')}</Text><Text style={{fontSize: 12}}>{t('modeInstruction')}</Text></View>)}

      {!modoSelecao && (
        <View style={styles.dashboardContainer}>
            <TouchableOpacity style={[styles.dashCard, {backgroundColor: '#FFEBEE', borderColor: COLORS.vermelho}, filtroAtivo === 'vencido' && styles.dashCardActive]} onPress={() => toggleFiltro('vencido')}><Text style={{fontSize: 24}}>❌</Text><Text style={[styles.dashCount, {color: COLORS.vermelho}]}>{counts.vencidos}</Text><Text style={styles.dashLabel}>{t('expired')}</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.dashCard, {backgroundColor: '#FFFDE7', borderColor: '#FBC02D'}, filtroAtivo === 'vencendo' && styles.dashCardActive]} onPress={() => toggleFiltro('vencendo')}><Text style={{fontSize: 24}}>⚠️</Text><Text style={[styles.dashCount, {color: '#F57F17'}]}>{counts.vencendo}</Text><Text style={styles.dashLabel}>{t('expiring')}</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.dashCard, {backgroundColor: '#E8F5E9', borderColor: COLORS.verde}, filtroAtivo === 'bom' && styles.dashCardActive]} onPress={() => toggleFiltro('bom')}><Text style={{fontSize: 24}}>✅</Text><Text style={[styles.dashCount, {color: COLORS.verde}]}>{counts.bons}</Text><Text style={styles.dashLabel}>{t('good')}</Text></TouchableOpacity>
        </View>
      )}

      <FlatList
        data={produtosFiltrados}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        ListEmptyComponent={<Text style={styles.emptyText}>{t('emptyList')}</Text>}
        renderItem={({ item }) => {
            const status = getStatusProduto(item.data_validade);
            let corBorda = COLORS.verde; let corFundo = '#FFF';
            if (status === 'vencido') { corBorda = COLORS.vermelho; corFundo = '#FFEBEE'; }
            if (status === 'vencendo') { corBorda = COLORS.amarelo; corFundo = '#FFFDE7'; }
            const selecionado = !!itensSelecionados[item.id];
            
            return (
              <View style={[styles.cardItem, {borderLeftWidth: 6, borderLeftColor: corBorda, backgroundColor: corFundo}]}>
                {modoSelecao && (
                    <TouchableOpacity onPress={() => toggleSelecaoItem(item)} style={{padding: 10}}>
                        <View style={{width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: COLORS.azulMarinho, justifyContent: 'center', alignItems: 'center', backgroundColor: selecionado ? COLORS.azulMarinho : 'transparent'}}>
                            {selecionado && <Text style={{color: '#FFF', fontWeight: 'bold'}}>✓</Text>}
                        </View>
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={{flex: 1, flexDirection: 'row', alignItems: 'center'}} onPress={() => handleEditar(item)}>
                    {item.foto_uri && <Image source={{ uri: item.foto_uri }} style={{width: 50, height: 50, borderRadius: 25, marginRight: 10}} />}
                    <View style={{flex: 1}}>
                      <Text style={styles.cardTitle}>{item.nome}</Text>
                      <Text style={styles.cardDate}>{t('validity')}: {item.data_validade}</Text>
                      {modoSelecao && selecionado ? (
                         <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 5, backgroundColor: '#EEE', alignSelf: 'flex-start', borderRadius: 5}}>
                            <TouchableOpacity onPress={() => alterarQtdSelecao(item.id, -1)} style={{padding: 5, paddingHorizontal: 10}}><Text style={{fontSize: 20, fontWeight:'bold'}}>-</Text></TouchableOpacity>
                            <Text style={{fontWeight: 'bold', fontSize: 16, marginHorizontal: 5}}>{itensSelecionados[item.id] || 0}</Text>
                            <TouchableOpacity onPress={() => alterarQtdSelecao(item.id, 1)} style={{padding: 5, paddingHorizontal: 10}}><Text style={{fontSize: 20, fontWeight:'bold'}}>+</Text></TouchableOpacity>
                         </View>
                      ) : (
                         <View style={{flexDirection:'row', gap: 10}}>
                            <Text style={{fontSize: 12, fontWeight:'bold', color: COLORS.azulMarinho}}>{t('stock')}: {item.quantidade || 1}</Text>
                            {item.ean ? <Text style={{fontSize: 12, color: '#888'}}>{t('ean')}: {item.ean}</Text> : null}
                         </View>
                      )}
                    </View>
                    {!modoSelecao && <Text style={{fontSize: 16, marginRight: 15, opacity: 0.5}}>✏️</Text>}
                </TouchableOpacity>
                {!modoSelecao && <TouchableOpacity onPress={() => excluirProduto(item.id).then(carregarLista)} style={{padding: 5}}><Text style={{ fontSize: 22 }}>🗑️</Text></TouchableOpacity>}
              </View>
            );
        }}
      />

      {modoSelecao ? (
        <TouchableOpacity style={[styles.fab, {backgroundColor: COLORS.azulMarinho, width: 'auto', paddingHorizontal: 20, borderRadius: 10}]} onPress={compartilharLista}><Text style={{color: '#FFF', fontWeight: 'bold', fontSize: 18}}>{t('sendList')}</Text></TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.fab} onPress={() => { limparCampos(); setModalVisible(true); }}><Text style={styles.fabText}>+</Text></TouchableOpacity>
      )}

      {/* MANTENHA OS MODAIS DE CÂMERA E CADASTRO AQUI (IGUAIS AO ANTERIOR) */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{idEdicao ? t('editProduct') : t('newProduct')}</Text>
          <View style={styles.photoContainer}>{fotoUri ? <Image source={{ uri: fotoUri }} style={{ width: 120, height: 120, borderRadius: 10 }} /> : <View style={styles.photoPlaceholder}><Text style={{ color: '#666' }}>{t('noPhoto')}</Text></View>}</View>
          <View style={styles.cameraButtonsRow}>
            <TouchableOpacity style={[styles.btnAction, { backgroundColor: COLORS.azulMarinho }]} onPress={() => abrirCamera('barcode')}><Text style={{ color: '#FFF', fontWeight: 'bold' }}>{t('scanCode')}</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btnAction, { backgroundColor: COLORS.amarelo }]} onPress={() => abrirCamera('picture')}><Text style={{ color: COLORS.texto, fontWeight: 'bold' }}>{t('takePhoto')}</Text></TouchableOpacity>
          </View>
          <View style={{flexDirection:'row', gap: 10}}>
             <View style={{flex: 1}}><Text style={styles.label}>{t('ean')}</Text><TextInput style={styles.input} value={ean} onChangeText={setEan} onBlur={aoTerminarDigitarEAN} keyboardType="numeric" /></View>
             <View style={{flex: 1}}><Text style={styles.label}>{t('quantity')}</Text><TextInput style={styles.input} value={quantidade} onChangeText={setQuantidade} keyboardType="numeric" /></View>
          </View>
          <Text style={styles.label}>{t('name')}</Text><TextInput style={styles.input} value={nome} onChangeText={setNome} />
          <Text style={styles.label}>{t('validity')}</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)}><View pointerEvents="none"><TextInput style={styles.input} value={validade} placeholder="DD/MM/AAAA" editable={false} /></View></TouchableOpacity>
          {showDatePicker && <DateTimePicker value={date} mode="date" display="default" onChange={onChangeDate} minimumDate={new Date()} />}
          <View style={styles.footerButtons}>
            <TouchableOpacity style={[styles.btnFooter, { backgroundColor: COLORS.vermelho }]} onPress={() => setModalVisible(false)}><Text style={{ color: '#FFF', fontWeight: 'bold' }}>{t('cancel')}</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.btnFooter, { backgroundColor: COLORS.amarelo }]} onPress={handleSalvar}><Text style={{ color: COLORS.texto, fontWeight: 'bold' }}>{t('save')}</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={cameraVisible} animationType="slide">
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="back" barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_e", "upc_a", "code128", "code39", "itf14", "codabar", "pdf417", "aztec", "datamatrix"] }} onBarcodeScanned={cameraMode === 'barcode' && !scanned ? handleBarCodeScanned : undefined}>
            <View style={{flex: 1, justifyContent: 'flex-end', padding: 20, paddingBottom: 50}}>
                {cameraMode === 'picture' && (<TouchableOpacity onPress={tirarFoto} style={{alignSelf: 'center', marginBottom: 20}}><View style={{width: 70, height: 70, borderRadius: 35, backgroundColor: '#FFF', borderWidth: 4, borderColor: COLORS.amarelo}} /></TouchableOpacity>)}
                <TouchableOpacity onPress={() => setCameraVisible(false)} style={{backgroundColor: 'rgba(0,0,0,0.6)', padding: 15, borderRadius: 8, alignItems: 'center'}}><Text style={{color: '#FFF', fontWeight: 'bold'}}>{t('close')}</Text></TouchableOpacity>
            </View>
        </CameraView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { height: 90, backgroundColor: COLORS.azulMarinho, flexDirection: 'row', alignItems: 'center', paddingTop: 20, paddingHorizontal: 10, elevation: 5 },
  headerHome: { height: 90, backgroundColor: COLORS.azulMarinho, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, paddingHorizontal: 20, elevation: 5 },
  logo: { width: 120, height: 50, resizeMode: 'contain' },
  gearButton: { padding: 5 },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#999' },
  dashboardContainer: { flexDirection: 'row', padding: 10, justifyContent: 'space-between' },
  dashCard: { flex: 1, marginHorizontal: 5, borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, elevation: 2 },
  dashCardActive: { borderWidth: 3, transform: [{scale: 1.05}] },
  dashCount: { fontSize: 22, fontWeight: 'bold', marginVertical: 2 },
  dashLabel: { fontSize: 10, color: '#555', fontWeight: 'bold' },
  cardItem: { backgroundColor: '#FFF', borderRadius: 8, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#EEE', elevation: 2 },
  cardTitle: { fontWeight: 'bold', fontSize: 16, color: '#333' },
  cardDate: { color: '#666', marginTop: 2 },
  fab: { position: 'absolute', bottom: 40, right: 20, width: 65, height: 65, borderRadius: 35, backgroundColor: COLORS.amarelo, justifyContent: 'center', alignItems: 'center', elevation: 6, borderWidth: 2, borderColor: COLORS.azulMarinho },
  fabText: { fontSize: 30, fontWeight: 'bold', color: COLORS.azulMarinho, marginTop: -3 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.azulMarinho, marginTop: 10, marginBottom: 10, marginLeft: 5 },
  cardConfig: { backgroundColor: '#fff', borderRadius: 10, padding: 20, marginBottom: 20, elevation: 3 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContentSmall: { width: '85%', backgroundColor: '#fff', borderRadius: 15, padding: 20, elevation: 10, alignItems: 'center' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  numButton: { width: 45, height: 45, borderRadius: 25, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#DDD' },
  numButtonSelected: { backgroundColor: COLORS.amarelo, borderColor: COLORS.azulMarinho, borderWidth: 2 },
  numText: { fontSize: 16, color: '#333' },
  numTextSelected: { fontWeight: 'bold', color: COLORS.azulMarinho },
  modalContent: { flex: 1, padding: 25, paddingBottom: 60, backgroundColor: '#FFF' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.azulMarinho, textAlign: 'center', marginBottom: 20, marginTop: 10 },
  photoContainer: { alignItems: 'center', marginBottom: 15 },
  photoPlaceholder: { width: 120, height: 120, backgroundColor: COLORS.cinzaFundo, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cameraButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, gap: 10 },
  btnAction: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center', elevation: 2 },
  label: { fontWeight: 'bold', color: COLORS.azulMarinho, marginBottom: 5, fontSize: 16 },
  input: { borderWidth: 2, borderColor: COLORS.bordaInput, borderRadius: 8, padding: 10, marginBottom: 15, fontSize: 16, color: '#333' },
  footerButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, gap: 15 },
  btnFooter: { flex: 1, padding: 15, borderRadius: 8, alignItems: 'center', elevation: 3 }
});