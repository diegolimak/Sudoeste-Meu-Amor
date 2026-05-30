# 📋 CHECKLIST DE IMPLEMENTAÇÃO

**Projeto**: Sudoeste Meu Amor - Sistema de Agendamento de Promoções  
**Data Início**: ___________  
**Data Go-Live**: ___________

---

## FASE 1: PREPARAÇÃO (30 min)

### Credenciais & Dados
- [ ] Z-API Token: `_______________________________`
- [ ] Z-API Instance: `_______________________________`
- [ ] Chat ID WhatsApp: `_______________________________`
- [ ] Email (notificações): `_______________________________`
- [ ] Google Account: `_______________________________`
- [ ] GitHub Account: `diegolimak`

### Ferramentas
- [ ] Acesso a https://sheets.google.com
- [ ] Acesso a https://app.z-api.io
- [ ] Acesso a GitHub (diegolimak)
- [ ] Editor de texto (VSCode ou similar)

---

## FASE 2: GOOGLE SHEETS (10 min)

### Criar Planilha
- [ ] Acesse https://sheets.google.com
- [ ] Novo → Planilha em branco
- [ ] Renomeie para: `Sudoeste Promoções`
- [ ] Anote Sheet ID: `_______________________________`
  - Copia da URL entre `/d/` e `/edit`

---

## FASE 3: GOOGLE APPS SCRIPT (15 min)

### Copiar Código
- [ ] Na planilha: Extensões → Apps Script
- [ ] Abra arquivo: `apps-script-avancado.gs`
- [ ] Copie TODO o conteúdo
- [ ] Cole na aba `Code.gs` (substitua tudo)
- [ ] Salve (Ctrl+S)

### Configurar Credenciais
Na linha com `const CONFIG = {`:

```javascript
const CONFIG = {
  ZAPI_TOKEN: '________________________________',
  ZAPI_INSTANCE: '________________________________',
  ZAPI_CHAT_ID: '________________________________',
  EMAIL_NOTIFICACAO: '________________________________',
  URL_FORMULARIO: 'https://diegolimak.github.io/sudoeste-promo-agendamento/',
};
```

- [ ] ZAPI_TOKEN preenchido
- [ ] ZAPI_INSTANCE preenchido
- [ ] ZAPI_CHAT_ID preenchido (com @g.us no final)
- [ ] EMAIL_NOTIFICACAO preenchido
- [ ] URL_FORMULARIO preenchido
- [ ] Salvo (Ctrl+S)

### Deploy como Web App
- [ ] Clique em "Implantar" (botão azul)
- [ ] "Nova Implantação"
- [ ] Tipo: `Web App`
- [ ] Executar como: `Você`
- [ ] Quem tem acesso: `Qualquer pessoa`
- [ ] Clique em "Implantar"
- [ ] Copie a URL gerada: `_______________________________`
- [ ] Fecha a janela de sucesso

---

## FASE 4: FORMULÁRIO HTML (10 min)

### Atualizar URL
- [ ] Abra arquivo: `formulario-agendamento.html`
- [ ] Procure por: `const response = await fetch('GOOGLE_APPS_SCRIPT_URL'`
  - Linha ~1105
- [ ] Substitua `GOOGLE_APPS_SCRIPT_URL` pela URL do Passo 3
- [ ] Salve o arquivo (Ctrl+S)

### Validar Formulário
- [ ] Verifique se os campos estão corretos:
  - [ ] Campo de plano (Diário/Semanal/Mensal)
  - [ ] Calendário
  - [ ] Campo de Instagram
  - [ ] Campo de Negócio
  - [ ] Campo de Promoção
  - [ ] Upload de Arte
  - [ ] Upload de Comprovante

---

## FASE 5: GITHUB PAGES (10 min)

### Criar Repositório
- [ ] Acesse https://github.com/diegolimak
- [ ] Novo repositório
- [ ] Nome: `sudoeste-promo-agendamento`
- [ ] Descrição: `Sistema de agendamento de promoções Sudoeste Meu Amor`
- [ ] Público
- [ ] Criar

### Upload do Formulário
- [ ] Na aba "Add file" → Upload files
- [ ] Selecione: `formulario-agendamento.html`
- [ ] Mude nome para: `index.html`
- [ ] Commit

### Ativar Pages
- [ ] Settings → Pages
- [ ] Branch: `main`
- [ ] Folder: `/ (root)`
- [ ] Save
- [ ] Aguarde 1-2 min
- [ ] Copie URL: `https://diegolimak.github.io/sudoeste-promo-agendamento/`

---

## FASE 6: TRIGGERS AUTOMÁTICOS (5 min)

### Criar Triggers de Envio
- [ ] Volte para Google Apps Script
- [ ] Selecione a função: `criarTriggers()`
- [ ] Clique em "Executar" (botão ▶)
- [ ] Autorize se solicitado
- [ ] Verifique log: deve dizer "✅ Triggers criados"
- [ ] Feche

**Triggers criados para:**
- [ ] 09:00 (todos os dias)
- [ ] 15:00 (todos os dias)
- [ ] 18:00 (todos os dias)

---

## FASE 7: TESTES (20 min)

### Teste 1: Acesso ao Formulário
- [ ] Abra link: `https://diegolimak.github.io/sudoeste-promo-agendamento/`
- [ ] Verifique se carrega
- [ ] Verifique CSS (deve estar colorido, não quebrado)
- [ ] Verifique botões

