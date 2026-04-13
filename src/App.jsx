import { useState, useRef } from 'react'
import { analisarMercado } from './services/api'
import Relatorio from './components/Relatorio'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginModal } from './components/LoginModal'
import { PricingModal } from './components/PricingModal'
import './App.css'

const NICHOS = [
  { value: '', label: 'Selecione um nicho...' },
  { value: 'barbearia', label: 'Barbearia' },
  { value: 'restaurante', label: 'Restaurante' },
  { value: 'academia', label: 'Academia / Crossfit' },
  { value: 'farmacia', label: 'Farmácia' },
  { value: 'pet', label: 'Pet Shop' },
  { value: 'salao', label: 'Salão de Beleza' },
  { value: 'padaria', label: 'Padaria / Confeitaria' },
  { value: 'dentista', label: 'Clínica Odontológica' },
]

const STATUS_CONFIG = {
  pouco_explorado: { label: 'Mercado com espaço', color: 'var(--green)', colorBg: 'var(--green-bg)', colorText: 'var(--green-text)', bar: '#639922' },
  moderado: { label: 'Mercado moderado', color: 'var(--amber)', colorBg: 'var(--amber-bg)', colorText: 'var(--amber-text)', bar: '#EF9F27' },
  saturado: { label: 'Mercado saturado', color: 'var(--red)', colorBg: 'var(--red-bg)', colorText: 'var(--red-text)', bar: '#E24B4A' },
}

const LOADING_MSGS = [
  'Consultando Google Maps...',
  'Cruzando dados geográficos...',
  'Calculando saturação...',
]

