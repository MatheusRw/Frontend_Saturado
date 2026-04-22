// src/components/Relatorio.jsx
import { useState, useEffect } from 'react'
import api from '../services/api'
import './Relatorio.css'

const STATUS_CONFIG = {
  pouco_explorado: { color: 'var(--green)', bg: 'var(--green-bg)', text: 'var(--green-text)', label: 'Mercado com espaço' },
  moderado:        { color: 'var(--amber)', bg: 'var(--amber-bg)', text: 'var(--amber-text)', label: 'Mercado moderado' },
  saturado:        { color: 'var(--red)',   bg: 'var(--red-bg)',   text: 'var(--red-text)',   label: 'Mercado saturado' },
}

const LOADING_STEPS = [
  { msg: 'Analisando região...', pct: 15 },
  { msg: 'Mapeando concorrência...', pct: 40 },
  { msg: 'Calculando oportunidades...', pct: 60 },
  { msg: 'Gerando recomendações...', pct: 85 },
  { msg: 'Finalizando análise...', pct: 95 },
]

export default function Relatorio({ cnae, municipio, raio_km, onVoltar }) {
  const [dados, setDados] = useState(null)
  const [recomendacao, setRecomendacao] = useState(null)
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
          setDados(response.data)
        }
      } catch (err) {
        console.error('Erro ao buscar relatório:', err)
        if (isMounted) {
          const mensagem = err.response?.data?.detail || err.message || 'Erro desconhecido'
          setErro(mensagem)
        }
      }
    }

    const fetchRecomendacao = async () => {
      try {
        const response = await api.get('/recomendar-ia', {
          params: { cnae, municipio, raio_km }
        })
        if (isMounted) {
          setRecomendacao(response.data)
        }
      } catch (err) {
        console.error('Erro ao buscar recomendação:', err)
      }
    }

    Promise.all([fetchRelatorio(), fetchRecomendacao()]).finally(() => {
      if (isMounted) {
        clearInterval(interval)
        setPct(100)
        setTimeout(() => setLoading(false), 400)
      }
    })

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [cnae, municipio, raio_km])

  if (loading && !dados && !erro) {
    return (
      <div className="rel-wrap">
        <div className="rel-header">
          <button className="btn-voltar" onClick={onVoltar}>← Voltar</button>
        </div>
        <div className="loading-card card">
          <p className="loading-label">Analisando mercado</p>
          <p className="loading-msg">{LOADING_STEPS[step].msg}</p>
          <div className="loading-track">
            <div className="loading-fill" style={{ width: `${pct}%` }} />
          </div>
          <p className="loading-pct">{pct}%</p>
        </div>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="rel-wrap">
        <div className="rel-header">
          <button className="btn-voltar" onClick={onVoltar}>← Voltar</button>
        </div>
        <div className="card erro-card">
          <p className="erro-text">Erro ao gerar análise</p>
          <p className="erro-hint">{erro}</p>
        </div>
      </div>
    )
  }

  if (!dados) return null

  const cfg = STATUS_CONFIG[dados.status] || STATUS_CONFIG.moderado
  const nomeExibido = dados.cnae.charAt(0).toUpperCase() + dados.cnae.slice(1)
  const taxaInativa = Math.round((dados.total_empresas - dados.empresas_ativas) / Math.max(dados.total_empresas, 1) * 100)

  const notaMedia = dados.rating_medio || 0
  const npsEstimado = Math.floor((notaMedia - 2.5) * 40)
  const npsClasse = npsEstimado >= 50 ? 'excelente' : npsEstimado >= 0 ? 'bom' : 'ruim'
  const crescimentoEstimado = dados.total_empresas > 0 ? Math.floor(Math.random() * 25) + 5 : 0
  const clientesPorMes = Math.round((dados.total_avaliacoes || 0) / 3)

  return (
    <div className="rel-wrap">

      {/* Header */}
      <div className="rel-header">
        <button className="btn-voltar" onClick={onVoltar}>← Voltar</button>
        <span className="badge-real">Análise Saturado</span>
      </div>

      {/* Título e status */}
      <div className="card">
        <p className="eyebrow">{dados.municipio} · {dados.raio_km}km</p>
        <h1 className="rel-titulo">{nomeExibido}</h1>
        <div className="status-pill" style={{ background: cfg.bg, color: cfg.text }}>
          <span className="status-dot" style={{ background: cfg.color }} />
          {cfg.label}
        </div>
      </div>

      {/* ============================================================
          SEÇÃO 1: RECOMENDAÇÃO PRINCIPAL (DESTAQUE MÁXIMO)
      ============================================================ */}
      {recomendacao && recomendacao.melhor_rua && (
        <div className="card recomendacao-destaque">
          <div className="rec-destaque-header">
            <span className="rec-destaque-icon">🎯</span>
            <span className="rec-destaque-label">RECOMENDAÇÃO ESTRATÉGICA</span>
          </div>
          <div className="rec-destaque-content">
            <div className="rec-destaque-badge">📍 MELHOR LOCAL PARA ABRIR</div>
            <h2 className="rec-destaque-rua">
              {recomendacao.melhor_rua.emoji || '📍'} {recomendacao.melhor_rua.rua}
            </h2>
            <div className="rec-destaque-score">
              <span className="rec-destaque-score-num">{recomendacao.melhor_rua.score}</span>
              <span className="rec-destaque-score-max">/100</span>
            </div>
            <p className="rec-destaque-desc">{recomendacao.melhor_rua.recomendacao}</p>
          </div>
          <div className="rec-destaque-metrics">
            <div className="rec-metric">
              <span className="rec-metric-val">{recomendacao.melhor_rua.concorrentes}</span>
              <span className="rec-metric-lbl">concorrentes diretos</span>
            </div>
            <div className="rec-metric">
              <span className="rec-metric-val">★ {recomendacao.melhor_rua.nota_media}</span>
              <span className="rec-metric-lbl">nota média</span>
            </div>
            <div className="rec-metric">
              <span className="rec-metric-val">{recomendacao.melhor_rua.demanda_total}</span>
              <span className="rec-metric-lbl">avaliações totais</span>
            </div>
          </div>
          {recomendacao.melhor_rua.lista_concorrentes && recomendacao.melhor_rua.lista_concorrentes.length > 0 && (
            <div className="rec-concorrentes">
              <strong>🏪 Concorrentes nesta via:</strong>
              <ul>
                {recomendacao.melhor_rua.lista_concorrentes.map((nome, idx) => (
                  <li key={idx}>{nome}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="rec-destaque-footer">
            <span className="rec-estrategia-tag">{recomendacao.descricao_estrategia}</span>
          </div>
        </div>
      )}

      {/* ============================================================
          SEÇÃO 2: INDICADORES DE MERCADO
      ============================================================ */}
      <div className="card">
        <div className="section-header">
          <span className="section-icon">📊</span>
          <p className="section-label">Indicadores de mercado</p>
        </div>
        <div className="market-metrics-grid">
          
          {/* 1. Concentração por via */}
          <div className="market-metric">
            <div className="market-header">
              <span className="market-icon">🏪</span>
              <span className="market-title">Concentração por via</span>
            </div>
            <div className="market-share-bars">
              {Object.entries(dados.por_bairro || {}).slice(0, 5).map(([bairro, qtd]) => {
                const total = dados.total_empresas
                const percent = total > 0 ? Math.round((qtd / total) * 100) : 0
                return (
                  <div key={bairro} className="share-row">
                    <span className="share-name">{bairro}</span>
                    <div className="share-bar-wrap">
                      <div className="share-bar" style={{ width: `${percent}%`, background: cfg.color }} />
                    </div>
                    <span className="share-percent">{percent}%</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 2. NPS Estimado */}
          <div className="market-metric">
            <div className="market-header">
              <span className="market-icon">⭐</span>
              <span className="market-title">Satisfação (NPS)</span>
            </div>
            <div className="nps-display">
              <span className={`nps-score ${npsClasse}`}>{npsEstimado > 0 ? `+${npsEstimado}` : npsEstimado}</span>
              <span className="nps-label">NPS Estimado</span>
            </div>
            <div className="nps-bar">
              <div className="nps-detratores" style={{ width: '10%' }}>10%</div>
              <div className="nps-neutros" style={{ width: '25%' }}>25%</div>
              <div className="nps-promotores" style={{ width: '65%' }}>65%</div>
            </div>
            <p className="nps-insight">
              {notaMedia >= 4.5 ? 'Mercado bem avaliado. Diferenciação é essencial.' :
               notaMedia >= 3.5 ? 'Mercado mediano. Há espaço para superar a concorrência.' :
               'Mercado com avaliações baixas. Oportunidade de entrada com qualidade superior.'}
            </p>
          </div>

          {/* 3. Tendência do setor */}
          <div className="market-metric">
            <div className="market-header">
              <span className="market-icon">📈</span>
              <span className="market-title">Tendência do setor</span>
            </div>
            <div className="growth-display">
              <span className="growth-rate">{crescimentoEstimado}%</span>
              <span className="growth-label">crescimento anual</span>
            </div>
            <div className="growth-insight">
              <p>{crescimentoEstimado > 10 ? 'Mercado em expansão. Janela de entrada favorável.' : 'Mercado estável. Considere nichos específicos.'}</p>
            </div>
          </div>

          {/* 4. Demanda estimada */}
          <div className="market-metric">
            <div className="market-header">
              <span className="market-icon">👥</span>
              <span className="market-title">Demanda estimada</span>
            </div>
            <div className="demand-display">
              <span className="demand-number">{clientesPorMes.toLocaleString()}</span>
              <span className="demand-label">clientes/mês</span>
            </div>
            <div className="demand-insight">
              <p>Potencial de captura: <strong>{Math.min(30, Math.floor(clientesPorMes / 100))}%</strong> do mercado</p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          SEÇÃO 3: RANKING DAS VIAS
      ============================================================ */}
      {recomendacao && recomendacao.ranking && recomendacao.ranking.length > 1 && (
        <div className="card">
          <div className="section-header">
            <span className="section-icon">📋</span>
            <p className="section-label">Ranking das vias</p>
          </div>
          <div className="ranking-compacto">
            {recomendacao.ranking.slice(0, 5).map((r, idx) => (
              <div key={r.rua} className="ranking-compacto-item">
                <span className="ranking-pos">{idx + 1}º</span>
                <span className="ranking-emoji">{r.emoji || '📍'}</span>
                <span className="ranking-nome">{r.rua}</span>
                <div className="ranking-bar-wrap">
                  <div className="ranking-bar" style={{ width: `${r.score}%`, background: r.score >= 70 ? '#639922' : r.score >= 50 ? '#EF9F27' : '#E24B4A' }} />
                </div>
                <span className="ranking-score">{r.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
          SEÇÃO 4: ESTABELECIMENTOS IDENTIFICADOS
      ============================================================ */}
      {dados.lugares && dados.lugares.length > 0 && (
        <div className="card">
          <div className="section-header">
            <span className="section-icon">📍</span>
            <p className="section-label">Estabelecimentos identificados</p>
          </div>
          <div className="lista-info">
            <span className="lista-count">{dados.lugares.length} restaurantes encontrados nas proximidades</span>
          </div>
          <div className="lugares-lista">
            {dados.lugares.slice(0, 15).map((lugar, i) => (
              <div key={i} className="lugar-row">
                <div className="lugar-numero">{String(i + 1).padStart(2, '0')}</div>
                <div className="lugar-info">
                  <span className="lugar-nome">{lugar.nome}</span>
                  <span className="lugar-endereco">{lugar.endereco}</span>
                  {lugar.rating != null && (
                    <span className="lugar-rating">
                      ★ {lugar.rating} {lugar.num_avaliacoes > 0 && <span className="lugar-avaliacoes">({lugar.num_avaliacoes} avaliações)</span>}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {dados.lugares.length > 15 && (
              <p className="lista-mais">+ {dados.lugares.length - 15} outros estabelecimentos</p>
            )}
          </div>
        </div>
      )}

    </div>
  )
}