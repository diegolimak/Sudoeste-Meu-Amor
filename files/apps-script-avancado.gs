// ==========================================
// CONFIGURAÇÕES - ALTERE COM SEUS DADOS
// ==========================================

const CONFIG = {
  // Z-API
  ZAPI_TOKEN: 'SEU_TOKEN_ZAPI_AQUI',
  ZAPI_INSTANCE: 'SEU_INSTANCE_ID',
  ZAPI_CHAT_ID: 'SEU_CHAT_ID_DO_GRUPO_WHATSAPP',
  
  // Email para notificações
  EMAIL_NOTIFICACAO: 'diegolima@corretoraamoravida.com.br',
  
  // Google Sheets
  SHEET_NAME: 'Agendamentos',
  SHEET_DISPONIBILIDADE: 'Disponibilidade',
  
  // Limite de promos por dia
  MAX_PROMOS_POR_DIA: 4,
  
  // Horários de envio
  HORARIOS: ['09:00', '15:00', '18:00'],
  
  // Fuso horário
  TIMEZONE: 'America/Sao_Paulo',
  
  // URL do formulário (para enviar para grupo)
  URL_FORMULARIO: 'https://seu-dominio.com/formulario-agendamento.html'
};

// Preços
const PRECO_PLANOS = {
  diario: 29.90,
  semanal: 79.90,
  mensal: 199.90
};

