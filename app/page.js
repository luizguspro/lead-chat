'use client'

import { useState, useRef, useEffect } from 'react'

export default function Home() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ total: 0, withEmail: 0, withPhone: 0 })
  const chatRef = useRef(null)

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: '__stats__' })
      })
      const data = await res.json()
      if (data.stats) setStats(data.stats)
    } catch (e) {}
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history: messages })
      })

      const data = await res.json()
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.response || data.error || 'Erro ao processar.',
        leads: data.leads,
        file: data.file
      }])
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Erro de conexao. Verifique se o servidor esta rodando.' 
      }])
    }

    setLoading(false)
  }

  const handleSuggestion = (text) => {
    setInput(text)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const formatContent = (content) => {
    if (!content) return ''
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span>Z</span>
          </div>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">Menu</div>
          <div className="sidebar-item active">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Chat
          </div>
          <div className="sidebar-item" onClick={() => setInput('Listar todos os leads')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Leads
          </div>
          <div className="sidebar-item" onClick={() => setInput('Exportar todos os leads para Excel')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Exportar
          </div>
        </div>

        <div className="sidebar-stats">
          <div className="sidebar-title">Base de Leads</div>
          <div className="stat-row">
            <span className="stat-label">Total</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Com email</span>
            <span className="stat-value">{stats.withEmail}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Com telefone</span>
            <span className="stat-value">{stats.withPhone}</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <header className="main-header">
          <h1 className="main-title">Assistente de Vendas</h1>
          <div className="header-actions">
            <button className="btn btn-ghost" onClick={() => setMessages([])}>
              Limpar
            </button>
          </div>
        </header>

        <div className="chat-container" ref={chatRef}>
          {messages.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <h2 className="empty-title">Como posso ajudar?</h2>
              <p className="empty-subtitle">
                Consulte leads, crie emails de abordagem, exporte dados ou peca analises da sua base.
              </p>
              <div className="suggestions">
                <button className="suggestion" onClick={() => handleSuggestion('Quem sao os leads de Florianopolis?')}>
                  Leads de Florianopolis
                </button>
                <button className="suggestion" onClick={() => handleSuggestion('Criar email de abordagem para Anderson Cunha')}>
                  Criar email de abordagem
                </button>
                <button className="suggestion" onClick={() => handleSuggestion('Exportar leads para Excel')}>
                  Exportar para Excel
                </button>
                <button className="suggestion" onClick={() => handleSuggestion('Qual o telefone do Aidil Soares?')}>
                  Buscar contato
                </button>
              </div>
            </div>
          ) : (
            <div className="chat-messages">
              {messages.map((msg, idx) => (
                <div key={idx} className="message">
                  <div className={`message-avatar ${msg.role}`}>
                    {msg.role === 'user' ? 'U' : 'Z'}
                  </div>
                  <div className="message-body">
                    <div className="message-header">
                      <span className="message-name">
                        {msg.role === 'user' ? 'Voce' : 'Z'}
                      </span>
                    </div>
                    <div 
                      className="message-content"
                      dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                    />
                    {msg.leads && msg.leads.length > 0 && (
                      <div className="leads-list">
                        {msg.leads.map((lead, lidx) => (
                          <LeadCard key={lidx} lead={lead} />
                        ))}
                      </div>
                    )}
                    {msg.file && (
                      <a 
                        href={msg.file.url} 
                        download={msg.file.name}
                        className="download-link"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        {msg.file.name}
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="message">
                  <div className="message-avatar assistant">Z</div>
                  <div className="message-body">
                    <div className="message-header">
                      <span className="message-name">Z</span>
                    </div>
                    <div className="loading-dots">
                      <div className="loading-dot"></div>
                      <div className="loading-dot"></div>
                      <div className="loading-dot"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="input-area">
          <form onSubmit={handleSubmit} className="input-wrapper">
            <div className="input-container">
              <textarea
                className="chat-input"
                placeholder="Pergunte sobre leads, peca emails, exporte dados..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={loading}
              />
            </div>
            <button 
              type="submit" 
              className="send-btn" 
              disabled={!input.trim() || loading}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}

function LeadCard({ lead }) {
  const dados = lead.dados_basicos || lead.meta || {}
  const contato = lead.contato || {}
  const redes = lead.redes_sociais || {}
  const abordagem = lead.abordagem || {}
  const meta = lead.meta || {}

  const nome = dados.nome_completo || dados.nome_social || lead.nome || 'N/A'
  const cargo = dados.cargo || ''
  const empresa = dados.empresa || ''
  const score = meta.score_completude || ''

  return (
    <div className="lead-card">
      <div className="lead-header">
        <div className="lead-info">
          <h3>{nome}</h3>
          {cargo && <div className="role">{cargo}</div>}
          {empresa && <div className="company">{empresa}</div>}
        </div>
        {score && <div className="lead-score">{score}</div>}
      </div>
      <div className="lead-grid">
        {(contato.email_corporativo || contato.email_pessoal) && (
          <div className="lead-field">
            <span className="lead-field-label">Email</span>
            <span className="lead-field-value">{contato.email_corporativo || contato.email_pessoal}</span>
          </div>
        )}
        {(contato.telefone_direto || contato.whatsapp) && (
          <div className="lead-field">
            <span className="lead-field-label">Telefone</span>
            <span className="lead-field-value">{contato.telefone_direto || contato.whatsapp}</span>
          </div>
        )}
        {redes.linkedin && (
          <div className="lead-field">
            <span className="lead-field-label">LinkedIn</span>
            <span className="lead-field-value">
              <a href={redes.linkedin} target="_blank" rel="noopener">Ver perfil</a>
            </span>
          </div>
        )}
        {redes.instagram && (
          <div className="lead-field">
            <span className="lead-field-label">Instagram</span>
            <span className="lead-field-value">{redes.instagram}</span>
          </div>
        )}
        {(contato.cidade || contato.estado) && (
          <div className="lead-field">
            <span className="lead-field-label">Local</span>
            <span className="lead-field-value">
              {[contato.cidade, contato.estado].filter(Boolean).join(' / ')}
            </span>
          </div>
        )}
        {dados.segmento && (
          <div className="lead-field">
            <span className="lead-field-label">Segmento</span>
            <span className="lead-field-value">{dados.segmento}</span>
          </div>
        )}
      </div>
      {abordagem.script_abertura && (
        <div className="lead-actions">
          <button className="btn btn-ghost" onClick={() => navigator.clipboard.writeText(abordagem.script_abertura)}>
            Copiar script
          </button>
        </div>
      )}
    </div>
  )
}
