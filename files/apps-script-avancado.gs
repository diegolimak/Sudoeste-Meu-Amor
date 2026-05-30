// ============================================================
// SUDOESTE MEU AMOR — Sistema de Agendamento de Promoções
// Google Apps Script · Versão 3.0
// ============================================================

// ── CONFIGURAÇÕES (ALTERE COM SEUS DADOS) ────────────────────
const CFG = {

  // Z-API — Grupo público (promoções entram aqui no horário agendado)
  ZAPI_TOKEN:     'SEU_TOKEN_ZAPI_AQUI',
  ZAPI_INSTANCE:  'SEU_INSTANCE_ID',
  ZAPI_GRUPO:     'SEU_CHAT_ID_GRUPO_PUBLICO@g.us',  // ex: 5561999999999@g.us

  // Z-API — Grupo admin (você recebe a arte para postar no Instagram)
  ZAPI_ADMIN:     'SEU_CHAT_ID_GRUPO_ADMIN@g.us',    // seu grupo privado de admin

  // E-mail para notificações de novos agendamentos
  EMAIL:          'diegolima@corretoraamoravida.com.br',

  // Google Sheets
  ABA_AGENDAMENTOS:  'Agendamentos',
  ABA_DISPONIBILIDADE: 'Disponibilidade',

  // Regras de negócio
  MAX_POR_DIA:    4,
  HORARIOS:       ['09:00', '15:00', '18:00'],
  FUSO:           'America/Sao_Paulo',

  // Link público do formulário (aparece no rodapé das mensagens)
  URL_FORM: 'https://diegolimak.github.io/Sudoeste-Meu-Amor/',
};

const PRECO = { diario: 29.90, semanal: 79.90, mensal: 199.90 };

// ── COLUNAS DA PLANILHA ──────────────────────────────────────
//  A  Timestamp     B  Plano       C  Instagram    D  Negócio
//  E  Telefone      F  Email       G  Promoção     H  Arte (URL)
//  I  Comprovante   J  Status      K  Horário      L  Datas
//  M  Aprovado em   N  Notas       O  ID
const COL = {
  ts:1, plano:2, ig:3, negocio:4, tel:5, email:6, promo:7,
  arte:8, comp:9, status:10, horario:11, datas:12,
  aprovadoEm:13, notas:14, id:15
};

// ── RECEBER FORMULÁRIO ───────────────────────────────────────
function doPost(e) {
  try {
    const p = e.parameter;

    // Extrair campos
    const plano    = (p.plano    || '').trim();
    const ig       = (p.instagram|| '').trim().replace('@','');
    const negocio  = (p.nomeNegocio||'').trim();
    const tel      = (p.telefone || '').trim();
    const email    = (p.email    || '').trim();
    const promo    = (p.promocao || '').trim();
    const b64Arte  = (p.arte     || '');
    const b64Comp  = (p.comprovante||'');
    const data     = (p.data     || '').trim();
    const horario  = (p.horario  || '').trim();

    // Validação básica
    if (!plano||!ig||!negocio||!tel||!email||!promo||!b64Arte||!b64Comp||!data||!horario) {
      return resp('erro: campos obrigatórios ausentes');
    }

    // Validar disponibilidade
    const val = validarDisponibilidade(data, horario, plano);
    if (!val.ok) return resp('erro: ' + val.msg);

    // Upload imagens para o Drive
    const urlArte = uploadImagem(b64Arte, `arte_${ig}_${Date.now()}.jpg`);
    const urlComp = uploadImagem(b64Comp, `comp_${ig}_${Date.now()}.jpg`);

    // Calcular todas as datas (plano semanal/mensal = múltiplas semanas)
    const datas = calcularDatas(data, plano);
    const id    = Date.now().toString();

    // Salvar na planilha
    const sheet = getSheet(CFG.ABA_AGENDAMENTOS);
    garantirCabecalho(sheet);
    sheet.appendRow([
      new Date(),           // A: Timestamp
      plano,                // B: Plano
      '@'+ig,               // C: Instagram
      negocio,              // D: Negócio
      tel,                  // E: Telefone
      email,                // F: E-mail
      promo,                // G: Promoção
      urlArte,              // H: Arte (será postada no grupo)
      urlComp,              // I: Comprovante (validação)
      'pendente',           // J: Status
      horario,              // K: Horário
      datas.join('|'),      // L: Datas de envio
      '',                   // M: Aprovado em
      '',                   // N: Notas
      id                    // O: ID único
    ]);

    // Notificar Diego por e-mail
    enviarEmailNotificacao({ ig, negocio, plano, data, horario, tel, email, urlArte, urlComp, datas });

    // Enviar arte para grupo ADMIN imediatamente (Diego revisa e posta no Instagram)
    enviarParaAdmin({ ig, negocio, plano, data, horario, promo, urlArte, urlComp });

    return resp('sucesso: agendamento registrado — ID ' + id);

  } catch(err) {
    Logger.log('Erro em doPost: ' + err);
    return resp('erro: ' + err.toString());
  }
}