function AppContent() {
  const [tela, setTela] = useState('home')
  const [cnae, setCnae] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [raio, setRaio] = useState('3')
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState(null)
  const [animScore, setAnimScore] = useState(0)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showPricingModal, setShowPricingModal] = useState(false)
  const timerRef = useRef(null)
  
  const { user, loading: authLoading, logout } = useAuth()

  const podeAnalizar = cnae && municipio.trim().length >= 2

  async function handleAnalizar() {
    if (!podeAnalizar || loading) return
    setErro(null)
    setResultado(null)
    setAnimScore(0)
    setLoading(true)

    let i = 0
    setLoadingMsg(LOADING_MSGS[0])
    timerRef.current = setInterval(() => {
      i = (i + 1) % LOADING_MSGS.length
      setLoadingMsg(LOADING_MSGS[i])
    }, 700)

    try {
      const data = await analisarMercado({ cnae, municipio, raio_km: raio })
      setResultado(data)
      setTimeout(() => animarScore(data.score), 100)
    } catch (e) {
      setErro(e.message)
    } finally {
      clearInterval(timerRef.current)
      setLoading(false)
    }
  }

  function animarScore(target) {
    let current = 0
    const step = Math.ceil(target / 30)
    const iv = setInterval(() => {
      current = Math.min(current + step, target)
      setAnimScore(current)
      if (current >= target) clearInterval(iv)
    }, 20)
  }

  async function handleVerRelatorioCompleto() {
    if (!user) {
      setShowLoginModal(true)
      return
    }
    if (user.status !== 'PRO') {
      setShowPricingModal(true)
      return
    }
    setTela('relatorio')
  }

  const cfg = resultado ? STATUS_CONFIG[resultado.status] : null

  if (authLoading) {
    return (
      <div className="app">
        <div className="loading-card">
          <p>Carregando...</p>
        </div>
      </div>
    )
  }

  if (tela === 'relatorio') {
    return (
      <div className="app">
        <header className="header">
          <div className="logo">
            <div className="logo-mark">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="3" fill="white" opacity="0.9"/>
                <circle cx="9" cy="9" r="6" stroke="white" strokeWidth="1.5" opacity="0.45"/>
                <circle cx="9" cy="9" r="8.5" stroke="white" strokeWidth="0.8" opacity="0.2"/>
              </svg>
            </div>
            <span className="logo-name">Saturado</span>
          </div>
          <button className="btn-logout" onClick={() => {
            logout()
            setTela('home')
          }}>Sair</button>
        </header>
        <Relatorio
          cnae={cnae}
          municipio={municipio}
          raio_km={raio}
          onVoltar={() => setTela('home')}
        />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <div className="logo-mark">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="3" fill="white" opacity="0.9"/>
              <circle cx="9" cy="9" r="6" stroke="white" strokeWidth="1.5" opacity="0.45"/>
              <circle cx="9" cy="9" r="8.5" stroke="white" strokeWidth="0.8" opacity="0.2"/>
            </svg>
          </div>
          <span className="logo-name">Saturado</span>
        </div>
        <div className="header-right">
          {user ? (
            <div className="user-info">
              <span className={`user-badge ${user.status === 'PRO' ? 'pro' : 'free'}`}>
                {user.status === 'PRO' ? '⭐ PRO' : '📋 Free'}
              </span>
              <button className="btn-logout-small" onClick={logout}>Sair</button>
            </div>
          ) : (
            <button className="btn-login" onClick={() => setShowLoginModal(true)}>
              Entrar
            </button>
          )}
        </div>
      </header>

      <div className="hero">
        <h1 className="hero-title">Antes de criar,<br />descubra o espaço.</h1>
        <p className="hero-sub">Análise de saturação para microempreendedores brasileiros.</p>
      </div>

      <div className="card">
        <div className="field">
          <label className="field-label">Segmento</label>
          <select className="input" value={cnae} onChange={e => setCnae(e.target.value)}>
            {NICHOS.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
          </select>
        </div>

        <div className="field-row">
          <div className="field" style={{ flex: 1 }}>
            <label className="field-label">Cidade</label>
            <input className="input" type="text" placeholder="Ex: Niterói" value={municipio} onChange={e => setMunicipio(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAnalizar()} />
          </div>
          <div className="field" style={{ flex: '0 0 110px' }}>
            <label className="field-label">Raio</label>
            <select className="input" value={raio} onChange={e => setRaio(e.target.value)}>
              <option value="1">1 km</option><option value="3">3 km</option><option value="5">5 km</option><option value="10">10 km</option>
            </select>
          </div>
        </div>

        <button className={`btn-primary ${!podeAnalizar ? 'disabled' : ''}`} onClick={handleAnalizar} disabled={!podeAnalizar || loading}>
          {loading ? loadingMsg : 'Analisar mercado'}
        </button>
      </div>

      {erro && (<div className="card erro-card"><p className="erro-text">Erro: {erro}</p></div>)}

      {resultado && cfg && (
        <div className="card resultado-card">
          <div className="resultado-header">
            <div><p className="resultado-eyebrow">{resultado.municipio} · {resultado.raio_km}km</p><h2 className="resultado-titulo">{resultado.cnae.charAt(0).toUpperCase() + resultado.cnae.slice(1)}</h2></div>
            <div className="status-pill" style={{ background: cfg.colorBg, color: cfg.colorText }}><span className="status-dot" style={{ background: cfg.color }} />{cfg.label}</div>
          </div>
          <div className="thermo-wrap"><div className="thermo-track"><div className="thermo-fill" style={{ width: `${animScore}%`, background: cfg.bar }} /></div><div className="thermo-labels"><span>Pouco explorado</span><span>Moderado</span><span>Saturado</span></div></div>
          <div className="metrics-grid">
            <div className="metric"><span className="metric-val">{resultado.total_empresas}</span><span className="metric-lbl">Empresas</span></div>
            <div className="metric"><span className="metric-val">{resultado.empresas_ativas}</span><span className="metric-lbl">Ativas</span></div>
            <div className="metric"><span className="metric-val">+{resultado.abertas_ultimo_ano}</span><span className="metric-lbl">Últ. 12m</span></div>
            <div className="metric"><span className="metric-val" style={{ color: cfg.colorText }}>{resultado.score}</span><span className="metric-lbl">Score</span></div>
          </div>
          <div className="insight-box"><p className="insight-text">{resultado.insight}</p></div>
          <button className="btn-premium" onClick={handleVerRelatorioCompleto}>
            Ver relatório completo com Google Maps
            {user?.status !== 'PRO' && <span className="btn-premium-badge">Premium</span>}
          </button>
        </div>
      )}

      <footer className="footer"><span>Saturado · dados reais do Google Maps</span></footer>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} onSuccess={() => { if (user?.status === 'PRO') setTela('relatorio') }} />
      <PricingModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} />
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}