import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import leadsData from '../../../data/leads.json'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// ============================================
// CARREGAMENTO E PROCESSAMENTO DE LEADS
// ============================================

function loadAllLeads() {
  if (Array.isArray(leadsData)) return leadsData
  return [leadsData]
}

function getStats(leads) {
  return {
    total: leads.length,
    withEmail: leads.filter(l => 
      l.contato?.email_corporativo || l.contato?.email_pessoal || l.contato?.email
    ).length,
    withPhone: leads.filter(l => 
      l.contato?.telefone_direto || l.contato?.whatsapp || l.contato?.telefone
    ).length,
    withLinkedIn: leads.filter(l => l.redes_sociais?.linkedin).length,
    cities: [...new Set(leads.map(l => l.contato?.cidade).filter(Boolean))],
    segments: [...new Set(leads.map(l => l.dados_basicos?.segmento).filter(Boolean))]
  }
}

// ============================================
// FUNÇÕES DE BUSCA (ANTI-ALUCINAÇÃO)
// ============================================

// Normaliza texto para busca (remove acentos, lowercase)
function normalizeText(text) {
  if (!text) return ''
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

// Busca por nome - mais precisa
function searchByName(leads, name) {
  const normalizedQuery = normalizeText(name)
  const queryParts = normalizedQuery.split(/\s+/).filter(p => p.length > 1)
  
  return leads.filter(lead => {
    const nomeCompleto = normalizeText(lead.dados_basicos?.nome_completo)
    const nomeSocial = normalizeText(lead.dados_basicos?.nome_social)
    const empresa = normalizeText(lead.dados_basicos?.empresa)
    
    // Busca exata ou parcial no nome
    if (nomeCompleto && queryParts.every(part => nomeCompleto.includes(part))) return true
    if (nomeSocial && queryParts.every(part => nomeSocial.includes(part))) return true
    
    // Busca também na empresa se o nome não encontrar
    if (empresa && queryParts.every(part => empresa.includes(part))) return true
    
    return false
  })
}

// Busca por cidade
function searchByCity(leads, city) {
  const normalizedCity = normalizeText(city)
  return leads.filter(lead => {
    const leadCity = normalizeText(lead.contato?.cidade)
    return leadCity && leadCity.includes(normalizedCity)
  })
}

// Busca por segmento
function searchBySegment(leads, segment) {
  const normalizedSegment = normalizeText(segment)
  return leads.filter(lead => {
    const leadSegment = normalizeText(lead.dados_basicos?.segmento)
    return leadSegment && leadSegment.includes(normalizedSegment)
  })
}

// Busca geral em todos os campos
function searchGeneral(leads, query) {
  const normalizedQuery = normalizeText(query)
  const queryParts = normalizedQuery.split(/\s+/).filter(p => p.length > 2)
  
  if (queryParts.length === 0) return []
  
  return leads.filter(lead => {
    const searchableText = normalizeText(JSON.stringify(lead))
    return queryParts.some(part => searchableText.includes(part))
  })
}

// ============================================
// FORMATAÇÃO DE LEADS PARA CONTEXTO DA IA
// ============================================

function formatLeadForContext(lead) {
  const dados = lead.dados_basicos || {}
  const contato = lead.contato || {}
  const redes = lead.redes_sociais || {}
  const meta = lead.meta || {}
  const abordagem = lead.abordagem || {}
  
  let info = []
  
  if (dados.nome_completo) info.push(`Nome: ${dados.nome_completo}`)
  if (dados.empresa) info.push(`Empresa: ${dados.empresa}`)
  if (dados.cargo) info.push(`Cargo: ${dados.cargo}`)
  if (dados.segmento) info.push(`Segmento: ${dados.segmento}`)
  if (contato.email_corporativo) info.push(`Email Corporativo: ${contato.email_corporativo}`)
  if (contato.email_pessoal) info.push(`Email Pessoal: ${contato.email_pessoal}`)
  if (contato.telefone_direto) info.push(`Telefone: ${contato.telefone_direto}`)
  if (contato.whatsapp) info.push(`WhatsApp: ${contato.whatsapp}`)
  if (contato.cidade && contato.estado) info.push(`Localização: ${contato.cidade}/${contato.estado}`)
  if (redes.linkedin) info.push(`LinkedIn: ${redes.linkedin}`)
  if (redes.instagram) info.push(`Instagram: ${redes.instagram}`)
  if (meta.score_completude) info.push(`Score de Completude: ${meta.score_completude}`)
  if (abordagem.script_abertura) info.push(`Script de Abertura: ${abordagem.script_abertura}`)
  
  return info.join('\n')
}

function formatLeadsForContext(leads, maxLeads = 10) {
  return leads.slice(0, maxLeads).map((lead, idx) => {
    return `--- Lead ${idx + 1} ---\n${formatLeadForContext(lead)}`
  }).join('\n\n')
}

// ============================================
// GERAÇÃO DE EXCEL
// ============================================

async function generateExcel(leads) {
  const XLSX = await import('xlsx')
  
  const rows = leads.map(lead => ({
    Nome: lead.dados_basicos?.nome_completo || lead.dados_basicos?.nome_social || '',
    Empresa: lead.dados_basicos?.empresa || '',
    Cargo: lead.dados_basicos?.cargo || '',
    Segmento: lead.dados_basicos?.segmento || '',
    'Email Corporativo': lead.contato?.email_corporativo || '',
    'Email Pessoal': lead.contato?.email_pessoal || '',
    Telefone: lead.contato?.telefone_direto || '',
    WhatsApp: lead.contato?.whatsapp || '',
    Cidade: lead.contato?.cidade || '',
    Estado: lead.contato?.estado || '',
    LinkedIn: lead.redes_sociais?.linkedin || '',
    Instagram: lead.redes_sociais?.instagram || '',
    Score: lead.meta?.score_completude || ''
  }))
  
  const ws = XLSX.utils.json_to_sheet(rows)
  
  // Ajustar largura das colunas
  ws['!cols'] = [
    { wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 25 },
    { wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 5 }, { wch: 40 }, { wch: 20 }, { wch: 8 }
  ]
  
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Leads')
  
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const base64 = buffer.toString('base64')
  
  return {
    name: `leads_${new Date().toISOString().split('T')[0]}.xlsx`,
    url: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`
  }
}

// ============================================
// INTEGRAÇÃO COM OPENAI (ANTI-ALUCINAÇÃO)
// ============================================

async function callGPT(systemPrompt, userMessage, leadsContext = '', history = []) {
  if (!process.env.OPENAI_API_KEY) return null
  
  try {
    const messages = [
      { role: 'system', content: systemPrompt }
    ]
    
    // Adiciona contexto dos leads se houver
    if (leadsContext) {
      messages.push({ 
        role: 'system', 
        content: `DADOS DOS LEADS ENCONTRADOS NA BASE (USE APENAS ESTAS INFORMAÇÕES):\n\n${leadsContext}` 
      })
    }
    
    // Adiciona histórico recente (últimas 6 mensagens)
    const recentHistory = history.slice(-6)
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })
    }
    
    messages.push({ role: 'user', content: userMessage })
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages,
      temperature: 0.3,
      max_tokens: 1000
    })
    
    return completion.choices[0]?.message?.content || null
  } catch (e) {
    console.error('GPT Error:', e)
    return null
  }
}

// ============================================
// SISTEMA PRINCIPAL DE PROCESSAMENTO
// ============================================

const SYSTEM_PROMPT = `Você é o Z, um assistente de vendas inteligente e profissional. Você ajuda a equipe de vendas a gerenciar e interagir com leads.

REGRAS IMPORTANTES (ANTI-ALUCINAÇÃO):
1. NUNCA invente informações sobre leads. Use APENAS os dados fornecidos no contexto.
2. Se não encontrar um lead ou informação, diga claramente que não encontrou.
3. Seja preciso com nomes, emails, telefones - não invente dados.
4. Se o usuário perguntar sobre um lead que não está no contexto, diga que não encontrou na base.
5. Formate suas respostas de forma clara e profissional.
6. Use **negrito** para destacar informações importantes.
7. Seja direto e objetivo, sem enrolação.
8. Quando listar leads, inclua as informações mais relevantes de cada um.
9. Para criar emails de abordagem, use os dados reais do lead fornecido.
10. Nunca diga que vai "verificar" ou "consultar" - você já tem acesso aos dados no contexto.

CAPACIDADES:
- Buscar leads por nome, cidade, segmento ou qualquer critério
- Mostrar detalhes completos de um lead específico
- Criar emails de abordagem personalizados
- Analisar perfis de leads
- Exportar dados para Excel
- Responder perguntas sobre a base de leads

FORMATO DE RESPOSTA:
- Use markdown para formatação
- Destaque informações importantes em **negrito**
- Seja conciso mas completo`

export async function POST(request) {
  try {
    const { message, history = [] } = await request.json()
    
    if (!message) {
      return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })
    }
    
    const leads = loadAllLeads()
    const stats = getStats(leads)
    
    // Comando interno para stats
    if (message === '__stats__') {
      return NextResponse.json({ stats })
    }
    
    const msg = message.toLowerCase().trim()
    const normalizedMsg = normalizeText(message)
    
    // ============================================
    // DETECÇÃO DE INTENÇÕES
    // ============================================
    
    // 1. SAUDAÇÕES
    if (/^(oi|olá|ola|hey|hi|hello|bom dia|boa tarde|boa noite|e ai|eai|fala|salve|opa)[\s!?.]*$/i.test(msg)) {
      return NextResponse.json({
        response: `Olá! 👋 Sou o **Z**, seu assistente de vendas.\n\nTenho **${leads.length} leads** na base, sendo **${stats.withEmail}** com email e **${stats.withPhone}** com telefone.\n\nComo posso ajudar? Você pode:\n- Buscar leads por nome, cidade ou segmento\n- Pedir detalhes de um lead específico\n- Criar emails de abordagem\n- Exportar dados para Excel`,
        leads: []
      })
    }
    
    // 2. AJUDA
    if (/^(ajuda|help|como funciona|o que voce faz|comandos|menu)[\s!?.]*$/i.test(msg)) {
      return NextResponse.json({
        response: `## 📋 Como posso ajudar\n\n**Buscar Leads:**\n- "Quem é João Silva?"\n- "Leads de Florianópolis"\n- "Leads do segmento imobiliário"\n\n**Informações:**\n- "Qual o telefone do Anderson?"\n- "Email da Maria"\n- "Detalhes do lead X"\n\n**Ações:**\n- "Criar email de abordagem para João"\n- "Exportar leads para Excel"\n- "Quantos leads temos?"\n\n**Estatísticas:**\n- Total: **${leads.length}** leads\n- Com email: **${stats.withEmail}**\n- Com telefone: **${stats.withPhone}**`,
        leads: []
      })
    }
    
    // 3. LISTAR TODOS
    if (msg.includes('listar todos') || msg.includes('todos os leads') || msg.includes('mostrar todos') || msg.includes('ver todos')) {
      const leadsToShow = leads.slice(0, 15)
      return NextResponse.json({
        response: `📋 **Base completa: ${leads.length} leads**\n\nMostrando os primeiros ${leadsToShow.length}:`,
        leads: leadsToShow
      })
    }
    
    // 4. EXPORTAR
    if (msg.includes('exportar') || msg.includes('excel') || msg.includes('download') || msg.includes('baixar')) {
      let leadsToExport = leads
      
      // Verifica se quer exportar filtrado
      const cityMatch = msg.match(/(?:de|da)\s+(florianopolis|floripa|sao jose|palhoca|curitiba|joinville)/i)
      if (cityMatch) {
        leadsToExport = searchByCity(leads, cityMatch[1])
      }
      
      if (leadsToExport.length === 0) {
        return NextResponse.json({
          response: `Não encontrei leads para exportar com esse filtro.`,
          leads: []
        })
      }
      
      const file = await generateExcel(leadsToExport)
      return NextResponse.json({
        response: `✅ **Exportação concluída!**\n\n**${leadsToExport.length} leads** prontos para download.`,
        file,
        leads: []
      })
    }
    
    // 5. ESTATÍSTICAS / QUANTOS
    if (msg.includes('quantos') || msg.includes('quantas') || msg.includes('total de') || msg.includes('quantidade') || msg.includes('estatisticas') || msg.includes('resumo')) {
      // Verifica se quer contar algo específico
      const cityMatch = msg.match(/(?:de|da|em)\s+(florianopolis|floripa|sao jose|palhoca|curitiba|joinville)/i)
      const segmentMatch = msg.match(/(?:de|do|da)\s+(imobiliario|financ|seguro|saude|tecnologia|marketing|juridico|construcao)/i)
      
      if (cityMatch) {
        const found = searchByCity(leads, cityMatch[1])
        return NextResponse.json({
          response: `📊 Encontrei **${found.length} leads** em ${cityMatch[1]}.`,
          leads: found.slice(0, 5)
        })
      }
      
      if (segmentMatch) {
        const found = searchBySegment(leads, segmentMatch[1])
        return NextResponse.json({
          response: `📊 Encontrei **${found.length} leads** no segmento "${segmentMatch[1]}".`,
          leads: found.slice(0, 5)
        })
      }
      
      return NextResponse.json({
        response: `## 📊 Estatísticas da Base\n\n| Métrica | Valor |\n|---------|-------|\n| **Total de Leads** | ${leads.length} |\n| Com Email | ${stats.withEmail} |\n| Com Telefone | ${stats.withPhone} |\n| Com LinkedIn | ${stats.withLinkedIn} |\n\n**Principais Cidades:** ${stats.cities.slice(0, 5).join(', ')}`,
        leads: []
      })
    }
    
    // 6. BUSCA POR CIDADE
    const cityKeywords = ['florianopolis', 'floripa', 'sao jose', 'palhoca', 'curitiba', 'joinville', 'blumenau', 'itajai', 'biguacu', 'sombrio', 'imbituba']
    for (const city of cityKeywords) {
      if (normalizedMsg.includes(city)) {
        const found = searchByCity(leads, city)
        if (found.length > 0) {
          return NextResponse.json({
            response: `🏙️ Encontrei **${found.length} leads** em ${city.charAt(0).toUpperCase() + city.slice(1)}:`,
            leads: found.slice(0, 10)
          })
        }
      }
    }
    
    // 7. CRIAR EMAIL DE ABORDAGEM
    if (msg.includes('criar email') || msg.includes('escrever email') || msg.includes('email de abordagem') || 
        msg.includes('email para') || msg.includes('abordagem para') || msg.includes('mensagem para')) {
      
      // Extrai o nome do lead
      const nameMatch = message.match(/(?:para|do|da)\s+["']?([A-Za-záéíóúãõçêâôÁÉÍÓÚÃÕÇÊÂÔ\s]+?)["']?(?:\?|$|\.)/i)
      
      if (!nameMatch || !nameMatch[1]) {
        return NextResponse.json({
          response: `Para criar um email de abordagem, preciso saber o nome do lead.\n\n**Exemplo:** "Criar email para João Silva"`,
          leads: []
        })
      }
      
      const searchName = nameMatch[1].trim()
      const found = searchByName(leads, searchName)
      
      if (found.length === 0) {
        return NextResponse.json({
          response: `❌ Não encontrei nenhum lead chamado **"${searchName}"** na base.\n\nTente buscar por outro nome ou verifique a grafia.`,
          leads: []
        })
      }
      
      const lead = found[0]
      const leadContext = formatLeadForContext(lead)
      
      const emailPrompt = `Crie um email de abordagem comercial personalizado para este lead.

REGRAS:
- Use APENAS as informações fornecidas sobre o lead
- Seja profissional e direto
- Máximo 150 palavras
- Não use emojis
- Personalize com base no cargo, empresa e segmento do lead
- Inclua uma proposta de valor clara
- Termine com um call-to-action`

      const emailContent = await callGPT(emailPrompt, `Criar email de abordagem para ${lead.dados_basicos?.nome_completo || lead.dados_basicos?.empresa}`, leadContext, history)
      
      if (emailContent) {
        return NextResponse.json({
          response: `## ✉️ Email de Abordagem\n\n**Para:** ${lead.dados_basicos?.nome_completo || 'Lead'}\n\n---\n\n${emailContent}`,
          leads: [lead]
        })
      } else {
        return NextResponse.json({
          response: `Encontrei o lead **${lead.dados_basicos?.nome_completo || lead.dados_basicos?.empresa}**. Configure a API da OpenAI para gerar emails personalizados.`,
          leads: [lead]
        })
      }
    }
    
    // 8. BUSCA POR TELEFONE/EMAIL DE ALGUÉM
    const contactMatch = message.match(/(?:qual\s+(?:o|e|é)\s+)?(?:telefone|email|contato|whatsapp)\s+(?:d[oa]\s+)?["']?([A-Za-záéíóúãõçêâôÁÉÍÓÚÃÕÇÊÂÔ\s]+?)["']?(?:\?|$)/i)
    if (contactMatch && contactMatch[1]) {
      const searchName = contactMatch[1].trim()
      const found = searchByName(leads, searchName)
      
      if (found.length === 0) {
        return NextResponse.json({
          response: `❌ Não encontrei nenhum lead chamado **"${searchName}"** na base.`,
          leads: []
        })
      }
      
      const lead = found[0]
      const contato = lead.contato || {}
      const nome = lead.dados_basicos?.nome_completo || lead.dados_basicos?.empresa || 'Lead'
      
      let contactInfo = `## 📞 Contato de ${nome}\n\n`
      if (contato.email_corporativo) contactInfo += `**Email Corporativo:** ${contato.email_corporativo}\n`
      if (contato.email_pessoal) contactInfo += `**Email Pessoal:** ${contato.email_pessoal}\n`
      if (contato.telefone_direto) contactInfo += `**Telefone:** ${contato.telefone_direto}\n`
      if (contato.whatsapp) contactInfo += `**WhatsApp:** ${contato.whatsapp}\n`
      if (contato.telefone_empresa) contactInfo += `**Tel. Empresa:** ${contato.telefone_empresa}\n`
      
      if (contactInfo === `## 📞 Contato de ${nome}\n\n`) {
        contactInfo += `_Sem informações de contato disponíveis para este lead._`
      }
      
      return NextResponse.json({
        response: contactInfo,
        leads: [lead]
      })
    }
    
    // 9. BUSCA POR NOME (quem é, dados de, perfil de, etc)
    const namePatterns = [
      /(?:quem\s+(?:e|é)\s+(?:o\s+|a\s+)?)["']?([A-Za-záéíóúãõçêâôÁÉÍÓÚÃÕÇÊÂÔ\s]+?)["']?(?:\?|$)/i,
      /(?:dados?|perfil|informacoes?|detalhes?)\s+(?:d[oa]\s+)["']?([A-Za-záéíóúãõçêâôÁÉÍÓÚÃÕÇÊÂÔ\s]+?)["']?(?:\?|$)/i,
      /(?:tem|existe|temos|teria|ha|há|voce\s+tem|você\s+tem|voce\s+teria|você\s+teria)\s+(?:algum\s+)?(?:lead\s+)?(?:chamad[oa]\s+|com\s+(?:o\s+)?nome\s+)["']?([A-Za-záéíóúãõçêâôÁÉÍÓÚÃÕÇÊÂÔ\s]+?)["']?(?:\?|$)/i,
      /(?:tem|existe|temos|teria)\s+(?:algum\s+)?(?:lead\s+)?chamad[oa]\s+["']?([A-Za-záéíóúãõçêâôÁÉÍÓÚÃÕÇÊÂÔ\s]+?)["']?(?:\?|$)/i,
      /(?:buscar|procurar|encontrar|achar)\s+(?:lead\s+)?(?:chamad[oa]\s+)?["']?([A-Za-záéíóúãõçêâôÁÉÍÓÚÃÕÇÊÂÔ\s]+?)["']?(?:\?|$)/i,
      /lead\s+["']?([A-Za-záéíóúãõçêâôÁÉÍÓÚÃÕÇÊÂÔ\s]+?)["']?(?:\?|$)/i,
      /com\s+(?:o\s+)?nome\s+(?:de\s+)?["']?([A-Za-záéíóúãõçêâôÁÉÍÓÚÃÕÇÊÂÔ\s]+?)["']?(?:\?|$)/i
    ]
    
    for (const pattern of namePatterns) {
      const match = message.match(pattern)
      if (match && match[1] && match[1].trim().length > 2) {
        const searchName = match[1].trim()
        
        // Ignora se for uma cidade conhecida
        if (cityKeywords.some(c => normalizeText(searchName).includes(c))) continue
        
        const found = searchByName(leads, searchName)
        
        if (found.length === 0) {
          return NextResponse.json({
            response: `❌ Não encontrei nenhum lead chamado **"${searchName}"** na base.\n\nTente:\n- Verificar a grafia do nome\n- Buscar por parte do nome\n- Listar todos os leads`,
            leads: []
          })
        }
        
        return NextResponse.json({
          response: `✅ Encontrei **${found.length} lead(s)** para "${searchName}":`,
          leads: found.slice(0, 5)
        })
      }
    }
    
    // 10. BUSCA POR SEGMENTO
    const segmentKeywords = ['imobiliario', 'financ', 'seguro', 'saude', 'tecnologia', 'tech', 'software', 
      'marketing', 'publicidade', 'juridico', 'advocacia', 'contabil', 'construcao', 'automotivo']
    
    for (const segment of segmentKeywords) {
      if (normalizedMsg.includes(segment)) {
        const found = searchBySegment(leads, segment)
        if (found.length > 0) {
          return NextResponse.json({
            response: `🏢 Encontrei **${found.length} leads** no segmento relacionado a "${segment}":`,
            leads: found.slice(0, 10)
          })
        }
      }
    }
    
    // 11. FALLBACK - USA GPT COM CONTEXTO DOS LEADS
    // Primeiro tenta uma busca geral
    const generalResults = searchGeneral(leads, message)
    
    if (generalResults.length > 0) {
      // Se encontrou algo, usa GPT para formatar a resposta
      const leadsContext = formatLeadsForContext(generalResults)
      
      const gptResponse = await callGPT(
        SYSTEM_PROMPT,
        message,
        leadsContext,
        history
      )
      
      if (gptResponse) {
        return NextResponse.json({
          response: gptResponse,
          leads: generalResults.slice(0, 5)
        })
      }
      
      return NextResponse.json({
        response: `Encontrei **${generalResults.length} leads** relacionados à sua busca:`,
        leads: generalResults.slice(0, 5)
      })
    }
    
    // Se não encontrou nada, usa GPT para responder de forma útil
    const statsContext = `Base de dados: ${leads.length} leads total, ${stats.withEmail} com email, ${stats.withPhone} com telefone. Cidades: ${stats.cities.slice(0, 5).join(', ')}.`
    
    const gptResponse = await callGPT(
      SYSTEM_PROMPT + '\n\nIMPORTANTE: Não há leads correspondentes à busca do usuário. Informe isso claramente e sugira alternativas.',
      message,
      statsContext,
      history
    )
    
    if (gptResponse) {
      return NextResponse.json({
        response: gptResponse,
        leads: []
      })
    }
    
    // Resposta padrão se GPT não estiver disponível
    return NextResponse.json({
      response: `Não encontrei resultados para sua busca.\n\n**Tente:**\n- Buscar por nome: "Quem é João Silva?"\n- Buscar por cidade: "Leads de Florianópolis"\n- Listar todos: "Mostrar todos os leads"\n- Exportar: "Exportar para Excel"`,
      leads: []
    })
    
  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json({ 
      error: `Erro ao processar sua solicitação. Por favor, tente novamente.` 
    }, { status: 500 })
  }
}