// ── UPLOAD DE IMAGEM PARA O DRIVE ───────────────────────────
function uploadImagem(base64, filename) {
  try {
    const partes   = base64.split(',');
    const mime     = partes[0].match(/:(.*?);/)[1] || 'image/jpeg';
    const decoded  = Utilities.base64Decode(partes[1]);
    const blob     = Utilities.newBlob(decoded, mime, filename);
    const pasta    = obterOuCriarPasta('Sudoeste Meu Amor — Promoções');
    const arquivo  = pasta.createFile(blob);
    arquivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return arquivo.getDownloadUrl();
  } catch(err) {
    Logger.log('Erro upload imagem: ' + err);
    return 'erro-upload';
  }
}

function obterOuCriarPasta(nome) {
  const pastas = DriveApp.getFoldersByName(nome);
  return pastas.hasNext() ? pastas.next() : DriveApp.createFolder(nome);
}

// ── NOTIFICAÇÃO PARA O ADMIN (grupo Instagram) ───────────────
function enviarParaAdmin({ ig, negocio, plano, data, horario, promo, urlArte, urlComp }) {
  const PNOME = { diario:'☀️ Diário', semanal:'📅 Semanal', mensal:'📆 Mensal' };
  const dFmt  = new Date(data+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});

  // Mensagem de texto para o grupo admin
  const msg = `🔔 *NOVO AGENDAMENTO — Sudoeste Meu Amor*

👤 *Instagram:* @${ig}
🏪 *Negócio:* ${negocio}
📦 *Plano:* ${PNOME[plano] || plano}
📅 *Data:* ${dFmt}
🕐 *Horário:* ${horario}
✨ *Promoção:* ${promo}

⚡ *Status:* Pendente de aprovação

👉 Para APROVAR: abra a planilha e use o menu 🌳 Sudoeste Promo → ✅ Aprovar
👉 Arte para Instagram: clique no link abaixo ⬇️`;

  // Envia texto
  chamarZAPI('send-message', { phone: CFG.ZAPI_ADMIN, message: msg });

  // Envia arte (URL do Drive) — Diego baixa e posta no Instagram
  if (urlArte && urlArte !== 'erro-upload') {
    const msgArte = `🎨 *ARTE para postar no Instagram:*\n@${ig} — ${negocio}\n\nLink: ${urlArte}`;
    chamarZAPI('send-message', { phone: CFG.ZAPI_ADMIN, message: msgArte });
  }

  // Envia comprovante
  if (urlComp && urlComp !== 'erro-upload') {
    const msgComp = `📋 *COMPROVANTE de pagamento:*\n@${ig} — ${negocio}\n\nLink: ${urlComp}`;
    chamarZAPI('send-message', { phone: CFG.ZAPI_ADMIN, message: msgComp });
  }
}

