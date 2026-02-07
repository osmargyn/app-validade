# app-validade

📅 De Olho na Validade (Market Edition)
> Versão: 2.4.6
> Desenvolvedor: Osmar Cruz
> 
📋 Sobre o Projeto
O De Olho na Validade é um aplicativo móvel desenvolvido para solucionar um problema crítico de pequenos e médios comércios: o controle de vencimento de produtos.
Diferente de soluções baseadas em nuvem, este app foi arquitetado para funcionar 100% Offline, utilizando banco de dados local (SQLite). Isso garante velocidade instantânea e privacidade total, permitindo que o estoquista trabalhe no fundo da loja ou em áreas sem sinal de internet sem interrupções.
O app oferece um fluxo completo: leitura de código de barras, registro fotográfico, dashboard visual de status e notificações automáticas precisas.
🚀 Funcionalidades Principais
 * 📱 Cadastro Ágil: Leitura de código de barras (EAN) via câmera com preenchimento automático de produtos já conhecidos.
 * 📸 Registro Visual: Opção de tirar fotos dos produtos para fácil identificação visual na lista.
 * 📊 Dashboard Inteligente:
   * 🔴 Vencidos: Alerta crítico imediato.
   * 🟡 Vencendo: Alerta preventivo configurável.
   * 🟢 No Prazo: Estoque seguro.
 * 🔔 Notificações Precisas: Sistema de agendamento local que avisa no dia e hora exatos escolhidos pelo usuário, sem necessidade de internet.
 * 📤 Modo de Baixa/Troca: Seleção múltipla de itens para compartilhar via WhatsApp (texto formatado) e arquivamento automático após o envio.
 * 💾 Backup & Restauração Avançado:
   * Gera um arquivo único .json.
   * Inovação: As fotos são convertidas em Base64 e salvas dentro do arquivo, permitindo restaurar o backup (com imagens) em qualquer outro celular.
 * ☕ Apoio ao Dev: Integração com área de transferência para doações via Pix.
🛠️ Tecnologias & Arquitetura
O projeto foi construído com React Native e Expo (SDK 54), seguindo os padrões mais recentes do mercado.
Stack Tecnológico
 * Core: React Native, Expo.
 * Banco de Dados: expo-sqlite (Utilizando a nova API openDatabaseSync para alta performance).
 * Câmera: expo-camera (Leitura de Barcode e Fotos).
 * Notificações: expo-notifications.
 * Arquivos: expo-file-system & expo-sharing.
 * Interface: expo-navigation-bar (Imersão em tela cheia no Android) e componentes nativos customizados.
Estrutura de Código
O projeto segue uma arquitetura limpa e modular baseada em Hooks e Services:
/src
 ├── /assets # Recursos estáticos (Logos, Ícones)
 ├── /hooks # Lógica de Estado (useAppLogic.js centraliza as regras de negócio)
 ├── /services  # Comunicação com APIs Nativas
 │    ├── db.js  # Camada de abstração do SQLite
 │    └── notifications.js # Gerenciador de agendamentos
 └── /utils  # Utilitários e Constantes
      ├── constants.js    # Textos (i18n ready) e Paleta de Cores
      └── dateHelper.js   # Algoritmos de cálculo de datas

⚙️ Instalação e Execução
Pré-requisitos
 * Node.js instalado.
 * Celular Android (Modo Desenvolvedor ativo) ou Emulador.
Passo a Passo
 * Clone o repositório:
   git clone https://github.com/seu-usuario/de-olho-na-validade.git
cd de-olho-na-validade

 * Instale as dependências:
   npm install

 * Execute o projeto:
   npx expo run:android

 * Gerar APK para Produção (Android):
   cd android
./gradlew assembleRelease

   O APK gerado estará em: android/app/build/outputs/apk/release/app-release.apk
🖼️ Telas do Projeto
(Espaço reservado para você colocar prints das telas do seu app aqui: Dashboard, Cadastro, Configurações)
🤝 Contribuição e Suporte
Este projeto é mantido de forma independente. Sugestões e Pull Requests são bem-vindos!
Se este projeto ajudou você ou seu negócio, considere apoiar o desenvolvimento:
 * Pix: osmarcruz.dev@gmail.com
Desenvolvido com 💙 por Osmar Cruz
