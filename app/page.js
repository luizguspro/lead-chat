'use client'

import { useState, useRef, useEffect } from 'react'

export default function Home() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ total: 0, withEmail: 0, withPhone: 0, withLinkedIn: 0 })
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedLead, setSelectedLead] = useState(null) // Para o modal de detalhes
  const chatRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    fetchStats()
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
        leads: data.leads || [],
        file: data.file
      }])
      
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

  const sendMessage = async (text) => {
    setInput(text)
    setTimeout(() => {
      const form = document.querySelector('form')
      if (form) form.requestSubmit()
    }, 100)
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
      {/* Modal de Detalhes do Lead */}
      {selectedLead && (
        <LeadDetailModal 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)}
          onAction={sendMessage}
        />
      )}

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
                    {/* Mostrar APENAS os leads retornados pela API, não leads extras */}
                    {msg.leads && msg.leads.length > 0 && (
                      <div className="leads-grid">
                        {msg.leads.map((lead, lidx) => (
                          <LeadCard 
                            key={lidx} 
                            lead={lead} 
                            onAction={sendMessage}
                            onViewDetails={() => setSelectedLead(lead)}
                          />
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

// Componente de Card de Lead Melhorado
function LeadCard({ lead, onAction, onViewDetails }) {
  const dados = lead.dados_basicos || {}
  const contato = lead.contato || {}
  const redes = lead.redes_sociais || {}
  const meta = lead.meta || {}
  const abordagem = lead.abordagem || {}

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

  // Determinar se tem informações ricas
  const hasRichData = abordagem.script_abertura || abordagem.gatilhos?.length > 0 || lead.perfil_psicologico

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
            <a href={`mailto:${contato.email_corporativo || contato.email_pessoal}`} className="field-link">
              {contato.email_corporativo || contato.email_pessoal}
            </a>
          </div>
        )}
        {(contato.telefone_direto || contato.whatsapp) && (
          <div className="lead-field">
            <span className="field-icon">📞</span>
            <a href={`tel:${(contato.telefone_direto || contato.whatsapp).replace(/\D/g, '')}`} className="field-link">
              {contato.telefone_direto || contato.whatsapp}
            </a>
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
            <span className="field-value">{segmento.length > 60 ? segmento.substring(0, 60) + '...' : segmento}</span>
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

      {/* Indicador de dados ricos */}
      {hasRichData && (
        <div className="rich-data-badge">
          ✨ Perfil completo disponível
        </div>
      )}

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
          onClick={onViewDetails}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          Ver Detalhes
        </button>
      </div>
    </div>
  )
}

// Modal de Detalhes Completo do Lead
function LeadDetailModal({ lead, onClose, onAction }) {
  const dados = lead.dados_basicos || {}
  const contato = lead.contato || {}
  const redes = lead.redes_sociais || {}
  const meta = lead.meta || {}
  const abordagem = lead.abordagem || {}
  const perfil = lead.perfil_psicologico || {}
  const padroes = lead.padroes_comportamento || {}
  const rede = lead.rede_influencia || {}
  const registros = lead.registros_publicos || {}
  const historico = lead.historico_profissional || []

  const nome = dados.nome_completo || dados.nome_social || dados.empresa || 'Lead'
  const [activeTab, setActiveTab] = useState('geral')

  const tabs = [
    { id: 'geral', label: '📋 Geral', icon: '📋' },
    { id: 'contato', label: '📞 Contato', icon: '📞' },
    { id: 'perfil', label: '🧠 Perfil', icon: '🧠' },
    { id: 'abordagem', label: '🎯 Abordagem', icon: '🎯' },
    { id: 'empresa', label: '🏢 Empresa', icon: '🏢' },
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-area">
            <div className="modal-avatar">
              {nome.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="modal-title">{nome}</h2>
              {dados.cargo && <p className="modal-subtitle">{dados.cargo}</p>}
              {dados.empresa && <p className="modal-company">{dados.empresa}</p>}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="modal-tabs">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              className={`modal-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="modal-content">
          {activeTab === 'geral' && (
            <div className="tab-content">
              <div className="info-section">
                <h3>Informações Básicas</h3>
                <div className="info-grid">
                  {dados.nome_completo && <InfoItem label="Nome Completo" value={dados.nome_completo} />}
                  {dados.nome_social && <InfoItem label="Nome Social" value={dados.nome_social} />}
                  {dados.cargo && <InfoItem label="Cargo" value={dados.cargo} />}
                  {dados.empresa && <InfoItem label="Empresa" value={dados.empresa} />}
                  {dados.segmento && <InfoItem label="Segmento" value={dados.segmento} />}
                  {dados.tempo_empresa && <InfoItem label="Tempo na Empresa" value={dados.tempo_empresa} />}
                  {meta.score_completude && <InfoItem label="Score de Completude" value={meta.score_completude} highlight />}
                  {meta.confianca_dados && <InfoItem label="Confiança dos Dados" value={meta.confianca_dados} />}
                  {meta.data_pesquisa && <InfoItem label="Data da Pesquisa" value={meta.data_pesquisa} />}
                </div>
              </div>

              {dados.formacao && dados.formacao.length > 0 && (
                <div className="info-section">
                  <h3>Formação</h3>
                  <ul className="info-list">
                    {dados.formacao.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {historico && historico.length > 0 && (
                <div className="info-section">
                  <h3>Histórico Profissional</h3>
                  <div className="timeline">
                    {historico.map((item, idx) => (
                      <div key={idx} className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <strong>{item.cargo}</strong>
                          <span>{item.empresa}</span>
                          {item.periodo && <small>{item.periodo}</small>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'contato' && (
            <div className="tab-content">
              <div className="info-section">
                <h3>Informações de Contato</h3>
                <div className="contact-cards">
                  {contato.email_corporativo && (
                    <a href={`mailto:${contato.email_corporativo}`} className="contact-card">
                      <span className="contact-icon">📧</span>
                      <span className="contact-label">Email Corporativo</span>
                      <span className="contact-value">{contato.email_corporativo}</span>
                    </a>
                  )}
                  {contato.email_pessoal && (
                    <a href={`mailto:${contato.email_pessoal}`} className="contact-card">
                      <span className="contact-icon">📧</span>
                      <span className="contact-label">Email Pessoal</span>
                      <span className="contact-value">{contato.email_pessoal}</span>
                    </a>
                  )}
                  {contato.telefone_direto && (
                    <a href={`tel:${contato.telefone_direto.replace(/\D/g, '')}`} className="contact-card">
                      <span className="contact-icon">📞</span>
                      <span className="contact-label">Telefone Direto</span>
                      <span className="contact-value">{contato.telefone_direto}</span>
                    </a>
                  )}
                  {contato.whatsapp && (
                    <a href={`https://wa.me/${contato.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="contact-card whatsapp">
                      <span className="contact-icon">💬</span>
                      <span className="contact-label">WhatsApp</span>
                      <span className="contact-value">{contato.whatsapp}</span>
                    </a>
                  )}
                </div>
              </div>

              {(contato.cidade || contato.endereco) && (
                <div className="info-section">
                  <h3>Localização</h3>
                  <div className="info-grid">
                    {contato.endereco && <InfoItem label="Endereço" value={contato.endereco} />}
                    {contato.cidade && <InfoItem label="Cidade" value={contato.cidade} />}
                    {contato.estado && <InfoItem label="Estado" value={contato.estado} />}
                    {contato.cep && <InfoItem label="CEP" value={contato.cep} />}
                  </div>
                </div>
              )}

              {(redes.linkedin || redes.instagram || redes.site_empresa) && (
                <div className="info-section">
                  <h3>Redes Sociais</h3>
                  <div className="social-links">
                    {redes.linkedin && (
                      <a href={redes.linkedin} target="_blank" rel="noopener noreferrer" className="social-link linkedin">
                        💼 LinkedIn
                      </a>
                    )}
                    {redes.instagram && (
                      <a href={redes.instagram} target="_blank" rel="noopener noreferrer" className="social-link instagram">
                        📷 Instagram
                      </a>
                    )}
                    {redes.site_empresa && (
                      <a href={redes.site_empresa.startsWith('http') ? redes.site_empresa : `https://${redes.site_empresa}`} target="_blank" rel="noopener noreferrer" className="social-link website">
                        🌐 Website
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'perfil' && (
            <div className="tab-content">
              {perfil.resumo && (
                <div className="info-section">
                  <h3>Resumo do Perfil</h3>
                  <p className="profile-summary">{perfil.resumo}</p>
                </div>
              )}

              {perfil.personalidade && (
                <div className="info-section">
                  <h3>Personalidade</h3>
                  <p>{perfil.personalidade}</p>
                </div>
              )}

              {perfil.motivacoes && perfil.motivacoes.length > 0 && (
                <div className="info-section">
                  <h3>🎯 Motivações</h3>
                  <div className="tags-container">
                    {perfil.motivacoes.map((item, idx) => (
                      <span key={idx} className="tag motivation">{item}</span>
                    ))}
                  </div>
                </div>
              )}

              {perfil.ego_triggers && perfil.ego_triggers.length > 0 && (
                <div className="info-section">
                  <h3>⚡ Gatilhos de Ego</h3>
                  <ul className="info-list highlight">
                    {perfil.ego_triggers.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {perfil.como_decide && (
                <div className="info-section">
                  <h3>🧠 Como Toma Decisões</h3>
                  <p>{perfil.como_decide}</p>
                </div>
              )}

              {padroes.estilo_comunicacao && (
                <div className="info-section">
                  <h3>💬 Estilo de Comunicação</h3>
                  <p>{padroes.estilo_comunicacao}</p>
                </div>
              )}

              {padroes.temas_recorrentes && padroes.temas_recorrentes.length > 0 && (
                <div className="info-section">
                  <h3>📌 Temas Recorrentes</h3>
                  <div className="tags-container">
                    {padroes.temas_recorrentes.map((item, idx) => (
                      <span key={idx} className="tag">{item}</span>
                    ))}
                  </div>
                </div>
              )}

              {padroes.citacoes_marcantes && padroes.citacoes_marcantes.length > 0 && (
                <div className="info-section">
                  <h3>💬 Citações Marcantes</h3>
                  {padroes.citacoes_marcantes.map((item, idx) => (
                    <blockquote key={idx} className="quote">{item}</blockquote>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'abordagem' && (
            <div className="tab-content">
              {abordagem.canal_preferido && (
                <div className="info-section">
                  <h3>📱 Canal Preferido</h3>
                  <div className="highlight-box">
                    {abordagem.canal_preferido}
                    {abordagem.melhor_horario && <span className="sub-info">• {abordagem.melhor_horario}</span>}
                  </div>
                </div>
              )}

              {abordagem.script_abertura && (
                <div className="info-section">
                  <h3>📝 Script de Abertura Sugerido</h3>
                  <div className="script-box">
                    {abordagem.script_abertura}
                  </div>
                  <button 
                    className="copy-btn"
                    onClick={() => navigator.clipboard.writeText(abordagem.script_abertura)}
                  >
                    📋 Copiar Script
                  </button>
                </div>
              )}

              {abordagem.gatilhos && abordagem.gatilhos.length > 0 && (
                <div className="info-section">
                  <h3>✅ Gatilhos para Usar</h3>
                  <ul className="info-list success">
                    {abordagem.gatilhos.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {abordagem.o_que_evitar && abordagem.o_que_evitar.length > 0 && (
                <div className="info-section">
                  <h3>❌ O Que Evitar</h3>
                  <ul className="info-list danger">
                    {abordagem.o_que_evitar.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {abordagem.objecoes_provaveis && abordagem.objecoes_provaveis.length > 0 && (
                <div className="info-section">
                  <h3>⚠️ Objeções Prováveis</h3>
                  <ul className="info-list warning">
                    {abordagem.objecoes_provaveis.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {rede.quem_pode_apresentar && rede.quem_pode_apresentar.length > 0 && (
                <div className="info-section">
                  <h3>🤝 Quem Pode Apresentar</h3>
                  <ul className="info-list">
                    {rede.quem_pode_apresentar.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {rede.comunidades && rede.comunidades.length > 0 && (
                <div className="info-section">
                  <h3>👥 Comunidades</h3>
                  <div className="tags-container">
                    {rede.comunidades.map((item, idx) => (
                      <span key={idx} className="tag community">{item}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'empresa' && (
            <div className="tab-content">
              {registros.cnpj && (
                <div className="info-section">
                  <h3>Dados da Empresa</h3>
                  <div className="info-grid">
                    {registros.cnpj && <InfoItem label="CNPJ" value={registros.cnpj} />}
                    {registros.razao_social && <InfoItem label="Razão Social" value={registros.razao_social} />}
                    {registros.situacao && <InfoItem label="Situação" value={registros.situacao} highlight={registros.situacao === 'ATIVA'} />}
                    {registros.data_abertura && <InfoItem label="Data de Abertura" value={registros.data_abertura} />}
                  </div>
                </div>
              )}

              {registros.socios && registros.socios.length > 0 && (
                <div className="info-section">
                  <h3>Sócios</h3>
                  <ul className="info-list">
                    {registros.socios.map((socio, idx) => (
                      <li key={idx}>
                        <strong>{socio.nome}</strong>
                        {socio.qualificacao && <span> - {socio.qualificacao}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {lead.fontes && lead.fontes.length > 0 && (
                <div className="info-section">
                  <h3>📚 Fontes de Dados</h3>
                  <div className="sources-list">
                    {lead.fontes.map((fonte, idx) => (
                      <span key={idx} className="source-tag">{fonte}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="modal-action-btn primary"
            onClick={() => {
              onAction(`Criar email de abordagem para ${nome}`)
              onClose()
            }}
          >
            ✉️ Criar Email de Abordagem
          </button>
          <button 
            className="modal-action-btn"
            onClick={() => {
              if (contato.whatsapp) {
                window.open(`https://wa.me/${contato.whatsapp.replace(/\D/g, '')}`, '_blank')
              } else if (contato.telefone_direto) {
                window.open(`tel:${contato.telefone_direto.replace(/\D/g, '')}`, '_blank')
              }
            }}
            disabled={!contato.whatsapp && !contato.telefone_direto}
          >
            📞 Ligar / WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}

// Componente auxiliar para itens de informação
function InfoItem({ label, value, highlight }) {
  return (
    <div className={`info-item ${highlight ? 'highlight' : ''}`}>
      <span className="info-label">{label}</span>
      <span className="info-value">{value}</span>
    </div>
  )
}