// ── ENVIAR E-MAIL PARA DIEGO ─────────────────────────────────
function enviarEmailNotificacao({ ig, negocio, plano, data, horario, tel, email, urlArte, urlComp, datas }) {
  const PNOME = { diario:'Diário (R$ 29,90)', semanal:'Semanal — 3x (R$ 79,90)', mensal:'Mensal — 4x (R$ 199,90)' };
  const dFmt  = new Date(data+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
    <div style="background:#1A7A3E;padding:20px;border-radius:10px 10px 0 0">
      <h1 style="color:white;margin:0;font-size:20px">🌿 Novo Agendamento — Sudoeste Meu Amor</h1>
    </div>
    <div style="background:#f7fbf8;padding:24px;border-radius:0 0 10px 10px;border:1px solid #A8D5B5">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:8px 0;color:#7AAA8A;font-size:12px;font-weight:700;text-transform:uppercase">Instagram</td><td style="padding:8px 0;font-weight:600">@${ig}</td></tr>
        <tr><td style="padding:8px 0;color:#7AAA8A;font-size:12px;font-weight:700;text-transform:uppercase">Negócio</td><td style="padding:8px 0;font-weight:600">${negocio}</td></tr>
        <tr><td style="padding:8px 0;color:#7AAA8A;font-size:12px;font-weight:700;text-transform:uppercase">Plano</td><td style="padding:8px 0;font-weight:600">${PNOME[plano]||plano}</td></tr>
        <tr><td style="padding:8px 0;color:#7AAA8A;font-size:12px;font-weight:700;text-transform:uppercase">WhatsApp</td><td style="padding:8px 0;font-weight:600">${tel}</td></tr>
        <tr><td style="padding:8px 0;color:#7AAA8A;font-size:12px;font-weight:700;text-transform:uppercase">E-mail</td><td style="padding:8px 0;font-weight:600">${email}</td></tr>
        <tr><td style="padding:8px 0;color:#7AAA8A;font-size:12px;font-weight:700;text-transform:uppercase">Horário</td><td style="padding:8px 0;font-weight:600">${horario}</td></tr>
        <tr><td style="padding:8px 0;color:#7AAA8A;font-size:12px;font-weight:700;text-transform:uppercase">Datas</td><td style="padding:8px 0;font-weight:600">${datas.map(d=>new Date(d+'T12:00:00').toLocaleDateString('pt-BR')).join(', ')}</td></tr>
      </table>
      <hr style="border:1px solid #A8D5B5;margin:16px 0">
      <p style="margin:0 0 14px"><a href="${urlArte}" style="background:#1A7A3E;color:white;padding:10px 18px;border-radius:7px;text-decoration:none;font-weight:600">🎨 Ver Arte (postar no grupo)</a></p>
      <p style="margin:0 0 14px"><a href="${urlComp}" style="background:#3D6B50;color:white;padding:10px 18px;border-radius:7px;text-decoration:none;font-weight:600">📋 Ver Comprovante</a></p>
      <p style="font-size:12px;color:#7AAA8A;margin-top:16px">Para aprovar: abra a planilha → menu 🌳 Sudoeste Promo → ✅ Aprovar</p>
    </div>
  </div>`;

  try {
    MailApp.sendEmail(CFG.EMAIL, `[Sudoeste] Novo agendamento — @${ig} (${plano})`, '', { htmlBody: html });
  } catch(err) {
    Logger.log('Erro e-mail: ' + err);
  }
}

// ── TRIGGER AUTOMÁTICO: enviar promos aprovadas no horário ────
function verificarEEnviar() {
  const sheet = getSheet(CFG.ABA_AGENDAMENTOS);
  const dados = sheet.getDataRange().getValues();
  const hoje  = fmtData(new Date());
  const agora = Utilities.formatDate(new Date(), CFG.FUSO, 'HH:mm');

  Logger.log(`⏰ Rodando verificação: ${hoje} ${agora}`);

  for (let i=1; i<dados.length; i++) {
    const row    = dados[i];
    const status = row[COL.status-1];
    const horario= row[COL.horario-1];
    const datas  = (row[COL.datas-1]||'').split('|');
    const ig     = row[COL.ig-1];
    const negocio= row[COL.negocio-1];
    const promo  = row[COL.promo-1];
    const urlArte= row[COL.arte-1];

    if (status==='enviado' && datas.includes(hoje) && horario===agora) {
      Logger.log(`⏭  Já enviado: ${ig}`);
      continue;
    }
    if (status==='aprovado' && datas.includes(hoje) && horario===agora) {
      Logger.log(`📤 Enviando: ${ig}`);
      const msg = formatarMsgGrupo(ig, negocio, promo);
      const ok  = chamarZAPI('send-image', { phone: CFG.ZAPI_GRUPO, image: urlArte, caption: msg });
      if (ok) {
        sheet.getRange(i+1, COL.status).setValue('enviado');
        Logger.log(`✅ Enviado: ${ig}`);
      } else {
        Logger.log(`❌ Erro ao enviar: ${ig}`);
      }
    }
  }
}

function formatarMsgGrupo(ig, negocio, promo) {
  return `🎉 *Promoção do dia — Sudoeste Meu Amor*

🏪 *${negocio}*
👤 @${ig}

✨ *${promo}*

---
📢 Quer anunciar aqui? Acesse:
${CFG.URL_FORM}`;
}

// ── APROVAÇÃO / REJEIÇÃO ─────────────────────────────────────
function aprovarLinha(row) {
  const sheet = getSheet(CFG.ABA_AGENDAMENTOS);
  if (sheet.getRange(row, COL.status).getValue() !== 'pendente') return;
  sheet.getRange(row, COL.status).setValue('aprovado');
  sheet.getRange(row, COL.aprovadoEm).setValue(new Date());

  // Notificar cliente por WhatsApp (opcional)
  const tel  = sheet.getRange(row, COL.tel).getValue();
  const ig   = sheet.getRange(row, COL.ig).getValue();
  const hor  = sheet.getRange(row, COL.horario).getValue();
  const datas= (sheet.getRange(row, COL.datas).getValue()||'').split('|');
  const d1   = new Date(datas[0]+'T12:00:00').toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'});

  const msgCliente = `✅ *Agendamento aprovado!*

Olá, ${ig}! Seu agendamento no grupo *Sudoeste Meu Amor* foi aprovado.

📅 *Primeira postagem:* ${d1} às ${hor}

Qualquer dúvida estamos por aqui! 💚`;

  if (tel) chamarZAPI('send-message', { phone: limparTelefone(tel), message: msgCliente });
}

function rejeitarLinha(row, motivo) {
  const sheet = getSheet(CFG.ABA_AGENDAMENTOS);
  sheet.getRange(row, COL.status).setValue('rejeitado');
  sheet.getRange(row, COL.notas).setValue(motivo||'Rejeitado');

  // Notificar cliente
  const tel = sheet.getRange(row, COL.tel).getValue();
  const ig  = sheet.getRange(row, COL.ig).getValue();
  if (tel) {
    const msg = `⚠️ Agendamento não aprovado — @${ig}\n\nMotivo: ${motivo||'Comprovante não identificado.'}\n\nEntre em contato para regularizar. 💬`;
    chamarZAPI('send-message', { phone: limparTelefone(tel), message: msg });
  }
}

// ── Z-API ────────────────────────────────────────────────────
function chamarZAPI(endpoint, payload) {
  try {
    const url = `https://api.z-api.io/instances/${CFG.ZAPI_INSTANCE}/token/${CFG.ZAPI_TOKEN}/${endpoint}`;
    const opt = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    const res = UrlFetchApp.fetch(url, opt);
    const json = JSON.parse(res.getContentText());
    Logger.log(`Z-API [${endpoint}]: ` + JSON.stringify(json));
    return json.success !== false;
  } catch(err) {
    Logger.log('Erro Z-API: ' + err);
    return false;
  }
}

