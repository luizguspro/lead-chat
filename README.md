# Z - Lead Intelligence

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/OpenAI-GPT--4-green?style=for-the-badge&logo=openai" />
</div>

<br />

**Z** é um assistente de vendas inteligente para gestão de leads. Utilize linguagem natural para buscar, analisar e criar abordagens personalizadas para seus leads.

## ✨ Funcionalidades

- 🔍 **Busca Inteligente** - Encontre leads por nome, cidade, segmento ou qualquer critério
- 📧 **Geração de Emails** - Crie emails de abordagem personalizados com IA
- 📊 **Estatísticas** - Visualize métricas da sua base de leads em tempo real
- 📥 **Exportação Excel** - Exporte leads filtrados para planilhas
- 💬 **Chat Natural** - Interaja em português de forma natural
- 🎯 **Anti-Alucinação** - Respostas precisas baseadas apenas nos dados reais

## 🚀 Quick Start

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/lead-chat.git
cd lead-chat

# 2. Instale as dependências
npm install

# 3. Configure a API Key (opcional, mas recomendado)
cp .env.example .env.local
# Edite .env.local com sua OPENAI_API_KEY

# 4. Inicie o servidor
npm run dev
```

Acesse: **http://localhost:3000**

## 📁 Estrutura do Projeto

```
lead-chat/
├── app/
│   ├── api/chat/route.js  # API do chat (backend)
│   ├── globals.css        # Estilos globais
│   ├── layout.js          # Layout principal
│   └── page.js            # Interface do chat
├── data/
│   └── leads.json         # Base de dados de leads
├── .env.local             # Configurações (API Key)
├── .env.example           # Exemplo de configuração
├── consolidar.py          # Script para consolidar JSONs
└── package.json           # Dependências
```

## 💬 Exemplos de Uso

### Buscar Leads
```
"Quem é João Silva?"
"Leads de Florianópolis"
"Leads do segmento imobiliário"
"Temos algum lead chamado Maria?"
```

### Obter Contatos
```
"Qual o telefone do Anderson?"
"Email da empresa X"
"Contato do lead Y"
```

### Criar Abordagens
```
"Criar email de abordagem para João Silva"
"Mensagem para o lead X"
```

### Exportar Dados
```
"Exportar leads para Excel"
"Exportar leads de Florianópolis"
"Baixar planilha"
```

### Estatísticas
```
"Quantos leads temos?"
"Mostrar estatísticas"
"Quantos leads de São José?"
```

## 🔧 Configuração da API

### Com OpenAI API Key (Recomendado)
- Respostas inteligentes e contextuais
- Geração de emails personalizados
- Análises de perfil avançadas

### Sem API Key
- Busca básica funciona normalmente
- Exportação para Excel funciona
- Estatísticas disponíveis
- Sem geração de texto com IA

## 📊 Formato dos Leads

Os leads devem seguir esta estrutura no `data/leads.json`:

```json
{
  "meta": {
    "score_completude": "70%",
    "confianca_dados": "alta",
    "data_pesquisa": "2024-01-15"
  },
  "dados_basicos": {
    "nome_completo": "João Silva",
    "empresa": "Empresa XYZ",
    "cargo": "Diretor Comercial",
    "segmento": "Tecnologia"
  },
  "contato": {
    "email_corporativo": "joao@empresa.com",
    "telefone_direto": "(48) 99999-9999",
    "cidade": "Florianópolis",
    "estado": "SC"
  },
  "redes_sociais": {
    "linkedin": "https://linkedin.com/in/joaosilva",
    "instagram": "@joaosilva"
  }
}
```

## 🔄 Consolidar Múltiplos JSONs

Se você tem vários arquivos JSON de leads, use o script de consolidação:

```bash
# Coloque os JSONs individuais na pasta data/
# Execute o script
python consolidar.py
```

O script irá criar um único `leads.json` com todos os leads.

## 🛠️ Tecnologias

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Next.js | 14.2.5 | Framework React |
| React | 18.3.1 | Interface do usuário |
| OpenAI | 4.52.0 | Integração com GPT |
| xlsx | 0.18.5 | Geração de Excel |

## 📝 Licença

MIT License - Sinta-se livre para usar e modificar.

---

<div align="center">
  <strong>Z</strong> - Lead Intelligence<br/>
  <sub>Transforme dados em vendas</sub>
</div>
