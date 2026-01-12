# Chat Z - Lead Intelligence

Assistente de vendas inteligente para gestao de leads.

## Setup

```bash
# Instalar dependencias
npm install

# Configurar API (opcional)
cp .env.example .env.local
# Editar .env.local com sua OPENAI_API_KEY

# Rodar
npm run dev
```

Acesse: http://localhost:3000

## Estrutura

```
chat-z/
├── app/
│   ├── api/chat/route.js  # API do chat
│   ├── globals.css        # Estilos
│   ├── layout.js          # Layout
│   └── page.js            # Interface
├── data/                  # JSONs de leads (adicione aqui)
└── .env.local             # Configuracoes
```

## Uso

### Adicionar Leads
Coloque os JSONs gerados pelo pesquisador na pasta `data/`.

### Comandos do Chat
- "Listar todos os leads"
- "Quem sao os leads de Florianopolis?"
- "Criar email de abordagem para [nome]"
- "Exportar leads para Excel"
- "Qual o telefone do [nome]?"
- "Analise o perfil do [nome]"

### Exportacao
O chat gera Excel automaticamente quando voce pede.

## API Key

Com OpenAI API Key:
- Respostas inteligentes
- Criacao de emails personalizados
- Analises de perfil

Sem API Key:
- Busca basica funciona
- Exportacao funciona
- Sem geracao de texto