// ── VALIDAR DISPONIBILIDADE ──────────────────────────────────
function validarDisponibilidade(data, horario, plano) {
  const sheet = getSheet(CFG.ABA_AGENDAMENTOS);
  const dados = sheet.getDataRange().getValues();
  const datas = calcularDatas(data, plano);

  for (const d of datas) {
    let count = 0;
    for (let i=1; i<dados.length; i++) {
      const status  = dados[i][COL.status-1];
      const dtsLinha= (dados[i][COL.datas-1]||'').split('|');
      if ((status==='aprovado'||status==='enviado'||status==='pendente') && dtsLinha.includes(d)) {
        count++;
      }
    }
    if (count >= CFG.MAX_POR_DIA) {
      return { ok:false, msg:`Dia ${d} está lotado (${CFG.MAX_POR_DIA} promos/dia). Escolha outra data.` };
    }
  }
  return { ok:true };
}

// ── DATAS DO PLANO ───────────────────────────────────────────
function calcularDatas(data, plano) {
  const base = new Date(data+'T12:00:00');
  const n    = plano==='mensal' ? 4 : plano==='semanal' ? 3 : 1;
  const datas= [];
  for (let i=0; i<n; i++) {
    const d = new Date(base.getTime() + i*7*24*60*60*1000);
    datas.push(fmtData(d));
  }
  return datas;
}

