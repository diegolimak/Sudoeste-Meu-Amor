# Sudoeste Meu Amor

Plataforma hiperlocal para o bairro **Sudoeste, Brasília-DF**.

Conecta moradores a negócios locais com agendamento de promoções, formulários web e automação via WhatsApp.

---

## O que é

Sistema completo de agendamento de promoções para o grupo WhatsApp **Sudoeste Meu Amor**, com:

- Formulário web com calendário interativo
- Seleção de plano (Diário / Semanal / Mensal)
- Upload de arte e comprovante
- Validação automática (máx 4 promos/dia)
- Envio automático via WhatsApp (Z-API)
- Registro em Google Sheets

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | HTML / CSS / JS |
| Backend | Google Apps Script |
| WhatsApp | Z-API |
| Formulários | EmailJS |
| Hospedagem | GitHub Pages |

**Modelo de receita:** Assinatura para negócios — R$ 39,90/mês

---

## Estrutura

```
/
├── files/
│   ├── formulario-agendamento.html   # Formulário público de agendamento
│   ├── apps-script-avancado.gs       # Google Apps Script (backend)
│   ├── CONFIG.gs                     # Configurações centralizadas
│   ├── CHECKLIST.md                  # Checklist de implementação
│   ├── INDEX.md                      # Índice dos arquivos
│   └── README_FINAL.md               # Documentação técnica completa
└── README.md
```

---

## Como usar

### 1. Formulário web

Abra `files/formulario-agendamento.html` no navegador ou hospede no GitHub Pages.

### 2. Google Apps Script

1. Acesse [script.google.com](https://script.google.com)
2. Crie um novo projeto
3. Cole o conteúdo de `apps-script-avancado.gs`
4. Configure as credenciais em `CONFIG.gs` (Z-API token, Chat ID, email)
5. Siga o `CHECKLIST.md` para deploy completo

---

## Status

Em desenvolvimento ativo. Ebook "Empreender no Sudoeste" disponível via Kiwify.

---

**GitHub:** [github.com/diegolimak](https://github.com/diegolimak)
