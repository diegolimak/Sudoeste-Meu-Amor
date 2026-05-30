// ================================================
// CONFIGURAÇÕES CENTRALIZADAS - SUDOESTE PROMO
// ================================================
// Copie este arquivo para seus arquivos e atualize com seus dados

const CONFIG = {
  // ================================================
  // Z-API (WhatsApp)
  // ================================================
  ZAPI: {
    TOKEN: 'SEU_TOKEN_ZAPI_AQUI',
    INSTANCE: 'SEU_INSTANCE_ID_AQUI',
    CHAT_ID: 'SEU_CHAT_ID_DO_GRUPO_AQUI', // Formato: 120363...@g.us
    BASE_URL: 'https://api.z-api.io/instances/'
  },

  // ================================================
  // GOOGLE (Sheets, Drive, Gmail)
  // ================================================
  GOOGLE: {
    SHEET_ID: 'SEU_SHEET_ID_AQUI', // Parte do URL entre /d/ e /edit
    SHEET_NAME: 'Agendamentos',
    EMAIL_NOTIFICACAO: 'seu_email@gmail.com',
    TIMEZONE: 'America/Sao_Paulo'
  },

  // ================================================
  // URLS (Para publicar no GitHub Pages)
  // ================================================
  URLS: {
    FORMULARIO: 'https://diegolimak.github.io/sudoeste-promo-agendamento/',
    APPS_SCRIPT: 'https://script.google.com/seu-id-aqui/usercoderun'
  },

  // ================================================
  // PROMOÇÕES
  // ================================================
  PROMOS: {
    HORARIOS: ['09:00', '15:00', '18:00'],
    MAX_POR_DIA: 4,
    PLANOS: {
      diario: {
        nome: 'Diário',
        preco: 29.90,
        frequencia: '1 vez',
        repeticoes: 1
      },
      semanal: {
        nome: 'Semanal',
        preco: 79.90,
        frequencia: '3 vezes',
        repeticoes: 3
      },
      mensal: {
        nome: 'Mensal',
        preco: 199.90,
        frequencia: '4 vezes',
        repeticoes: 4
      }
    }
  },

  // ================================================
  // VALIDAÇÕES
  // ================================================
  VALIDACOES: {
    TAMANHO_MAX_IMAGEM: 5 * 1024 * 1024, // 5MB
    TAMANHO_MAX_EXIBICAO: '5MB',
    FORMATOS_PERMITIDOS: ['image/jpeg', 'image/png', 'image/gif']
  },

  // ================================================
  // MENSAGENS
  // ================================================
  MENSAGENS: {
    SUCESSO: '✅ Agendamento confirmado! Sua promoção será postada no horário agendado.',
    ERRO_GENERICO: 'Erro ao agendar. Tente novamente.',
    CAMPOS_OBRIGATORIOS: 'Preencha todos os campos (incluindo arte e comprovante)',
    ESCOLHER_DATA_HORARIO: 'Escolha data e horário',
    PROCESSANDO: 'Processando...',
    CARREGANDO: 'Carregando...',
    ARQUIVO_GRANDE: 'Arquivo muito grande (máx. 5MB)',
    MAX_PROMOS: 'Máximo de 4 promos por dia atingido em'
  },

  // ================================================
  // COLS PLANILHA (indices para JavaScript)
  // ================================================
  PLANILHA: {
    TIMESTAMP: 0,      // A
    PLANO: 1,          // B
    INSTAGRAM: 2,      // C
    NEGOCIO: 3,        // D
    PROMOCAO: 4,       // E
    URL_ARTE: 5,       // F (será postada)
    URL_COMPROVANTE: 6, // G (para validação)
    STATUS: 7,         // H
    HORARIO: 8,        // I
    DATAS: 9,          // J
    DATA_APROVACAO: 10, // K
    NOTAS: 11,         // L
    ID: 12             // M
  },

  // ================================================
  // ESTADOS/STATUS
  // ================================================
  STATUS: {
    PENDENTE: 'pendente_validacao',
    APROVADO: 'aprovado',
    ENVIADO: 'enviado',
    REJEITADO: 'rejeitado'
  },

  // ================================================
  // DEBUG (mude para true se tiver problemas)
  // ================================================
  DEBUG: false
};

// ================================================
// FUNÇÃO HELPER - Enviar para Z-API
// ================================================
function enviarZAPI(numero, mensagem, imagemUrl = '') {
  try {
    const url = CONFIG.ZAPI.BASE_URL + 
                CONFIG.ZAPI.INSTANCE + 
                '/token/' + 
                CONFIG.ZAPI.TOKEN + 
                '/send-message';
    
    let payload = {
      phone: numero,
      message: mensagem
    };
    
    if (imagemUrl && imagemUrl !== 'erro-upload') {
      payload.mediaUrl = imagemUrl;
    }
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (CONFIG.DEBUG) {
      Logger.log('Z-API Response: ' + JSON.stringify(result));
    }
    
    return result.success || false;
    
  } catch (error) {
    Logger.log('Erro ao enviar para Z-API: ' + error);
    return false;
  }
}

// ================================================
// FUNÇÃO HELPER - Formatar Data
// ================================================
function formatarData(data) {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${ano}-${mes}-${dia}`;
}

// ================================================
// FUNÇÃO HELPER - Log com DEBUG
// ================================================
function logDebug(mensagem) {
  if (CONFIG.DEBUG) {
    Logger.log(mensagem);
  }
}

// ================================================
// EXPORTAR (se usar como módulo)
// ================================================
// Descomente a linha abaixo se for usar módulos:
// export default CONFIG;
