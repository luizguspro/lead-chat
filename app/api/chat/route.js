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

// Busca PRECISA por nome
function searchByName(leads, query) {
  const q = query.toLowerCase().trim()
  
  return leads.filter(lead => {
    const nomeCompleto = (lead.dados_basicos?.nome_completo || '').toLowerCase()
    const nomeSocial = (lead.dados_basicos?.nome_social || '').toLowerCase()
    const empresa = (lead.dados_basicos?.empresa || '').toLowerCase()
    
    // Match no nome ou empresa
    return nomeCompleto.includes(q) || 
           nomeSocial.includes(q) || 
           empresa.includes(q)
  })
}

// Busca geral
function searchLeads(leads, query) {
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2)
  
  return leads.filter(lead => {
    const searchable = JSON.stringify(lead).toLowerCase()
    return terms.every(term => searchable.includes(term))
  })
}

// Extrai nome da pergunta
function extractSearchTerm(query) {
  const q = query.toLowerCase()
  
  // Padroes comuns
  const patterns = [
    /(?:lead|contato|dados?|perfil|sobre|quem é|buscar?|procurar?|achar?|chamad[oa])\s+(?:d[oa]\s+)?(?:chamad[oa]\s+)?["']?([a-záéíóúãõç\s]+?)["']?(?:\?|$|,)/i,
    /telefone\s+d[oa]\s+["']?([a-záéíóúãõç\s]+?)["']?(?:\?|$)/i,
    /email\s+d[oa]\s+["']?([a-záéíóúãõç\s]+?)["']?(?:\?|$)/i,
    /algum.*chamad[oa]\s+["']?([a-záéíóúãõç\s]+?)["']?(?:\?|$)/i,
  ]
  
  for (const pattern of patterns) {
    const match = query.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  
  // Ultima tentativa: palavras com inicial maiuscula que parecem nomes
  const words = query.split(/\s+/)
  const possibleNames = words.filter(w => /^[A-ZÁÉÍÓÚÃÕÇ][a-záéíóúãõç]{2,}$/.test(w))
  if (possibleNames.length > 0) {
    return possibleNames[0].toLowerCase()
  }
  
  return null
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

// System prompt RESTRITIVO
const SYSTEM_PROMPT = `Voce e Z, assistente de vendas.

REGRA CRITICA: 
- APENAS mencione leads que estao nos DADOS FORNECIDOS
- NUNCA invente nomes, empresas, emails ou telefones
- Se nao encontrar, diga exatamente: "Nao encontrei lead com esse nome na base."

FORMATO:
- Direto e conciso
- Use **negrito** para destacar info importante
- Nunca use emojis

Quando mostrar um lead, inclua: nome completo, cargo, empresa, telefone/email principal.`

export async function POST(request) {
  try {
    const { message, history } = await request.json()
    
    if (!message) {
      return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })
    }
    
    const leads = loadAllLeads()
    const stats = getStats(leads)
    const msg = message.toLowerCase()
    
    // Stats interno
    if (message === '__stats__') {
      return NextResponse.json({ stats })
    }
    
    // Exportar Excel
    if (msg.includes('exportar') || msg.includes('excel') || msg.includes('download')) {
      let leadsToExport = leads
      const searchMatch = msg.match(/exportar\s+(?:leads?\s+(?:de\s+)?)?(.+?)\s+(?:para|em)\s+excel/i)
      if (searchMatch) {
        leadsToExport = searchLeads(leads, searchMatch[1])
      }
      
      if (leadsToExport.length === 0) {
        return NextResponse.json({ response: 'Nenhum lead encontrado para exportar.' })
      }
      
      const file = await generateExcel(leadsToExport)
      return NextResponse.json({
        response: `Exportacao concluida. **${leadsToExport.length} leads** prontos para download.`,
        file
      })
    }
    
    // Listar todos
    if (msg.includes('listar todos') || msg.includes('todos os leads') || msg.includes('mostrar todos')) {
      return NextResponse.json({
        response: `Base completa: **${leads.length} leads**`,
        leads: leads.slice(0, 10)
      })
    }
    
    // PRIMEIRO: Extrai termo de busca e procura
    const searchTerm = extractSearchTerm(message)
    let foundLeads = []
    
    if (searchTerm) {
      foundLeads = searchByName(leads, searchTerm)
    }
    
    // Se nao achou por nome extraido, tenta busca geral
    if (foundLeads.length === 0) {
      foundLeads = searchLeads(leads, message)
    }
    
    // Sem API key - resposta simples
    if (!process.env.OPENAI_API_KEY) {
      if (foundLeads.length === 0) {
        return NextResponse.json({
          response: `Nao encontrei leads para "${searchTerm || message}". Base tem ${leads.length} leads.`,
          leads: []
        })
      }
      return NextResponse.json({
        response: `Encontrei **${foundLeads.length} lead(s)**:`,
        leads: foundLeads.slice(0, 5)
      })
    }
    
    // Com API key - GPT formata resposta
    // IMPORTANTE: Passa SOMENTE os leads encontrados (evita alucinacao)
    let contexto = ''
    if (foundLeads.length > 0) {
      contexto = `LEADS ENCONTRADOS para "${searchTerm}":\n${JSON.stringify(foundLeads.slice(0, 5), null, 2)}`
    } else {
      contexto = `NENHUM LEAD ENCONTRADO para "${searchTerm || message}". Total na base: ${leads.length}. Informe ao usuario que nao encontrou.`
    }
    
    const gptMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: contexto },
      ...(history || []).slice(-4).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message }
    ]
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: gptMessages,
      temperature: 0.2,
      max_tokens: 800
    })
    
    const response = completion.choices[0]?.message?.content || 'Sem resposta.'
    
    return NextResponse.json({
      response,
      leads: foundLeads.slice(0, 3)
    })
    
  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json({ error: `Erro: ${error.message}` }, { status: 500 })
  }
}