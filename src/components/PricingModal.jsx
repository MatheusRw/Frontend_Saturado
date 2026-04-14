import './LoginModal.css'
import './PricingModal.css'

export function PricingModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box pricing-box" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <div className="modal-logo">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="3" fill="white" opacity="0.9"/>
              <circle cx="9" cy="9" r="6" stroke="white" strokeWidth="1.5" opacity="0.45"/>
              <circle cx="9" cy="9" r="8.5" stroke="white" strokeWidth="0.8" opacity="0.2"/>
            </svg>
            <span>Saturado</span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <p className="modal-titulo">Desbloqueie o relatório completo</p>
          <p className="modal-subtitulo">
            Veja todos os concorrentes, análise SWOT com IA e dados reais do Google Maps.
          </p>

          <div className="pricing-card">
            <div className="pricing-badge">PRO</div>
            <div className="pricing-valor">
              <span className="pricing-moeda">R$</span>
              <span className="pricing-num">29</span>
              <span className="pricing-periodo">/mês</span>
            </div>
            <ul className="pricing-lista">
              <li><span className="pricing-check">✓</span> Relatórios completos ilimitados</li>
              <li><span className="pricing-check">✓</span> Lista de todos os concorrentes</li>
              <li><span className="pricing-check">✓</span> Análise SWOT gerada por IA</li>
              <li><span className="pricing-check">✓</span> Dados reais do Google Maps</li>
              <li><span className="pricing-check">✓</span> Concentração por bairro</li>
              <li><span className="pricing-check">✓</span> Link direto para cada concorrente</li>
            </ul>
            <button className="pricing-btn" onClick={() => alert('Em breve! Pagamento via Stripe.')}>
              Assinar agora
            </button>
            <p className="pricing-cancel">Cancele a qualquer momento</p>
          </div>

          <div className="pricing-free">
            <span>Plano atual: </span>
            <span className="user-badge free">📋 Free</span>
            <span> — análise rápida sem relatório</span>
          </div>
        </div>

      </div>
    </div>
  )
}
