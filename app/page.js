'use client'

import { useState, useRef, useEffect } from 'react'

export default function Home() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ total: 0, withEmail: 0, withPhone: 0, withLinkedIn: 0 })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const chatRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    fetchStats()
    // Mensagem de boas-vindas
    setMessages([{
      role: 'assistant',
      content: `Olá! 👋 Sou o **Z**, seu assistente de vendas inteligente.\n\nEstou pronto para ajudar você a gerenciar seus leads. O que deseja fazer?`
    }])
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
    } catch (e) {
      console.error('Erro ao buscar stats:', e)
    }
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
      
      // Atualiza stats após cada interação
      fetchStats()
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: '❌ Erro de conexão. Verifique se o servidor está rodando.' 
      }])
    }

    setLoading(false)
    inputRef.current?.focus()
  }

  const handleSuggestion = (text) => {
    setInput(text)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: `Chat limpo! 🧹\n\nComo posso ajudar?`
    }])
  }

  const formatContent = (content) => {
    if (!content) return ''
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\|(.*)\|/g, (match) => {
        // Detecta tabelas markdown simples
        return match
      })
      .replace(/\n/g, '<br/>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
  }

  const quickActions = [
    { icon: '👥', label: 'Listar Leads', action: 'Listar todos os leads' },
    { icon: '📊', label: 'Estatísticas', action: 'Mostrar estatísticas da base' },
    { icon: '📥', label: 'Exportar Excel', action: 'Exportar todos os leads para Excel' },
    { icon: '🏙️', label: 'Por Cidade', action: 'Leads de Florianópolis' },
  ]

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">Z</div>
            <span className="logo-text">Lead Intelligence</span>
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </button>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">Ações Rápidas</div>
          {quickActions.map((action, idx) => (
            <div 
              key={idx} 
              className="sidebar-item"
              onClick={() => handleSuggestion(action.action)}
            >
              <span className="item-icon">{action.icon}</span>
              <span className="item-label">{action.label}</span>
            </div>
          ))}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">Busca Rápida</div>
          <div className="sidebar-item" onClick={() => handleSuggestion('Quem é ')}>
            <span className="item-icon">🔍</span>
            <span className="item-label">Buscar por Nome</span>
          </div>
          <div className="sidebar-item" onClick={() => handleSuggestion('Criar email para ')}>
            <span className="item-icon">✉️</span>
            <span className="item-label">Criar Email</span>
          </div>
          <div className="sidebar-item" onClick={() => handleSuggestion('Qual o telefone do ')}>
            <span className="item-icon">📞</span>
            <span className="item-label">Buscar Contato</span>
          </div>
        </div>

        <div className="sidebar-stats">
          <div className="sidebar-title">📈 Base de Leads</div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Total</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.withEmail}</div>
              <div className="stat-label">Com Email</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.withPhone}</div>
              <div className="stat-label">Com Telefone</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.withLinkedIn || 0}</div>
              <div className="stat-label">LinkedIn</div>
            </div>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="powered-by">
            Powered by <strong>OpenAI</strong>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <header className="main-header">
          <div className="header-left">
            <button className="mobile-menu" onClick={() => setSidebarOpen(!sidebarOpen)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18"/>
              </svg>
            </button>
            <h1 className="main-title">
              <span className="title-icon">💬</span>
              Assistente de Vendas
            </h1>
          </div>
          <div className="header-actions">
            <button className="btn btn-ghost" onClick={clearChat}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
              Limpar Chat
            </button>
          </div>
        </header>

        <div className="chat-container" ref={chatRef}>
          {messages.length <= 1 ? (
            <div className="welcome-state">
              <div className="welcome-content">
                <div className="welcome-icon">
                  <span>Z</span>
                </div>
                <h2 className="welcome-title">Bem-vindo ao Z</h2>
                <p className="welcome-subtitle">
                  Seu assistente inteligente para gestão de leads. Faça perguntas em linguagem natural sobre sua base de dados.
                </p>
                
                <div className="suggestions-grid">
                  <button className="suggestion-card" onClick={() => handleSuggestion('Quem são os leads de Florianópolis?')}>
                    <span className="suggestion-icon">🏙️</span>
                    <span className="suggestion-text">Leads de Florianópolis</span>
                  </button>
                  <button className="suggestion-card" onClick={() => handleSuggestion('Criar email de abordagem para Adilson Tassi')}>
                    <span className="suggestion-icon">✉️</span>
                    <span className="suggestion-text">Criar email de abordagem</span>
                  </button>
                  <button className="suggestion-card" onClick={() => handleSuggestion('Exportar leads para Excel')}>
                    <span className="suggestion-icon">📥</span>
                    <span className="suggestion-text">Exportar para Excel</span>
                  </button>
                  <button className="suggestion-card" onClick={() => handleSuggestion('Mostrar estatísticas da base')}>
                    <span className="suggestion-icon">📊</span>
                    <span className="suggestion-text">Ver estatísticas</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="chat-messages">
              {messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role}`}>
                  <div className={`message-avatar ${msg.role}`}>
                    {msg.role === 'user' ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    ) : 'Z'}
                  </div>
                  <div className="message-body">
                    <div className="message-header">
                      <span className="message-name">
                        {msg.role === 'user' ? 'Você' : 'Z'}
                      </span>
                      <span className="message-time">
                        {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div 
                      className="message-content"
                      dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                    />
                    {msg.leads && msg.leads.length > 0 && (
                      <div className="leads-grid">
                        {msg.leads.map((lead, lidx) => (
                          <LeadCard key={lidx} lead={lead} onAction={handleSuggestion} />
                        ))}
                      </div>
                    )}
                    {msg.file && (
                      <a 
                        href={msg.file.url} 
                        download={msg.file.name}
                        className="download-btn"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        <span>Baixar {msg.file.name}</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="message assistant">
                  <div className="message-avatar assistant">Z</div>
                  <div className="message-body">
                    <div className="message-header">
                      <span className="message-name">Z</span>
                    </div>
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
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
                ref={inputRef}
                className="chat-input"
                placeholder="Pergunte sobre leads, peça emails, exporte dados..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={loading}
              />
              <button 
                type="submit" 
                className="send-btn" 
                disabled={!input.trim() || loading}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </button>
            </div>
          </form>
          <div className="input-footer">
            <span>Pressione Enter para enviar • Shift+Enter para nova linha</span>
          </div>
        </div>
      </main>
    </div>
  )
}

function LeadCard({ lead, onAction }) {
  const dados = lead.dados_basicos || lead.meta || {}
  const contato = lead.contato || {}
  const redes = lead.redes_sociais || {}
  const meta = lead.meta || {}

  const nome = dados.nome_completo || dados.nome_social || dados.empresa || 'Lead sem nome'
  const cargo = dados.cargo || ''
  const empresa = dados.empresa || ''
  const segmento = dados.segmento || ''
  const score = meta.score_completude || ''
  const cidade = contato.cidade || ''
  const estado = contato.estado || ''

  const getScoreColor = (score) => {
    const num = parseInt(score)
    if (num >= 70) return 'high'
    if (num >= 40) return 'medium'
    return 'low'
  }

  return (
    <div className="lead-card">
      <div className="lead-header">
        <div className="lead-avatar">
          {nome.charAt(0).toUpperCase()}
        </div>
        <div className="lead-info">
          <h3 className="lead-name">{nome}</h3>
          {cargo && <div className="lead-role">{cargo}</div>}
          {empresa && nome !== empresa && <div className="lead-company">{empresa}</div>}
        </div>
        {score && (
          <div className={`lead-score ${getScoreColor(score)}`}>
            {score}
          </div>
        )}
      </div>
      
      <div className="lead-details">
        {(contato.email_corporativo || contato.email_pessoal) && (
          <div className="lead-field">
            <span className="field-icon">📧</span>
            <span className="field-value">{contato.email_corporativo || contato.email_pessoal}</span>
          </div>
        )}
        {(contato.telefone_direto || contato.whatsapp) && (
          <div className="lead-field">
            <span className="field-icon">📞</span>
            <span className="field-value">{contato.telefone_direto || contato.whatsapp}</span>
          </div>
        )}
        {(cidade || estado) && (
          <div className="lead-field">
            <span className="field-icon">📍</span>
            <span className="field-value">{[cidade, estado].filter(Boolean).join(' / ')}</span>
          </div>
        )}
        {segmento && (
          <div className="lead-field">
            <span className="field-icon">🏢</span>
            <span className="field-value">{segmento}</span>
          </div>
        )}
        {redes.linkedin && (
          <div className="lead-field">
            <span className="field-icon">💼</span>
            <a href={redes.linkedin} target="_blank" rel="noopener noreferrer" className="field-link">
              Ver LinkedIn
            </a>
          </div>
        )}
      </div>

      <div className="lead-actions">
        <button 
          className="action-btn primary"
          onClick={() => onAction(`Criar email de abordagem para ${nome}`)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          Criar Email
        </button>
        <button 
          className="action-btn"
          onClick={() => onAction(`Detalhes completos de ${nome}`)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          Ver Mais
        </button>
      </div>
    </div>
  )
}