// ==========================================
// RECEBER DADOS DO FORMULÁRIO
// ==========================================

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    
    // Extrai dados
    const plano = e.parameter.plano?.trim() || '';
    const instagram = e.parameter.instagram?.trim().replace('@', '') || '';
    const nomeNegocio = e.parameter.nomeNegocio?.trim() || '';
    const promocao = e.parameter.promocao?.trim() || '';
    const base64Arte = e.parameter.arte || '';
    const base64Comprovante = e.parameter.comprovante || '';
    const dataSelecionada = e.parameter.data || '';
    const horarioSelecionado = e.parameter.horario || '';
    
    // Validação
    if (!plano || !instagram || !nomeNegocio || !promocao || !base64Arte || !base64Comprovante || !dataSelecionada || !horarioSelecionado) {
      return ContentService.createTextOutput('erro: dados incompletos').setMimeType(ContentService.MimeType.TEXT);
    }
    
    // Validar disponibilidade
    const validacao = validarDisponibilidade(dataSelecionada, horarioSelecionado, plano);
    if (!validacao.disponivel) {
      return ContentService.createTextOutput('erro: ' + validacao.mensagem).setMimeType(ContentService.MimeType.TEXT);
    }
    
    // Fazer upload da arte
    let urlArte = '';
    try {
      const imageDataArte = Utilities.newBlob(
        Utilities.base64Decode(base64Arte.split(',')[1]), 
        'image/jpeg', 
        'arte_' + instagram + '_' + Date.now() + '.jpg'
      );
      const folder = DriveApp.getRootFolder();
      const fileArte = folder.createFile(imageDataArte);
      fileArte.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      urlArte = fileArte.getUrl();
    } catch (error) {
      Logger.log('Erro ao fazer upload da arte: ' + error);
      urlArte = 'erro-upload';
    }
    
    // Fazer upload do comprovante
    let urlComprovante = '';
    try {
      const imageDataComprovante = Utilities.newBlob(
        Utilities.base64Decode(base64Comprovante.split(',')[1]), 
        'image/jpeg', 
        'comprovante_' + instagram + '_' + Date.now() + '.jpg'
      );
      const folder = DriveApp.getRootFolder();
      const fileComprovante = folder.createFile(imageDataComprovante);
      fileComprovante.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      urlComprovante = fileComprovante.getUrl();
    } catch (error) {
      Logger.log('Erro ao fazer upload do comprovante: ' + error);
      urlComprovante = 'erro-upload';
    }
    
    // Calcular datas para planos semanais/mensais
    const datasAgendamento = calcularDatasAgendamento(dataSelecionada, plano);
    
    // Salvar na planilha
    const timestamp = new Date();
    sheet.appendRow([
      timestamp,                           // A: Timestamp de cadastro
      plano,                               // B: Tipo de plano
      instagram,                           // C: Instagram
      nomeNegocio,                         // D: Nome do negócio
      promocao,                            // E: Descrição promoção
      urlArte,                             // F: URL arte (será postada)
      urlComprovante,                      // G: URL comprovante (para validação)
      'pendente_validacao',                // H: Status
      horarioSelecionado,                  // I: Horário selecionado
      datasAgendamento.join('|'),          // J: Datas de agendamento (separadas por |)
      '',                                  // K: Data de aprovação
      '',                                  // L: Notas
      timestamp.getTime()                  // M: ID único
    ]);
    
    // Formatar cabeçalho
    if (sheet.getLastRow() === 2) {
      const header = sheet.getRange(1, 1, 1, 13);
      header.setValues([[
        'Cadastro', 'Plano', 'Instagram', 'Negócio', 'Promoção', 'Arte (postagem)', 'Comprovante (validação)',
        'Status', 'Horário', 'Datas', 'Aprovado em', 'Notas', 'ID'
      ]]);
      header.setFontWeight('bold');
      header.setBackground('#2DB84B');
      header.setFontColor('white');
    }
    
    // Enviar notificação para Diego
    enviarNotificacao(instagram, nomeNegocio, plano, dataSelecionada, urlArte, urlComprovante);
    
    return ContentService.createTextOutput('sucesso: agendamento realizado').setMimeType(ContentService.MimeType.TEXT);
    
  } catch (error) {
    Logger.log('Erro em doPost: ' + error);
    return ContentService.createTextOutput('erro: ' + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
}

// ==========================================
// VALIDAR DISPONIBILIDADE
// ==========================================

function validarDisponibilidade(data, horario, plano) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const dados = sheet.getDataRange().getValues();
  const dataParsed = new Date(data);
  
  let contagemNaqueleHorario = 0;
  let contagemNaqueledia = 0;
  
  // Se for plano semanal/mensal, validar múltiplas datas
  const datasAValidar = calcularDatasAgendamento(data, plano);
  
  for (let d of datasAValidar) {
    contagemNaqueledia = 0;
    
    // Contar promos existentes naquela data
    for (let i = 1; i < dados.length; i++) {
      const status = dados[i][7];        // Status está em coluna H (índice 7)
      const horarioExistente = dados[i][8];  // Horário está em coluna I (índice 8)
      const datasExistentes = (dados[i][9] || '').split('|'); // Datas em coluna J (índice 9)
      
      // Só conta promos aprovadas ou enviadas
      if ((status === 'aprovado' || status === 'enviado') && datasExistentes.includes(d)) {
        contagemNaqueledia++;
        if (horarioExistente === horario) {
          contagemNaqueleHorario++;
        }
      }
    }
    
    // Validar limite
    if (contagemNaqueledia >= CONFIG.MAX_PROMOS_POR_DIA) {
      return {
        disponivel: false,
        mensagem: `Máximo de ${CONFIG.MAX_PROMOS_POR_DIA} promos por dia atingido em ${d}`
      };
    }
  }
  
  return { disponivel: true };
}

// ==========================================
// CALCULAR DATAS DE AGENDAMENTO
// ==========================================

function calcularDatasAgendamento(dataSelecionada, plano) {
  const data = new Date(dataSelecionada);
  const datas = [];
  
  switch (plano) {
    case 'diario':
      datas.push(formatarData(data));
      break;
      
    case 'semanal':
      // Próximas 3 semanas (mesmo dia)
      for (let i = 0; i < 3; i++) {
        datas.push(formatarData(new Date(data.getTime() + (i * 7 * 24 * 60 * 60 * 1000))));
      }
      break;
      
    case 'mensal':
      // Próximas 4 semanas (mesmo dia)
      for (let i = 0; i < 4; i++) {
        datas.push(formatarData(new Date(data.getTime() + (i * 7 * 24 * 60 * 60 * 1000))));
      }
      break;
  }
  
  return datas;
}

