// src/components/Relatorio.jsx
import { useState, useEffect } from 'react'
import api from '../services/api'
import './Relatorio.css'

const STATUS_CONFIG = {
  pouco_explorado: { color: 'var(--green)', bg: 'var(--green-bg)', text: 'var(--green-text)', bar: '#639922', label: 'Mercado com espaço' },
  moderado:        { color: 'var(--amber)', bg: 'var(--amber-bg)', text: 'var(--amber-text)', bar: '#EF9F27', label: 'Mercado moderado' },
  saturado:        { color: 'var(--red)',   bg: 'var(--red-bg)',   text: 'var(--red-text)',   bar: '#E24B4A', label: 'Mercado saturado' },
}

const LOADING_STEPS = [
  { msg: 'Geocodificando localização...', pct: 15 },
  { msg: 'Buscando estabelecimentos no Google Maps...', pct: 40 },
  { msg: 'Calculando score de saturação...', pct: 60 },
  { msg: 'Preparando listagem...', pct: 80 },
  { msg: 'Finalizando relatório...', pct: 95 },
]

export default function Relatorio({ cnae, municipio, raio_km, onVoltar }) {
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState(null)
  const [step, setStep] = useState(0)
  const [pct, setPct] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let stepIdx = 0
    let isMounted = true
    
    setPct(LOADING_STEPS[0].pct)

    const interval = setInterval(() => {
      if (stepIdx < LOADING_STEPS.length - 1) {
        stepIdx++
        if (isMounted) {
          setStep(stepIdx)
          setPct(LOADING_STEPS[stepIdx].pct)
        }
      }
    }, 2500)

    const fetchRelatorio = async () => {
      try {
        const response = await api.get('/relatorio', {
          params: { cnae, municipio, raio_km }
        })
        
        if (isMounted) {
          clearInterval(interval)
          setPct(100)
          setTimeout(() => {
            setDados(response.data)
            setLoading(false)
          }, 400)
        }
      } catch (err) {
        console.error('Erro ao buscar relatório:', err)
        if (isMounted) {
          clearInterval(interval)
          const mensagem = err.response?.data?.detail || err.message || 'Erro desconhecido'
          setErro(mensagem)
          setLoading(false)
        }
      }
    }

    fetchRelatorio()

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [cnae, municipio, raio_km])

  // Tela de loading
  if (loading && !dados && !erro) {
    return (
      <div className="rel-wrap">
        <div className="rel-header">
          <button className="btn-voltar" onClick={onVoltar}>← Voltar</button>
        </div>
        <div className="loading-card card">
          <p className="loading-label">Buscando concorrentes no Google Maps</p>
          <p className="loading-msg">{LOADING_STEPS[step].msg}</p>
          <div className="loading-track">
            <div className="loading-fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="loading-pct">{pct}%</p>
        </div>
      </div>
    )
  }

  // Tela de erro
  if (erro) {
    return (
      <div className="rel-wrap">
        <div className="rel-header">
          <button className="btn-voltar" onClick={onVoltar}>← Voltar</button>
        </div>
        <div className="card erro-card">
          <p className="erro-text">Erro ao gerar relatório</p>
          <p className="erro-hint">{erro}</p>
          {erro === 'Acesso premium necessário. Assine o plano para continuar.' && (
            <button 
              className="btn-premium" 
              onClick={() => window.location.href = '/'}
              style={{ marginTop: '1rem' }}
            >
              Voltar para página inicial
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!dados) return null

  const cfg = STATUS_CONFIG[dados.status] || STATUS_CONFIG.moderado
  const nomeExibido = dados.cnae.charAt(0).toUpperCase() + dados.cnae.slice(1)
  const taxaInativa = Math.round((dados.total_empresas - dados.empresas_ativas) / Math.max(dados.total_empresas, 1) * 100)

  return (
    <div className="rel-wrap">

      {/* Header */}
      <div className="rel-header">
        <button className="btn-voltar" onClick={onVoltar}>← Voltar</button>
        {!dados.dados_reais && <span className="badge-estimado">dados estimados</span>}
        {dados.dados_reais && <span className="badge-real">Google Maps</span>}
      </div>

      {/* Título e status */}
      <div className="card">
        <p className="eyebrow">{dados.municipio} · {dados.raio_km}km · Relatório completo</p>
        <h1 className="rel-titulo">{nomeExibido}</h1>
        <div className="status-pill" style={{ background: cfg.bg, color: cfg.text }}>
          <span className="status-dot" style={{ background: cfg.color }} />
          {cfg.label}
        </div>
      </div>

      {/* Score + métricas */}
      <div className="card">
        <p className="section-label">Índice de saturação</p>
        <div className="score-big">
          <span className="score-num" style={{ color: cfg.color }}>{dados.score}</span>
          <span className="score-de">/100</span>
        </div>
        <div className="thermo-track">
          <div className="thermo-fill" style={{ width: `${dados.score}%`, background: cfg.bar }} />
        </div>
        <div className="thermo-labels">
          <span>Pouco explorado</span>
          <span>Moderado</span>
          <span>Saturado</span>
        </div>
        <div className="metrics-grid4">
          <div className="metric">
            <span className="metric-val">{dados.total_empresas}</span>
            <span className="metric-lbl">Encontrados</span>
          </div>
          <div className="metric">
            <span className="metric-val">{dados.empresas_ativas}</span>
            <span className="metric-lbl">Abertos</span>
          </div>
          <div className="metric">
            <span className="metric-val">{taxaInativa}%</span>
            <span className="metric-lbl">Fechados</span>
          </div>
          <div className="metric">
            <span className="metric-val" style={{ color: cfg.color }}>{dados.score}</span>
            <span className="metric-lbl">Score</span>
          </div>
        </div>
      </div>

      {/* Concentração por bairro (se existir) */}
      {dados.por_bairro && Object.keys(dados.por_bairro).length > 0 && (
        <div className="card">
          <p className="section-label">Concentração por bairro</p>
          {Object.entries(dados.por_bairro).map(([bairro, qtd]) => {
            const maxVal = Math.max(...Object.values(dados.por_bairro))
            const barPct = Math.round(qtd / maxVal * 100)
            return (
              <div key={bairro} className="bairro-row">
                <span className="bairro-nome">{bairro}</span>
                <div className="bairro-bar-wrap">
                  <div className="bairro-bar" style={{ width: `${barPct}%`, background: cfg.bar }} />
                </div>
                <span className="bairro-num">{qtd}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Rating médio (Google Places) */}
      {dados.rating_medio != null && (
        <div className="card">
          <p className="section-label">Qualidade percebida dos concorrentes</p>
          <div className="rating-row">
            <div className="metric">
              <span className="metric-val" style={{ fontSize: 26 }}>★ {dados.rating_medio}</span>
              <span className="metric-lbl">Nota média</span>
            </div>
            <div className="metric">
              <span className="metric-val">{(dados.total_avaliacoes || 0).toLocaleString('pt-BR')}</span>
              <span className="metric-lbl">Avaliações</span>
            </div>
            <div className="rating-insight">
              {dados.rating_medio < 3.5 && (
                <p className="insight-text">Nota baixa — oportunidade real de entrada com qualidade superior.</p>
              )}
              {dados.rating_medio >= 3.5 && dados.rating_medio < 4.2 && (
                <p className="insight-text">Mercado mediano. Atendimento acima da média pode ser seu diferencial.</p>
              )}
              {dados.rating_medio >= 4.2 && (
                <p className="insight-text">Concorrência bem avaliada. Diferenciação por nicho ou experiência é essencial.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LISTAGEM COMPLETA DOS ESTABELECIMENTOS */}
      {dados.lugares && dados.lugares.length > 0 && (
        <div className="card">
          <div className="lista-header">
            <p className="section-label" style={{ marginBottom: 0 }}>
              Estabelecimentos encontrados no Google Maps
            </p>
            <span className="lista-count">{dados.lugares.length} locais</span>
          </div>

          <div className="lista-filtros">
            <span className="lista-stat">
              <span className="dot-verde" /> {dados.lugares.filter(l => l.ativa).length} abertos
            </span>
            <span className="lista-stat">
              <span className="dot-cinza" /> {dados.lugares.filter(l => !l.ativa).length} fechados
            </span>
            {dados.rating_medio && (
              <span className="lista-stat">★ {dados.rating_medio} média</span>
            )}
          </div>

          <div className="lugares-lista">
            {dados.lugares.map((lugar, i) => (
              <div key={i} className={`lugar-row ${!lugar.ativa ? 'inativo' : ''}`}>
                <div className="lugar-numero">{String(i + 1).padStart(2, '0')}</div>
                <div className="lugar-info">
                  <span className="lugar-nome">{lugar.nome}</span>
                  <span className="lugar-endereco">{lugar.endereco}</span>
                  <div className="lugar-tags">
                    {lugar.bairro && lugar.bairro !== lugar.endereco && (
                      <span className="lugar-tag">{lugar.bairro}</span>
                    )}
                    {lugar.rating != null && (
                      <span className="lugar-tag lugar-tag-rating">
                        ★ {lugar.rating}
                        <span className="lugar-tag-avaliacoes"> ({lugar.num_avaliacoes})</span>
                      </span>
                    )}
                    <span className={`lugar-tag ${lugar.ativa ? 'lugar-tag-aberto' : 'lugar-tag-fechado'}`}>
                      {lugar.ativa ? 'Aberto' : 'Fechado'}
                    </span>
                  </div>
                </div>
                {lugar.latitude !== 0 && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${lugar.latitude},${lugar.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lugar-maps-btn"
                    title="Ver no mapa"
                  >
                    ↗
                  </a>
                )}
              </div>
            ))}
          </div>

          {dados.lat_centro !== 0 && (
            <a
              href={`https://www.google.com/maps/search/${encodeURIComponent(dados.cnae)}/@${dados.lat_centro},${dados.lng_centro},14z`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-maps"
            >
              Ver todos no Google Maps →
            </a>
          )}
        </div>
      )}

      {/* Caso não haja lugares (fallback) */}
      {(!dados.lugares || dados.lugares.length === 0) && (
        <div className="card">
          <p className="section-label">Nenhum estabelecimento encontrado</p>
          <p className="insight-texto">Tente ampliar o raio de busca ou verificar o termo pesquisado.</p>
        </div>
      )}

    </div>
  )
}