function fmtData(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function limparTelefone(tel) {
  return tel.replace(/\D/g,'');
}

// ── PLANILHA ─────────────────────────────────────────────────
function getSheet(nome) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(nome) || ss.insertSheet(nome);
}

function garantirCabecalho(sheet) {
  if (sheet.getLastRow() > 0) return;
  const hdr = sheet.getRange(1,1,1,15);
  hdr.setValues([[
    'Cadastro','Plano','Instagram','Negócio','Telefone','E-mail','Promoção',
    'Arte (postagem)','Comprovante','Status','Horário','Datas',
    'Aprovado em','Notas','ID'
  ]]);
  hdr.setFontWeight('bold');
  hdr.setBackground('#1A7A3E');
  hdr.setFontColor('white');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(7, 220);
  sheet.setColumnWidth(8, 200);
  sheet.setColumnWidth(9, 200);
}

// ── TRIGGERS ─────────────────────────────────────────────────
function criarTriggers() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction()==='verificarEEnviar')
    .forEach(t => ScriptApp.deleteTrigger(t));

  CFG.HORARIOS.forEach(h => {
    const [hora] = h.split(':').map(Number);
    ScriptApp.newTrigger('verificarEEnviar')
      .timeBased().atHour(hora).everyDays(1).inTimezone(CFG.FUSO).create();
  });
  Logger.log('✅ Triggers criados: ' + CFG.HORARIOS.join(', '));
}

// ── MENU CUSTOMIZADO ─────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🌿 Sudoeste Promo')
    .addItem('✅ Aprovar linha selecionada',  'menuAprovar')
    .addItem('❌ Rejeitar linha selecionada', 'menuRejeitar')
    .addSeparator()
    .addItem('🔧 Criar triggers de envio',   'criarTriggers')
    .addItem('▶️  Rodar verificação agora',   'verificarEEnviar')
    .addSeparator()
    .addItem('📊 Relatório de disponibilidade', 'relatorioDisponibilidade')
    .addToUi();
}

function menuAprovar() {
  const ui  = SpreadsheetApp.getUi();
  const row = SpreadsheetApp.getActiveSheet().getActiveRange().getRow();
  if (row <= 1) { ui.alert('Selecione uma linha de agendamento (não o cabeçalho).'); return; }
  aprovarLinha(row);
  ui.alert('✅ Aprovado! O cliente será notificado por WhatsApp.');
}

function menuRejeitar() {
  const ui  = SpreadsheetApp.getUi();
  const res = ui.prompt('Motivo da rejeição:', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  const row = SpreadsheetApp.getActiveSheet().getActiveRange().getRow();
  if (row <= 1) return;
  rejeitarLinha(row, res.getResponseText());
  ui.alert('❌ Rejeitado. Cliente notificado por WhatsApp.');
}

function relatorioDisponibilidade() {
  const sheet = getSheet(CFG.ABA_AGENDAMENTOS);
  const dados = sheet.getDataRange().getValues();
  const rel   = {};
  const hoje  = new Date();

  for (let d=0; d<14; d++) {
    const dt  = new Date(hoje.getTime() + d*24*60*60*1000);
    const key = fmtData(dt);
    rel[key]  = { total:0, '09:00':0,'15:00':0,'18:00':0 };
  }

  for (let i=1; i<dados.length; i++) {
    const status = dados[i][COL.status-1];
    if (!['aprovado','enviado','pendente'].includes(status)) continue;
    const horario= dados[i][COL.horario-1];
    const datas  = (dados[i][COL.datas-1]||'').split('|');
    datas.forEach(d => {
      if (rel[d]) { rel[d].total++; if(rel[d][horario]!==undefined) rel[d][horario]++; }
    });
  }

  Logger.log('📊 Disponibilidade (próximos 14 dias):\n' + JSON.stringify(rel, null, 2));
  SpreadsheetApp.getUi().alert('Relatório gerado no Registro de Execução (Apps Script → Execuções).');
}

// ── HELPER ───────────────────────────────────────────────────
function resp(texto) {
  return ContentService.createTextOutput(texto).setMimeType(ContentService.MimeType.TEXT);
}
