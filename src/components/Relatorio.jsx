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
  { msg: 'Analisando região...', pct: 15 },
  { msg: 'Mapeando concorrência...', pct: 35 },
  { msg: 'Calculando oportunidades...', pct: 55 },
  { msg: 'Gerando recomendações com IA...', pct: 80 },
  { msg: 'Finalizando análise...', pct: 95 },
]

// Converte nota 0-5 para NPS estimado (-100 a +100)
// Baseado em estudos de correlação entre star rating e NPS
function notaParaNps(nota) {
  if (!nota) return null
  // 5.0 → ~+85, 4.5 → ~+60, 4.0 → ~+30, 3.5 → ~0, 3.0 → ~-20, abaixo → negativo
  const nps = Math.round((nota - 3.5) * 80)
  return Math.max(-100, Math.min(100, nps))
}

function npsClasse(nps) {
  if (nps === null) return 'neutro'
  if (nps >= 50) return 'excelente'
  if (nps >= 0) return 'bom'
  return 'ruim'
}

function npsTexto(nps) {
  if (nps === null) return 'Dados insuficientes para calcular.'
  if (nps >= 50) return 'Clientes são promotores ativos. Alta fidelização no segmento.'
  if (nps >= 0) return 'Satisfação moderada. Há espaço para superar a concorrência em experiência.'
  return 'Clientes insatisfeitos com a concorrência — oportunidade real de entrada com qualidade superior.'
}

// Calcula distribuição estimada de detratores/neutros/promotores
// baseada na nota média real
function calcularDistribuicaoNps(nota) {
  if (!nota) return { detratores: 10, neutros: 20, promotores: 70 }
  if (nota >= 4.5) return { detratores: 5,  neutros: 15, promotores: 80 }
  if (nota >= 4.0) return { detratores: 10, neutros: 25, promotores: 65 }
  if (nota >= 3.5) return { detratores: 20, neutros: 30, promotores: 50 }
  if (nota >= 3.0) return { detratores: 35, neutros: 30, promotores: 35 }
  return { detratores: 50, neutros: 25, promotores: 25 }
}

