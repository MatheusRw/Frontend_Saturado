import { useState } from 'react';
import api from '../services/api';

export function PricingModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(null);

  if (!isOpen) return null;

  const handleSubscribe = async (priceId) => {
    setLoading(priceId);
    try {
      const response = await api.post('/payments/create-checkout-session', {
        price_id: priceId,
        success_url: `${window.location.origin}/?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: window.location.origin
      });
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao iniciar assinatura. Tente novamente.');
    } finally {
      setLoading(null);
    }
  };

  const PLANS = {
    monthly: {
      name: 'Mensal',
      price: 'R$ 29,90',
      period: 'mês',
      priceId: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID,
      features: ['Relatórios completos', 'Dados do Google Maps', 'Análises ilimitadas']
    },
    yearly: {
      name: 'Anual',
      price: 'R$ 299',
      period: 'ano',
      priceId: import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID,
      features: ['Economia de 2 meses', 'Tudo do plano mensal', 'Suporte prioritário'],
      popular: true
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content pricing-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>🔓 Desbloqueie o Relatório Completo</h2>
        <p className="pricing-subtitle">
          Acesse dados reais do Google Maps e análises detalhadas
        </p>

        <div className="pricing-options">
          {Object.entries(PLANS).map(([key, plan]) => (
            <div key={key} className={`pricing-option ${plan.popular ? 'popular' : ''}`}>
              {plan.popular && <span className="popular-tag">Mais popular</span>}
              <h3>{plan.name}</h3>
              <div className="price">
                <span className="amount">{plan.price}</span>
                <span className="period">/{plan.period}</span>
              </div>
              <ul>
                {plan.features.map((f, i) => <li key={i}>✓ {f}</li>)}
              </ul>
              <button
                onClick={() => handleSubscribe(plan.priceId)}
                disabled={loading === plan.priceId}
                className="btn-subscribe"
              >
                {loading === plan.priceId ? 'Processando...' : 'Assinar agora'}
              </button>
            </div>
          ))}
        </div>

        <p className="pricing-footer">
          🔒 Pagamento seguro via Stripe • Cancele quando quiser
        </p>
      </div>
    </div>
  );
}