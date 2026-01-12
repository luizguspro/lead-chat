'use client'

import { useState, useRef, useEffect } from 'react'

// Ícones SVG minimalistas
const Icons = {
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  chart: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  download: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  building: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>,
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  mail: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  phone: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  mapPin: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  linkedin: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>,
  globe: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  trash: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  menu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  send: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  user: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  x: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  info: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  copy: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  messageSquare: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  target: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  brain: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.54"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.54"/></svg>,
  sparkles: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>,
}

export default function Home() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [selectedLead, setSelectedLead] = useState(null)
  const chatRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: `Olá! Sou o **Z**, seu assistente de vendas.\n\nPosso ajudar você a buscar leads, criar emails de abordagem e exportar dados. O que deseja fazer?`
    }])
  }, [])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

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
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Erro de conexão. Verifique se o servidor está rodando.' 
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
      content: `Chat limpo.\n\nComo posso ajudar?`
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
    { icon: Icons.users, label: 'Listar Leads', action: 'Listar todos os leads' },
    { icon: Icons.chart, label: 'Estatísticas', action: 'Mostrar estatísticas da base' },
    { icon: Icons.download, label: 'Exportar Excel', action: 'Exportar todos os leads para Excel' },
    { icon: Icons.building, label: 'Por Cidade', action: 'Leads de Florianópolis' },
  ]

  return (
    <div className="app">
      {selectedLead && (
        <LeadDetailModal 
          lead={selectedLead} 
          onClose={() => setSelectedLead(null)}
          onAction={sendMessage}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">Z</div>
            <span className="logo-text">Lead Intelligence</span>
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {Icons.menu}
          </button>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-title">Ações</div>
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
          <div className="sidebar-title">Busca</div>
          <div className="sidebar-item" onClick={() => handleSuggestion('Quem é ')}>
            <span className="item-icon">{Icons.search}</span>
            <span className="item-label">Buscar por Nome</span>
          </div>
          <div className="sidebar-item" onClick={() => handleSuggestion('Criar email para ')}>
            <span className="item-icon">{Icons.mail}</span>
            <span className="item-label">Criar Email</span>
          </div>
          <div className="sidebar-item" onClick={() => handleSuggestion('Qual o telefone do ')}>
            <span className="item-icon">{Icons.phone}</span>
            <span className="item-label">Buscar Contato</span>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="powered-by">
            Powered by OpenAI
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="main-header">
          <div className="header-left">
            <button className="mobile-menu" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {Icons.menu}
            </button>
            <h1 className="main-title">Assistente de Vendas</h1>
          </div>
          <div className="header-actions">
            <button className="btn btn-ghost" onClick={clearChat}>
              {Icons.trash}
              <span>Limpar</span>
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
                  Assistente inteligente para gestão de leads. Faça perguntas em linguagem natural sobre sua base de dados.
                </p>
                
                <div className="suggestions-grid">
                  <button className="suggestion-card" onClick={() => handleSuggestion('Quem são os leads de Florianópolis?')}>
                    <span className="suggestion-icon">{Icons.building}</span>
                    <span className="suggestion-text">Leads de Florianópolis</span>
                  </button>
                  <button className="suggestion-card" onClick={() => handleSuggestion('Criar email de abordagem para Adilson Tassi')}>
                    <span className="suggestion-icon">{Icons.mail}</span>
                    <span className="suggestion-text">Criar email de abordagem</span>
                  </button>
                  <button className="suggestion-card" onClick={() => handleSuggestion('Exportar leads para Excel')}>
                    <span className="suggestion-icon">{Icons.download}</span>
                    <span className="suggestion-text">Exportar para Excel</span>
                  </button>
                  <button className="suggestion-card" onClick={() => handleSuggestion('Mostrar estatísticas da base')}>
                    <span className="suggestion-icon">{Icons.chart}</span>
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
                    {msg.role === 'user' ? Icons.user : 'Z'}
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
                        {Icons.download}
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
                {Icons.send}
              </button>
            </div>
          </form>
          <div className="input-footer">
            <span>Enter para enviar · Shift+Enter para nova linha</span>
          </div>
        </div>
      </main>
    </div>
  )
}

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
            <span className="field-icon">{Icons.mail}</span>
            <a href={`mailto:${contato.email_corporativo || contato.email_pessoal}`} className="field-link">
              {contato.email_corporativo || contato.email_pessoal}
            </a>
          </div>
        )}
        {(contato.telefone_direto || contato.whatsapp) && (
          <div className="lead-field">
            <span className="field-icon">{Icons.phone}</span>
            <a href={`tel:${(contato.telefone_direto || contato.whatsapp).replace(/\D/g, '')}`} className="field-link">
              {contato.telefone_direto || contato.whatsapp}
            </a>
          </div>
        )}
        {(cidade || estado) && (
          <div className="lead-field">
            <span className="field-icon">{Icons.mapPin}</span>
            <span className="field-value">{[cidade, estado].filter(Boolean).join(' / ')}</span>
          </div>
        )}
        {segmento && (
          <div className="lead-field">
            <span className="field-icon">{Icons.building}</span>
            <span className="field-value">{segmento.length > 50 ? segmento.substring(0, 50) + '...' : segmento}</span>
          </div>
        )}
        {redes.linkedin && (
          <div className="lead-field">
            <span className="field-icon">{Icons.linkedin}</span>
            <a href={redes.linkedin} target="_blank" rel="noopener noreferrer" className="field-link">
              LinkedIn
            </a>
          </div>
        )}
      </div>

      {hasRichData && (
        <div className="rich-data-badge">
          {Icons.sparkles} Perfil completo disponível
        </div>
      )}

      <div className="lead-actions">
        <button 
          className="action-btn primary"
          onClick={() => onAction(`Criar email de abordagem para ${nome}`)}
        >
          {Icons.mail}
          Criar Email
        </button>
        <button 
          className="action-btn"
          onClick={onViewDetails}
        >
          {Icons.info}
          Ver Detalhes
        </button>
      </div>
    </div>
  )
}

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
    { id: 'geral', label: 'Geral' },
    { id: 'contato', label: 'Contato' },
    { id: 'perfil', label: 'Perfil' },
    { id: 'abordagem', label: 'Abordagem' },
    { id: 'empresa', label: 'Empresa' },
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
            {Icons.x}
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
                  {meta.score_completude && <InfoItem label="Score" value={meta.score_completude} highlight />}
                  {meta.confianca_dados && <InfoItem label="Confiança" value={meta.confianca_dados} />}
                  {meta.data_pesquisa && <InfoItem label="Data Pesquisa" value={meta.data_pesquisa} />}
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
                      <span className="contact-icon">{Icons.mail}</span>
                      <span className="contact-label">Email Corporativo</span>
                      <span className="contact-value">{contato.email_corporativo}</span>
                    </a>
                  )}
                  {contato.email_pessoal && (
                    <a href={`mailto:${contato.email_pessoal}`} className="contact-card">
                      <span className="contact-icon">{Icons.mail}</span>
                      <span className="contact-label">Email Pessoal</span>
                      <span className="contact-value">{contato.email_pessoal}</span>
                    </a>
                  )}
                  {contato.telefone_direto && (
                    <a href={`tel:${contato.telefone_direto.replace(/\D/g, '')}`} className="contact-card">
                      <span className="contact-icon">{Icons.phone}</span>
                      <span className="contact-label">Telefone</span>
                      <span className="contact-value">{contato.telefone_direto}</span>
                    </a>
                  )}
                  {contato.whatsapp && (
                    <a href={`https://wa.me/${contato.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="contact-card">
                      <span className="contact-icon">{Icons.messageSquare}</span>
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
                      <a href={redes.linkedin} target="_blank" rel="noopener noreferrer" className="social-link">
                        {Icons.linkedin} LinkedIn
                      </a>
                    )}
                    {redes.instagram && (
                      <a href={redes.instagram} target="_blank" rel="noopener noreferrer" className="social-link">
                        Instagram
                      </a>
                    )}
                    {redes.site_empresa && (
                      <a href={redes.site_empresa.startsWith('http') ? redes.site_empresa : `https://${redes.site_empresa}`} target="_blank" rel="noopener noreferrer" className="social-link">
                        {Icons.globe} Website
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
                  <p className="profile-summary">{perfil.personalidade}</p>
                </div>
              )}

              {perfil.motivacoes && perfil.motivacoes.length > 0 && (
                <div className="info-section">
                  <h3>Motivações</h3>
                  <div className="tags-container">
                    {perfil.motivacoes.map((item, idx) => (
                      <span key={idx} className="tag motivation">{item}</span>
                    ))}
                  </div>
                </div>
              )}

              {perfil.ego_triggers && perfil.ego_triggers.length > 0 && (
                <div className="info-section">
                  <h3>Gatilhos de Ego</h3>
                  <ul className="info-list highlight">
                    {perfil.ego_triggers.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {perfil.como_decide && (
                <div className="info-section">
                  <h3>Como Toma Decisões</h3>
                  <p className="profile-summary">{perfil.como_decide}</p>
                </div>
              )}

              {padroes.estilo_comunicacao && (
                <div className="info-section">
                  <h3>Estilo de Comunicação</h3>
                  <p className="profile-summary">{padroes.estilo_comunicacao}</p>
                </div>
              )}

              {padroes.temas_recorrentes && padroes.temas_recorrentes.length > 0 && (
                <div className="info-section">
                  <h3>Temas Recorrentes</h3>
                  <div className="tags-container">
                    {padroes.temas_recorrentes.map((item, idx) => (
                      <span key={idx} className="tag">{item}</span>
                    ))}
                  </div>
                </div>
              )}

              {padroes.citacoes_marcantes && padroes.citacoes_marcantes.length > 0 && (
                <div className="info-section">
                  <h3>Citações Marcantes</h3>
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
                  <h3>Canal Preferido</h3>
                  <div className="highlight-box">
                    {abordagem.canal_preferido}
                    {abordagem.melhor_horario && <span className="sub-info">· {abordagem.melhor_horario}</span>}
                  </div>
                </div>
              )}

              {abordagem.script_abertura && (
                <div className="info-section">
                  <h3>Script de Abertura</h3>
                  <div className="script-box">
                    {abordagem.script_abertura}
                  </div>
                  <button 
                    className="copy-btn"
                    onClick={() => navigator.clipboard.writeText(abordagem.script_abertura)}
                  >
                    {Icons.copy} Copiar Script
                  </button>
                </div>
              )}

              {abordagem.gatilhos && abordagem.gatilhos.length > 0 && (
                <div className="info-section">
                  <h3>Gatilhos para Usar</h3>
                  <ul className="info-list success">
                    {abordagem.gatilhos.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {abordagem.o_que_evitar && abordagem.o_que_evitar.length > 0 && (
                <div className="info-section">
                  <h3>O Que Evitar</h3>
                  <ul className="info-list danger">
                    {abordagem.o_que_evitar.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {abordagem.objecoes_provaveis && abordagem.objecoes_provaveis.length > 0 && (
                <div className="info-section">
                  <h3>Objeções Prováveis</h3>
                  <ul className="info-list warning">
                    {abordagem.objecoes_provaveis.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {rede.quem_pode_apresentar && rede.quem_pode_apresentar.length > 0 && (
                <div className="info-section">
                  <h3>Quem Pode Apresentar</h3>
                  <ul className="info-list">
                    {rede.quem_pode_apresentar.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {rede.comunidades && rede.comunidades.length > 0 && (
                <div className="info-section">
                  <h3>Comunidades</h3>
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
                    {registros.data_abertura && <InfoItem label="Data Abertura" value={registros.data_abertura} />}
                  </div>
                </div>
              )}

              {registros.socios && registros.socios.length > 0 && (
                <div className="info-section">
                  <h3>Sócios</h3>
                  <ul className="info-list">
                    {registros.socios.map((socio, idx) => (
                      <li key={idx}>
                        <strong>{typeof socio === 'string' ? socio : socio.nome}</strong>
                        {socio.qualificacao && <span> - {socio.qualificacao}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {lead.fontes && lead.fontes.length > 0 && (
                <div className="info-section">
                  <h3>Fontes de Dados</h3>
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
            Criar Email de Abordagem
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
            Ligar / WhatsApp
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoItem({ label, value, highlight }) {
  return (
    <div className={`info-item ${highlight ? 'highlight' : ''}`}>
      <span className="info-label">{label}</span>
      <span className="info-value">{value}</span>
    </div>
  )
}
