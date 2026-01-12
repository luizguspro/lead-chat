import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import leadsData from '../../../data/leads.json'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Carrega leads
function loadAllLeads() {
  if (Array.isArray(leadsData)) return leadsData
  return [leadsData]
}

// Stats
function getStats(leads) {
  return {
    total: leads.length,
    withEmail: leads.filter(l => 
      l.contato?.email_corporativo || l.contato?.email_pessoal || l.contato?.email
    ).length,
    withPhone: leads.filter(l => 
      l.contato?.telefone_direto || l.contato?.whatsapp || l.contato?.telefone
    ).length
  }
}

// Busca por nome específico
function searchByName(leads, name) {
  const q = name.toLowerCase().trim()
  return leads.filter(lead => {
    const nomeCompleto = (lead.dados_basicos?.nome_completo || '').toLowerCase()
    const nomeSocial = (lead.dados_basicos?.nome_social || '').toLowerCase()
    return nomeCompleto.includes(q) || nomeSocial.includes(q)
  })
}

// Busca por termo geral (segmento, cidade, empresa, etc)
function searchGeneral(leads, query) {
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2)
  if (terms.length === 0) return []
  
  return leads.filter(lead => {
    const searchable = JSON.stringify(lead).toLowerCase()
    return terms.some(term => searchable.includes(term))
  })
}