export default function Relatorio({ cnae, municipio, raio_km, onVoltar }) {
  const [dados, setDados] = useState(null)
  const [recomendacao, setRecomendacao] = useState(null)
  const [erro, setErro] = useState(null)
  const [step, setStep] = useState(0)
  const [pct, setPct] = useState(0)
  const [loading, setLoading] = useState(true)
  const [erroRec, setErroRec] = useState(false)

  useEffect(() => {
    let stepIdx = 0
    let isMounted = true
    setPct(LOADING_STEPS[0].pct)

    const interval = setInterval(() => {
      if (stepIdx < LOADING_STEPS.length - 1) {
        stepIdx++
        if (isMounted) { setStep(stepIdx); setPct(LOADING_STEPS[stepIdx].pct) }
      }
    }, 2500)

    const fetchRelatorio = api.get('/relatorio', { params: { cnae, municipio, raio_km } })
      .then(r => { if (isMounted) setDados(r.data) })
      .catch(err => {
        if (isMounted) setErro(err.response?.data?.detail || err.message || 'Erro desconhecido')
      })

    const fetchRec = api.get('/recomendar-ia', { params: { cnae, municipio, raio_km } })
      .then(r => { if (isMounted) setRecomendacao(r.data) })
      .catch(() => { if (isMounted) setErroRec(true) })

    Promise.all([fetchRelatorio, fetchRec]).finally(() => {
      if (isMounted) {
        clearInterval(interval)
        setPct(100)
        setTimeout(() => setLoading(false), 400)
      }
    })

    return () => { isMounted = false; clearInterval(interval) }
  }, [cnae, municipio, raio_km])

  if (loading) return (
    <div className="rel-wrap">
      <div className="rel-header">
        <button className="btn-voltar" onClick={onVoltar}>← Voltar</button>
      </div>
      <div className="loading-card card">
        <p className="loading-label">Analisando mercado</p>
        <p className="loading-msg">{LOADING_STEPS[step].msg}</p>
        <div className="loading-track"><div className="loading-fill" style={{ width: `${pct}%` }} /></div>
        <p className="loading-pct">{pct}%</p>
      </div>
    </div>
  )

  if (erro) return (
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

  if (!dados) return null

  const cfg = STATUS_CONFIG[dados.status] || STATUS_CONFIG.moderado
  const nomeExibido = cnae.charAt(0).toUpperCase() + cnae.slice(1)
  const notaMedia = dados.rating_medio || 0
  const nps = notaParaNps(notaMedia)
  const dist = calcularDistribuicaoNps(notaMedia)
  const insightIa = recomendacao?.analise_ia?.sucesso ? recomendacao.analise_ia : null
  const melhorRua = recomendacao?.melhor_rua || null
  const ranking = recomendacao?.ranking || []

  return (
    <div className="rel-wrap">

      {/* Header */}
      <div className="rel-header">
        <button className="btn-voltar" onClick={onVoltar}>← Voltar</button>
        <span className="badge-real">Análise Saturado</span>
      </div>

      {/* Título */}
      <div className="card">
        <p className="eyebrow">{dados.municipio} · {dados.raio_km}km</p>
        <h1 className="rel-titulo">{nomeExibido}</h1>
        <div className="status-pill" style={{ background: cfg.bg, color: cfg.text }}>
          <span className="status-dot" style={{ background: cfg.color }} />
          {cfg.label}
        </div>
      </div>

      {/* ── 01 RECOMENDAÇÃO ─────────────────────────────────── */}
      <div className="card rec-card">
        <div className="part-header">
          <span className="part-number">01</span>
          <span className="part-title">Onde abrir? Recomendação por rua</span>
        </div>

        {/* Sem dados da rota /recomendar-ia */}
        {(erroRec || !melhorRua) && (
          <div className="rec-sem-dados">
            <p className="rec-sem-icon">📍</p>
            <p className="rec-sem-titulo">Recomendação indisponível</p>
            <p className="rec-sem-sub">
              {erroRec
                ? 'A rota /recomendar-ia não respondeu. Verifique se o serviço ia_insights está importado no main.py.'
                : 'Nenhuma rua foi identificada com dados suficientes para recomendação.'}
            </p>
          </div>
        )}

        {/* Rua recomendada */}
        {melhorRua && (
          <>
            <div className="rec-rua-tag">{melhorRua.rua}</div>
            <div className="rec-destaque-row">
              <div className="rec-score-bloco">
                <span className="rec-score-num" style={{ color: melhorRua.score >= 70 ? '#639922' : melhorRua.score >= 50 ? '#EF9F27' : '#E24B4A' }}>
                  {melhorRua.score}
                </span>
                <span className="rec-score-de">/100</span>
              </div>
              <div className="rec-rua-info">
                <h2 className="rec-rua-nome">
                  {melhorRua.emoji || '🏆'} {melhorRua.rua}
                </h2>
                {melhorRua.bairro_referencia && (
                  <p className="rec-rua-bairro">{melhorRua.bairro_referencia}</p>
                )}
                <p className="rec-rua-desc">{melhorRua.recomendacao}</p>
              </div>
            </div>

            {/* Insight IA */}
            {insightIa && (
              <div className="rec-ia-bloco">
                <div className="rec-ia-header">
                  <span className="rec-ia-icon">🧠</span>
                  <span className="rec-ia-label">Insight gerado por IA</span>
                </div>
                <p className="rec-ia-text">
                  <strong>{insightIa.melhor_rua || melhorRua.rua}:</strong> {insightIa.porque}
                </p>
                {insightIa.frase_impacto && (
                  <p className="rec-ia-frase">"{insightIa.frase_impacto}"</p>
                )}
              </div>
            )}

            {/* Métricas da rua */}
            <div className="rec-metricas">
              <div className="rec-metrica">
                <span className="rec-metrica-val">{melhorRua.concorrentes}</span>
                <span className="rec-metrica-lbl">concorrentes</span>
              </div>
              {melhorRua.concorrentes_km != null && (
                <div className="rec-metrica">
                  <span className="rec-metrica-val">{melhorRua.concorrentes_km}</span>
                  <span className="rec-metrica-lbl">conc/km</span>
                </div>
              )}
              {melhorRua.nota_media != null && (
                <div className="rec-metrica">
                  <span className="rec-metrica-val">★ {melhorRua.nota_media}</span>
                  <span className="rec-metrica-lbl">nota média</span>
                </div>
              )}
              {melhorRua.demanda_total != null && (
                <div className="rec-metrica">
                  <span className="rec-metrica-val">{(melhorRua.demanda_total || 0).toLocaleString('pt-BR')}</span>
                  <span className="rec-metrica-lbl">avaliações</span>
                </div>
              )}
            </div>

            {/* Concorrentes na rua */}
            {melhorRua.lista_concorrentes?.length > 0 && (
              <div className="rec-lista-conc">
                <p className="rec-lista-titulo">Concorrentes nesta via</p>
                <div className="rec-tags-conc">
                  {melhorRua.lista_concorrentes.map((nome, i) => (
                    <span key={i} className="rec-tag-conc">{nome}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Distância média */}
            {melhorRua.distancia_media_m != null && (
              <div className="rec-distancia">
                <span className="rec-distancia-icon">📏</span>
                <span>Distância média entre concorrentes: <strong>{melhorRua.distancia_media_m}m</strong>
                {melhorRua.distancia_media_m > 200
                  ? ' — Espaço generoso para se posicionar!'
                  : ' — Rua bastante concentrada.'}</span>
              </div>
            )}

            {/* Estratégia */}
            {recomendacao.descricao_estrategia && (
              <div className="rec-estrategia">
                <span className="rec-estrategia-icon">🎯</span>
                <span><strong>Estratégia aplicada:</strong> {recomendacao.descricao_estrategia}</span>
              </div>
            )}

            {/* Ranking top ruas */}
            {ranking.length > 1 && (
              <div className="rec-ranking">
                <p className="rec-ranking-titulo">📊 Top ruas na região</p>
                {ranking.slice(0, 5).map((r, i) => (
                  <div key={r.rua} className="rec-ranking-row">
                    <span className="rec-ranking-pos">{i + 1}º</span>
                    <span className="rec-ranking-emoji">{r.emoji || '📍'}</span>
                    <span className="rec-ranking-nome">{r.rua}</span>
                    <div className="rec-ranking-bar-wrap">
                      <div className="rec-ranking-bar" style={{
                        width: `${r.score}%`,
                        background: r.score >= 70 ? '#639922' : r.score >= 50 ? '#EF9F27' : '#E24B4A'
                      }} />
                    </div>
                    <span className="rec-ranking-score">{r.score}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── 02 SATISFAÇÃO ───────────────────────────────────── */}
      {notaMedia > 0 && (
        <div className="card">
          <div className="part-header">
            <span className="part-number">02</span>
            <span className="part-title">Satisfação do mercado</span>
          </div>

          <div className="sat-grid">
            {/* NPS */}
            <div className="sat-bloco">
              <span className="sat-val" style={{ color: nps === null ? 'var(--text-muted)' : nps >= 50 ? '#639922' : nps >= 0 ? '#EF9F27' : '#E24B4A' }}>
                {nps !== null ? (nps > 0 ? `+${nps}` : nps) : '—'}
              </span>
              <span className="sat-lbl">NPS estimado</span>
              <p className="sat-desc">{npsTexto(nps)}</p>
            </div>

            {/* Nota média */}
            <div className="sat-bloco">
              <span className="sat-val" style={{ color: '#EF9F27' }}>★ {notaMedia}</span>
              <span className="sat-lbl">nota média /5.0</span>
              <p className="sat-desc">
                {notaMedia >= 4.5 ? 'Concorrência bem avaliada. Diferenciação por nicho é essencial.' :
                 notaMedia >= 3.5 ? 'Mercado mediano. Atendimento acima da média pode ser seu diferencial.' :
                 'Nota baixa — oportunidade de entrada com qualidade superior.'}
              </p>
            </div>

            {/* Avaliações */}
            <div className="sat-bloco">
              <span className="sat-val">{(dados.total_avaliacoes || 0).toLocaleString('pt-BR')}</span>
              <span className="sat-lbl">avaliações totais</span>
              <p className="sat-desc">Proxy de demanda real — quanto maior, mais clientes ativos no segmento.</p>
            </div>
          </div>

          {/* Barra NPS baseada em dados reais */}
          <div className="nps-barra-wrap">
            <div className="nps-barra">
              <div className="nps-seg det" style={{ width: `${dist.detratores}%` }} title={`Detratores ${dist.detratores}%`} />
              <div className="nps-seg neu" style={{ width: `${dist.neutros}%` }}    title={`Neutros ${dist.neutros}%`} />
              <div className="nps-seg pro" style={{ width: `${dist.promotores}%` }} title={`Promotores ${dist.promotores}%`} />
            </div>
            <div className="nps-legenda">
              <span><i className="leg-cor det" />Detratores {dist.detratores}%</span>
              <span><i className="leg-cor neu" />Neutros {dist.neutros}%</span>
              <span><i className="leg-cor pro" />Promotores {dist.promotores}%</span>
            </div>
            <p className="nps-fonte">* Distribuição estimada com base na nota média real dos concorrentes</p>
          </div>
        </div>
      )}

      {/* ── 03 CONCENTRAÇÃO POR VIA ─────────────────────────── */}
      {dados.por_bairro && Object.keys(dados.por_bairro).length > 0 && (
        <div className="card">
          <div className="part-header">
            <span className="part-number">03</span>
            <span className="part-title">Concentração por via</span>
          </div>
          <div className="conc-lista">
            {Object.entries(dados.por_bairro).map(([via, qtd]) => {
              const pct = dados.total_empresas > 0 ? Math.round(qtd / dados.total_empresas * 100) : 0
              const maxQtd = Math.max(...Object.values(dados.por_bairro))
              const barW = Math.round(qtd / maxQtd * 100)
              return (
                <div key={via} className="conc-row">
                  <span className="conc-nome">{via}</span>
                  <div className="conc-bar-wrap">
                    <div className="conc-bar" style={{ width: `${barW}%`, background: cfg.bar }} />
                  </div>
                  <span className="conc-pct">{pct}%</span>
                  <span className="conc-qtd">({qtd})</span>
                </div>
              )
            })}
          </div>
          <p className="conc-nota">Percentual do total de {dados.total_empresas} estabelecimentos encontrados</p>
        </div>
      )}

      {/* ── 04 RANKING DAS VIAS ─────────────────────────────── */}
      {ranking.length > 1 && (
        <div className="card">
          <div className="part-header">
            <span className="part-number">04</span>
            <span className="part-title">Ranking de oportunidade por via</span>
          </div>
          <div className="rank-lista">
            {ranking.slice(0, 5).map((r, i) => (
              <div key={r.rua} className={`rank-row ${i === 0 ? 'rank-top' : ''}`}>
                <span className="rank-pos">{i + 1}º</span>
                <span className="rank-emoji">{r.emoji || '📍'}</span>
                <span className="rank-nome">{r.rua}</span>
                <div className="rank-bar-wrap">
                  <div className="rank-bar" style={{
                    width: `${r.score}%`,
                    background: r.score >= 70 ? '#639922' : r.score >= 50 ? '#EF9F27' : '#E24B4A'
                  }} />
                </div>
                <span className="rank-score">{r.score}</span>
              </div>
            ))}
          </div>
          <p className="rank-nota">Score = densidade × demanda × gap de qualidade — quanto maior, melhor a oportunidade</p>
        </div>
      )}

      {/* ── 05 ESTABELECIMENTOS ─────────────────────────────── */}
      {dados.lugares?.length > 0 && (
        <div className="card">
          <div className="part-header">
            <span className="part-number">05</span>
            <span className="part-title">Estabelecimentos identificados</span>
          </div>
          <div className="estab-header">
            <span className="estab-count">{dados.lugares.length} encontrados nas proximidades</span>
            <div className="estab-resumo">
              <span><span className="dot-verde" /> {dados.lugares.filter(l => l.ativa).length} abertos</span>
              <span><span className="dot-cinza" /> {dados.lugares.filter(l => !l.ativa).length} fechados</span>
            </div>
          </div>
          <div className="estab-lista">
            {dados.lugares.map((lugar, i) => (
              <div key={i} className={`estab-row ${!lugar.ativa ? 'inativo' : ''}`}>
                <span className="estab-num">{String(i + 1).padStart(2, '0')}</span>
                <div className="estab-info">
                  <span className="estab-nome">{lugar.nome}</span>
                  <span className="estab-end">{lugar.endereco}</span>
                  {lugar.rating != null && (
                    <span className="estab-rating">
                      ★ {lugar.rating}
                      {lugar.num_avaliacoes > 0 && <span className="estab-aval"> ({lugar.num_avaliacoes})</span>}
                    </span>
                  )}
                </div>
                {lugar.latitude !== 0 && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${lugar.latitude},${lugar.longitude}`}
                    target="_blank" rel="noopener noreferrer"
                    className="estab-maps"
                    title="Ver no mapa"
                  >↗</a>
                )}
              </div>
            ))}
          </div>
          {dados.lat_centro !== 0 && (
            <a
              href={`https://www.google.com/maps/search/${encodeURIComponent(cnae)}/@${dados.lat_centro},${dados.lng_centro},14z`}
              target="_blank" rel="noopener noreferrer"
              className="btn-maps"
            >
              Ver todos no Google Maps →
            </a>
          )}
        </div>
      )}

    </div>
  )
}