function formatarData(data) {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${ano}-${mes}-${dia}`;
}

// ==========================================
// ENVIAR NOTIFICAÇÃO POR EMAIL
// ==========================================

function enviarNotificacao(instagram, negocio, plano, data, urlArte, urlComprovante) {
  const assunto = `[Sudoeste] Nova promoção aguardando aprovação - @${instagram}`;
  
  const mensagem = `
    <h2>Nova Promoção Cadastrada</h2>
    <p><strong>Instagram:</strong> @${instagram}</p>
    <p><strong>Negócio:</strong> ${negocio}</p>
    <p><strong>Plano:</strong> ${plano.charAt(0).toUpperCase() + plano.slice(1)}</p>
    <p><strong>Data de Início:</strong> ${new Date(data).toLocaleDateString('pt-BR')}</p>
    <p><strong>Status:</strong> Aguardando sua aprovação</p>
    <hr>
    <h3>Imagens</h3>
    <p><strong>🎨 Arte (será postada):</strong><br>
    <a href="${urlArte}">Ver arte aqui</a></p>
    <p><strong>📋 Comprovante (para validação):</strong><br>
    <a href="${urlComprovante}">Ver comprovante aqui</a></p>
    <hr>
    <p>
      <a href="https://docs.google.com/spreadsheets/YOUR_SHEET_ID/edit" style="background: #2DB84B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Revisar na Planilha
      </a>
    </p>
  `;
  
  MailApp.sendEmail(CONFIG.EMAIL_NOTIFICACAO, assunto, '', {
    htmlBody: mensagem
  });
}

// ==========================================
// APROVAR/REJEITAR AGENDAMENTO
// ==========================================

function aprovarAgendamento(rowNumber) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const status = sheet.getRange(rowNumber, 8).getValue();  // Coluna H
  
  if (status !== 'pendente_validacao') {
    Logger.log('Agendamento já foi processado');
    return;
  }
  
  sheet.getRange(rowNumber, 8).setValue('aprovado');   // Coluna H - Status
  sheet.getRange(rowNumber, 11).setValue(new Date());   // Coluna K - Data de aprovação
  
  Logger.log('Agendamento aprovado: linha ' + rowNumber);
}

function rejeitarAgendamento(rowNumber, motivo) {
  const sheet = SpreadsheetApp.getActiveSheet();
  sheet.getRange(rowNumber, 8).setValue('rejeitado');   // Coluna H - Status
  sheet.getRange(rowNumber, 12).setValue(motivo || 'Rejeitado pelo administrador'); // Coluna L - Notas
  
  Logger.log('Agendamento rejeitado: linha ' + rowNumber);
}

// ==========================================
// ENVIAR PARA Z-API (WHATSAPP)
// ==========================================

function enviarParaZAPI(numero, mensagem, imagemUrl = '') {
  try {
    const url = `https://api.z-api.io/instances/${CONFIG.ZAPI_INSTANCE}/token/${CONFIG.ZAPI_TOKEN}/send-message`;
    
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
    
    Logger.log('Z-API Response: ' + JSON.stringify(result));
    return result.success || false;
    
  } catch (error) {
    Logger.log('Erro ao enviar para Z-API: ' + error);
    return false;
  }
}

// ==========================================
// ENVIAR AGENDADAS PARA WHATSAPP
// ==========================================

function verificarEEnviarAgendadas() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const dados = sheet.getDataRange().getValues();
    
    const hoje = formatarData(new Date());
    const horaAgora = String(new Date().getHours()).padStart(2, '0') + ':' + 
                      String(new Date().getMinutes()).padStart(2, '0');
    
    Logger.log('⏰ Verificando envios para ' + hoje + ' às ' + horaAgora);
    
    for (let i = 1; i < dados.length; i++) {
      const linha = dados[i];
      const status = linha[7];           // Status (coluna H)
      const horario = linha[8];           // Horário (coluna I)
      const datas = (linha[9] || '').split('|');  // Datas (coluna J)
      const instagram = linha[2];         // Instagram (coluna C)
      const negocio = linha[3];           // Negócio (coluna D)
      const promo = linha[4];             // Promoção (coluna E)
      const urlArte = linha[5];           // Arte (coluna F) - SERÁ POSTADA
      
      // Verificar se é para enviar hoje neste horário
      if (status === 'enviado' && datas.includes(hoje) && horario === horaAgora) {
        Logger.log('⏭️  Já foi enviado: ' + instagram);
        continue;
      }
      
      if (status === 'aprovado' && datas.includes(hoje) && horario === horaAgora) {
        Logger.log('📤 Enviando: ' + instagram);
        
        // Formatar mensagem
        const mensagem = formatarMensagemWhatsApp(instagram, negocio, promo);
        
        // Enviar COM A ARTE
        const enviado = enviarParaZAPI(CONFIG.ZAPI_CHAT_ID, mensagem, urlArte);
        
        if (enviado) {
          sheet.getRange(i + 1, 8).setValue('enviado');  // Atualiza coluna H (status)
          Logger.log('✅ Enviado: ' + instagram);
        } else {
          Logger.log('❌ Erro ao enviar: ' + instagram);
        }
      }
    }
    
  } catch (error) {
    Logger.log('Erro em verificarEEnviarAgendadas: ' + error);
  }
}

