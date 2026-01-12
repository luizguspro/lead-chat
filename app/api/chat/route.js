import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// Import dos leads - adicione novos imports aqui
import leadsData from '../../../data/leads.json'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Carrega todos os leads
function loadAllLeads() {
  // Se for array, retorna direto. Se for objeto, coloca em array
  if (Array.isArray(leadsData)) {
    return leadsData
  }
  return [leadsData]
}

// Calcula stats
function getStats(leads) {
  return {
    total: leads.length,
    withEmail: leads.filter(l => 
      l.contato?.email_corporativo || 
      l.contato?.email_pessoal ||
      l.contato?.email
    ).length,
    withPhone: leads.filter(l => 
      l.contato?.telefone_direto || 
      l.contato?.whatsapp ||
      l.contato?.telefone
    ).length
  }
}

// Busca leads por termo
function searchLeads(leads, query) {
  const terms = query.toLowerCase().split(/\s+/)
  
  return leads.filter(lead => {
    const searchable = JSON.stringify(lead).toLowerCase()
    return terms.every(term => searchable.includes(term))
  })
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

// System prompt para o GPT
const SYSTEM_PROMPT = `Voce e Z, um assistente de vendas de elite. Sua funcao e ajudar o usuario a trabalhar com sua base de leads e fechar negocios.

PERSONALIDADE:
- Direto, sem enrolacao
- Foco em resultados e vendas
- Tom profissional mas humano
- Nunca use emojis
- Respostas concisas

CAPACIDADES:
1. BUSCAR leads por nome, empresa, cidade, segmento
2. CRIAR emails de abordagem personalizados
3. SUGERIR estrategias de abordagem baseadas no perfil
4. ANALISAR a base de leads
5. EXPORTAR dados para Excel (quando pedido)

FORMATO DE RESPOSTA:
- Use **negrito** para destacar informacoes importantes
- Seja breve e objetivo
- Quando mostrar leads, destaque: nome, cargo, empresa, contato principal

DADOS DISPONIVEIS:
Voce tem acesso a base de leads em JSON. Cada lead pode conter:
- dados_basicos: nome, empresa, cargo, segmento
- contato: email, telefone, whatsapp, cidade
- redes_sociais: linkedin, instagram
- alma: valores, motivadores, gatilhos
- abordagem: canal preferido, script sugerido

Quando o usuario pedir para criar um email ou mensagem de abordagem:
1. Analise o perfil do lead
2. Use os gatilhos e motivadores identificados
3. Personalize completamente
4. Seja conciso e direto
5. Inclua uma chamada para acao clara`

export async function POST(request) {
  try {
    const { message, history } = await request.json()
    
    if (!message) {
      return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })
    }
    
    const leads = loadAllLeads()
    const stats = getStats(leads)
    
    // Comando interno para stats
    if (message === '__stats__') {
      return NextResponse.json({ stats })
    }
    
    const msg = message.toLowerCase()
    
    // Exportar Excel
    if (msg.includes('exportar') || msg.includes('excel') || msg.includes('download')) {
      let leadsToExport = leads
      
      // Verifica se quer filtrar
      const searchMatch = msg.match(/exportar\s+(?:leads?\s+(?:de\s+)?)?(.+?)\s+(?:para|em)\s+excel/i)
      if (searchMatch) {
        leadsToExport = searchLeads(leads, searchMatch[1])
      }
      
      if (leadsToExport.length === 0) {
        return NextResponse.json({
          response: 'Nenhum lead encontrado para exportar.'
        })
      }
      
      const file = await generateExcel(leadsToExport)
      
      return NextResponse.json({
        response: `Exportacao concluida. **${leadsToExport.length} leads** prontos para download.`,
        file
      })
    }
    
    // Usar GPT para processar
    if (!process.env.OPENAI_API_KEY) {
      // Fallback sem GPT - busca simples
      const found = searchLeads(leads, message)
      
      if (found.length === 0) {
        return NextResponse.json({
          response: `Nenhum lead encontrado para "${message}". A base tem ${leads.length} leads.`,
          leads: []
        })
      }
      
      return NextResponse.json({
        response: `Encontrei **${found.length} lead(s)**:`,
        leads: found.slice(0, 10)
      })
    }
    
    // Com GPT
    const leadsContext = JSON.stringify(leads.slice(0, 50), null, 2)
    
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: `BASE DE LEADS (${leads.length} total):\n${leadsContext}` },
      ...(history || []).slice(-6).map(m => ({
        role: m.role,
        content: m.content
      })),
      { role: 'user', content: message }
    ]
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 1500
    })
    
    const response = completion.choices[0]?.message?.content || 'Sem resposta.'
    
    // Busca leads baseado na pergunta original do usuario (mais preciso)
    const queryTerms = message.toLowerCase().split(/\s+/).filter(t => t.length > 2)
    
    const mentionedLeads = leads.filter(lead => {
      const nome = (lead.dados_basicos?.nome_completo || lead.dados_basicos?.nome_social || '').toLowerCase()
      const empresa = (lead.dados_basicos?.empresa || '').toLowerCase()
      
      // Verifica se algum termo da busca aparece no nome ou empresa
      return queryTerms.some(term => 
        nome.includes(term) || empresa.includes(term)
      )
    })
    
    return NextResponse.json({
      response,
      leads: mentionedLeads.slice(0, 3)
    })
    
  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json({ 
      error: `Erro: ${error.message}` 
    }, { status: 500 })
  }
}