// Classifica a intenção da mensagem
function classifyIntent(message) {
  const msg = message.toLowerCase().trim()
  
  // Saudações
  if (/^(oi|olá|ola|hey|hi|hello|bom dia|boa tarde|boa noite|e ai|eai|fala|salve)[\s!?.]*$/i.test(msg)) {
    return { type: 'greeting' }
  }
  
  // Ajuda
  if (/^(ajuda|help|como funciona|o que voce faz|comandos)[\s!?.]*$/i.test(msg)) {
    return { type: 'help' }
  }
  
  // Listar todos
  if (msg.includes('listar todos') || msg.includes('todos os leads') || msg.includes('mostrar todos') || msg.includes('ver todos')) {
    return { type: 'list_all' }
  }
  
  // Exportar
  if (msg.includes('exportar') || msg.includes('excel') || msg.includes('download') || msg.includes('baixar')) {
    return { type: 'export', query: msg }
  }
  
  // Quantos/total
  if (msg.includes('quantos') || msg.includes('quantas') || msg.includes('total de') || msg.includes('quantidade')) {
    // Extrai o que quer contar
    const match = msg.match(/quantos?\s+leads?\s+(?:de\s+|relacionado\s+a\s+|sobre\s+)?(.+?)(?:\?|$)/i) ||
                  msg.match(/quantos?\s+(.+?)(?:\?|$)/i)
    return { type: 'count', query: match ? match[1].trim() : null }
  }
  
  // Busca por nome (chamado, contato do, dados do, perfil do)
  const namePatterns = [
    /(?:lead|contato|dados?|perfil|informacoes?)\s+(?:d[oa]\s+)?["']?([a-záéíóúãõçê\s]+?)["']?(?:\?|$)/i,
    /chamad[oa]\s+["']?([a-záéíóúãõçê\s]+?)["']?(?:\?|$)/i,
    /quem\s+(?:e|é)\s+(?:o\s+|a\s+)?["']?([a-záéíóúãõçê\s]+?)["']?(?:\?|$)/i,
    /(?:tem|existe)\s+(?:algum\s+)?(?:lead\s+)?(?:chamad[oa]\s+)?["']?([a-záéíóúãõçê]+)["']?(?:\?|$)/i,
    /telefone\s+d[oa]\s+["']?([a-záéíóúãõçê\s]+?)["']?(?:\?|$)/i,
    /email\s+d[oa]\s+["']?([a-záéíóúãõçê\s]+?)["']?(?:\?|$)/i,
  ]
  
  for (const pattern of namePatterns) {
    const match = message.match(pattern)
    if (match && match[1] && match[1].trim().length > 1) {
      return { type: 'search_name', name: match[1].trim() }
    }
  }
  
  // Busca por segmento/cidade/cargo
  const segmentKeywords = ['publicidade', 'marketing', 'tecnologia', 'tech', 'software', 'jurídico', 'advocacia', 'advogado', 
    'contabil', 'contador', 'financeiro', 'seguros', 'saude', 'saúde', 'consultoria', 'consultor', 'arquiteto', 'engenheiro']
  const cityKeywords = ['florianópolis', 'florianopolis', 'floripa', 'são josé', 'sao jose', 'palhoça', 'palhoca', 
    'curitiba', 'joinville', 'blumenau', 'itajaí', 'itajai']
  
  for (const kw of [...segmentKeywords, ...cityKeywords]) {
    if (msg.includes(kw)) {
      return { type: 'search_general', query: kw }
    }
  }
  
  // Criar email/abordagem
  if (msg.includes('criar email') || msg.includes('escrever email') || msg.includes('email de abordagem') || 
      msg.includes('mensagem para') || msg.includes('abordagem para')) {
    const nameMatch = msg.match(/(?:para|do|da)\s+["']?([a-záéíóúãõçê\s]+?)["']?(?:\?|$)/i)
    return { type: 'create_email', name: nameMatch ? nameMatch[1].trim() : null }
  }
  
  // Fallback: tenta interpretar como busca
  return { type: 'general_query', query: message }
}

// Gera Excel
async function generateExcel(leads) {
  const XLSX = await import('xlsx')
  
  const rows = leads.map(lead => ({
    Nome: lead.dados_basicos?.nome_completo || '',
    Empresa: lead.dados_basicos?.empresa || '',
    Cargo: lead.dados_basicos?.cargo || '',
    Email: lead.contato?.email_corporativo || lead.contato?.email_pessoal || '',
    Telefone: lead.contato?.telefone_direto || lead.contato?.whatsapp || '',
    LinkedIn: lead.redes_sociais?.linkedin || '',
    Instagram: lead.redes_sociais?.instagram || '',
    Cidade: lead.contato?.cidade || '',
    Estado: lead.contato?.estado || '',
    Segmento: lead.dados_basicos?.segmento || '',
    Score: lead.meta?.score_completude || ''
  }))
  
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Leads')
  
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const base64 = buffer.toString('base64')
  
  return {
    name: `leads_${new Date().toISOString().split('T')[0]}.xlsx`,
    url: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`
  }
}

// Chama GPT quando necessário
async function callGPT(systemPrompt, userMessage, context = '') {
  if (!process.env.OPENAI_API_KEY) return null
  
  try {
    const messages = [
      { role: 'system', content: systemPrompt },
    ]
    if (context) {
      messages.push({ role: 'system', content: context })
    }
    messages.push({ role: 'user', content: userMessage })
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.3,
      max_tokens: 800
    })
    
    return completion.choices[0]?.message?.content || null
  } catch (e) {
    console.error('GPT Error:', e)
    return null
  }
}

export async function POST(request) {
  try {
    const { message, history } = await request.json()
    
    if (!message) {
      return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })
    }
    
    const leads = loadAllLeads()
    const stats = getStats(leads)
    
    // Stats interno
    if (message === '__stats__') {
      return NextResponse.json({ stats })
    }
    
    // Classifica intenção
    const intent = classifyIntent(message)
    
    switch (intent.type) {
      
      case 'greeting':
        return NextResponse.json({
          response: `Ola! Sou o Z, seu assistente de vendas. Tenho **${leads.length} leads** na base. Como posso ajudar?`,
          leads: []
        })
      
      case 'help':
        return NextResponse.json({
          response: `Posso ajudar com:\n\n- **Buscar leads**: "Voce tem algum lead chamado João?"\n- **Filtrar por segmento**: "Leads de publicidade"\n- **Filtrar por cidade**: "Quem é de Florianópolis?"\n- **Contar**: "Quantos leads de tecnologia?"\n- **Exportar**: "Exportar para Excel"\n- **Criar abordagem**: "Criar email para João Silva"`,
          leads: []
        })
      
      case 'list_all':
        return NextResponse.json({
          response: `Base completa: **${leads.length} leads**. Mostrando os primeiros:`,
          leads: leads.slice(0, 10)
        })
      
      case 'export': {
        const file = await generateExcel(leads)
        return NextResponse.json({
          response: `Exportacao concluida. **${leads.length} leads** prontos para download.`,
          file,
          leads: []
        })
      }
      
      case 'count': {
        if (!intent.query) {
          return NextResponse.json({
            response: `Total na base: **${leads.length} leads**\n- Com email: **${stats.withEmail}**\n- Com telefone: **${stats.withPhone}**`,
            leads: []
          })
        }
        const found = searchGeneral(leads, intent.query)
        return NextResponse.json({
          response: `Encontrei **${found.length} leads** relacionados a "${intent.query}".`,
          leads: found.slice(0, 5)
        })
      }
      
      case 'search_name': {
        const found = searchByName(leads, intent.name)
        if (found.length === 0) {
          return NextResponse.json({
            response: `Nao encontrei nenhum lead chamado "${intent.name}" na base.`,
            leads: []
          })
        }
        return NextResponse.json({
          response: `Encontrei **${found.length} lead(s)** com nome "${intent.name}":`,
          leads: found.slice(0, 5)
        })
      }
      
      case 'search_general': {
        const found = searchGeneral(leads, intent.query)
        if (found.length === 0) {
          return NextResponse.json({
            response: `Nao encontrei leads relacionados a "${intent.query}".`,
            leads: []
          })
        }
        return NextResponse.json({
          response: `Encontrei **${found.length} leads** relacionados a "${intent.query}":`,
          leads: found.slice(0, 5)
        })
      }
      
      case 'create_email': {
        if (!intent.name) {
          return NextResponse.json({
            response: `Para criar um email, me diz o nome do lead. Ex: "Criar email para João Silva"`,
            leads: []
          })
        }
        const found = searchByName(leads, intent.name)
        if (found.length === 0) {
          return NextResponse.json({
            response: `Nao encontrei lead chamado "${intent.name}" para criar o email.`,
            leads: []
          })
        }
        
        const lead = found[0]
        const prompt = `Crie um email de abordagem comercial personalizado. Seja direto, profissional, sem emojis. Max 150 palavras.`
        const context = `Lead:\n${JSON.stringify(lead, null, 2)}`
        
        const emailContent = await callGPT(prompt, `Criar email de abordagem para ${lead.dados_basicos?.nome_completo}`, context)
        
        return NextResponse.json({
          response: emailContent || `Lead encontrado: **${lead.dados_basicos?.nome_completo}**. Configure a API da OpenAI para gerar emails personalizados.`,
          leads: [lead]
        })
      }
      
      case 'general_query':
      default: {
        // Tenta busca geral
        const found = searchGeneral(leads, intent.query || message)
        
        if (found.length > 0) {
          return NextResponse.json({
            response: `Encontrei **${found.length} leads** relacionados:`,
            leads: found.slice(0, 5)
          })
        }
        
        // Se nao achou nada, usa GPT pra responder
        const gptResponse = await callGPT(
          `Voce e Z, assistente de vendas. Responda de forma util e direta. Sem emojis. Se a pergunta for sobre leads e voce nao tiver info, sugira como o usuario pode buscar.`,
          message,
          `Total de leads na base: ${leads.length}`
        )
        
        return NextResponse.json({
          response: gptResponse || `Nao entendi sua pergunta. Tente: "buscar [nome]", "leads de [cidade]", ou "exportar excel".`,
          leads: []
        })
      }
    }
    
  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json({ error: `Erro: ${error.message}` }, { status: 500 })
  }
}