function formatarMensagemWhatsApp(instagram, negocio, promo) {
  return `🎉 *Nova Promoção - Sudoeste Meu Amor*

👤 *Instagram:* @${instagram}
🏪 *Negócio:* ${negocio}
✨ *Promoção:* ${promo}

📸 Comprovante abaixo ⬇️

---
📱 Quer anunciar sua promoção? 
${CONFIG.URL_FORMULARIO}`;
}

// ==========================================
// CRIAR TRIGGERS AUTOMÁTICOS
// ==========================================

function criarTriggers() {
  // Remover triggers antigos
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'verificarEEnviarAgendadas') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Criar trigger para cada horário
  CONFIG.HORARIOS.forEach(horario => {
    const [hora, minuto] = horario.split(':').map(Number);
    
    const trigger = ScriptApp.newTrigger('verificarEEnviarAgendadas')
      .timeBased()
      .atHour(hora)
      .everyDays(1)
      .inTimezone(CONFIG.TIMEZONE)
      .create();
  });
  
  Logger.log('✅ Triggers criados para horários: ' + CONFIG.HORARIOS.join(', '));
}

// ==========================================
// DASHBOARD / RELATÓRIO
// ==========================================

function gerarRelatorioDisponibilidade() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const dados = sheet.getDataRange().getValues();
  
  const relatorio = {};
  
  // Próximos 30 dias
  const hoje = new Date();
  for (let d = 0; d < 30; d++) {
    const data = new Date(hoje.getTime() + (d * 24 * 60 * 60 * 1000));
    const dataStr = formatarData(data);
    relatorio[dataStr] = {
      '09:00': 0,
      '15:00': 0,
      '18:00': 0
    };
  }
  
  // Contar promos aprovadas/enviadas
  for (let i = 1; i < dados.length; i++) {
    const status = dados[i][7];        // Status (coluna H)
    const horario = dados[i][8];        // Horário (coluna I)
    const datas = (dados[i][9] || '').split('|'); // Datas (coluna J)
    
    if ((status === 'aprovado' || status === 'enviado') && horario && datas[0]) {
      datas.forEach(data => {
        if (relatorio[data]) {
          relatorio[data][horario]++;
        }
      });
    }
  }
  
  Logger.log(JSON.stringify(relatorio, null, 2));
  return relatorio;
}

// ==========================================
// MENU CUSTOM
// ==========================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🌳 Sudoeste Promo')
    .addItem('🔧 Criar Triggers de Envio', 'criarTriggers')
    .addItem('📊 Gerar Relatório de Disponibilidade', 'gerarRelatorioDisponibilidade')
    .addSeparator()
    .addItem('✅ Aprovar Selecionado', 'aprovarSelecionado')
    .addItem('❌ Rejeitar Selecionado', 'rejeitarSelecionado')
    .addToUi();
}

function aprovarSelecionado() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const row = sheet.getActiveRange().getRow();
  if (row > 1) {
    aprovarAgendamento(row);
    SpreadsheetApp.getUi().alert('✅ Aprovado!');
  }
}

function rejeitarSelecionado() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('Por que rejeitar?');
  if (response.getSelectedButton() === ui.Button.OK) {
    const sheet = SpreadsheetApp.getActiveSheet();
    const row = sheet.getActiveRange().getRow();
    rejeitarAgendamento(row, response.getResponseText());
    ui.alert('❌ Rejeitado!');
  }
}