### Teste 2: Cadastro Completo
- [ ] Selecione plano: `Diário`
- [ ] Preencha Instagram: `@teste_padaria`
- [ ] Preencha Negócio: `Padaria Teste`
- [ ] Preencha Promoção: `Pão com 20% desc`
- [ ] Selecione data: `Amanhã`
- [ ] Selecione horário: `09:00`
- [ ] Upload arte: Selecione uma imagem
- [ ] Upload comprovante: Selecione outra imagem
- [ ] Clique "Enviar Agendamento"
- [ ] Aguarde mensagem de sucesso: `✅ Agendamento confirmado`

### Teste 3: Verificar Planilha
- [ ] Abra Google Sheets
- [ ] Verifique se tem nova linha
- [ ] Verifique dados:
  - [ ] Coluna C: `teste_padaria` (Instagram)
  - [ ] Coluna D: `Padaria Teste` (Negócio)
  - [ ] Coluna E: `Pão com 20%...` (Promoção)
  - [ ] Coluna F: URL da arte (clicável)
  - [ ] Coluna G: URL do comprovante (clicável)
  - [ ] Coluna H: `pendente_validacao` (Status)

### Teste 4: Verificar Email
- [ ] Abra seu Gmail
- [ ] Verifique se recebeu email de notificação
- [ ] Título: `[Sudoeste] Nova promoção aguardando aprovação`
- [ ] Clique nos links de arte e comprovante
- [ ] Ambos abrem em Google Drive? ✓

### Teste 5: Aprovar Agendamento
- [ ] Volte à planilha
- [ ] Clique em qualquer célula da linha de teste
- [ ] Menu: 🌳 Sudoeste Promo
- [ ] ✅ Aprovar Selecionado
- [ ] Verifique se status mudou para `aprovado`
- [ ] Verifique coluna K (Data de aprovação preenchida)

### Teste 6: Envio Automático
**Opção A: Teste rápido**
- [ ] No Apps Script, clique em "Executar" → `verificarEEnviarAgendadas()`
- [ ] Verifique no WhatsApp se mensagem chegou
- [ ] Mensagem deve conter:
  - [ ] A ARTE (imagem)
  - [ ] Texto com @teste_padaria
  - [ ] Texto com "Padaria Teste"
  - [ ] Texto com "Pão com 20%"

**Opção B: Teste em horário real**
- [ ] Espere até o próximo horário (9h, 15h ou 18h)
- [ ] Verifique automaticamente
- [ ] Status deve mudar para `enviado`

---

## FASE 8: VALIDAÇÃO FINAL (10 min)

### Sistema Operacional
- [ ] Formulário acessível
- [ ] Uploads funcionando
- [ ] Validações funcionando
- [ ] Planilha recebendo dados
- [ ] Email sendo enviado
- [ ] Aprovação funcionando
- [ ] WhatsApp recebendo mensagem
- [ ] Status mudando automaticamente

### Dados Críticos
- [ ] Z-API conectado
- [ ] Google Apps Script rodando
- [ ] Google Drive recebendo imagens
- [ ] Google Sheets salva dados
- [ ] Email configurado

---

## FASE 9: GO-LIVE (Próxima semana)

### Preparativos
- [ ] Testar com 3-5 amigos/conhecidos
- [ ] Coletar feedback
- [ ] Fazer ajustes finais
- [ ] Documentar problemas encontrados

### Lançamento
- [ ] Publicar link no Instagram Bio
- [ ] Publicar no grupo WhatsApp Sudoeste
- [ ] Publicar nos stories
- [ ] Enviar para prospects iniciais
- [ ] Monitorar primeiros cadastros

### Primeira Semana
- [ ] Acompanhar cadastros
- [ ] Responder dúvidas
- [ ] Fazer ajustes se necessário
- [ ] Coletar mais feedback

---

## FASE 10: ESCALA (Próximas 4 semanas)

### Semana 1-2
- [ ] Primeiras 10-20 vendas
- [ ] Validar modelo
- [ ] Ajustar mensagem se necessário
- [ ] Target: R$ 500-1000

### Semana 3-4
- [ ] Aumentar demanda
- [ ] 40-50 vendas
- [ ] Otimizar copy
- [ ] Target: R$ 2000-3000

### Mês 2-3
- [ ] Escalar agressivamente
- [ ] 90+ vendas/mês
- [ ] Atingir R$ 10.000
- [ ] Explorar upsells

---

## PROBLEMAS ENCONTRADOS

| Problema | Solução | Status |
|----------|---------|--------|
| | | |
| | | |
| | | |

---

## NOTAS & OBSERVAÇÕES

```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

---

## CONTATOS IMPORTANTES

- **Z-API Support**: suporte@z-api.io
- **Google Support**: support.google.com
- **GitHub Help**: docs.github.com

---

## LINKS RÁPIDOS

- Formulário: `https://diegolimak.github.io/sudoeste-promo-agendamento/`
- Google Sheets: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
- Google Apps Script: `https://script.google.com/home`
- Z-API Dashboard: `https://app.z-api.io`
- GitHub: `https://github.com/diegolimak/sudoeste-promo-agendamento`

---

**Status Geral**: ☐ Em Andamento | ☐ Pronto | ☐ Live

**Observações Finais**:
```
_________________________________________________________________

_________________________________________________________________
```

---

**Assinado por**: _________________  
**Data**: _________________

✅ IMPLEMENTAÇÃO COMPLETA!
