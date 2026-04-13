// src/components/PricingPlans.jsx
import { SubscriptionButton } from './Subscription';
import { useAuth } from '../contexts/AuthContext';
import './Relatorio.css';

const PLANS = {
  free: {
    name: 'Gratuito',
    price: 'R$ 0',
    period: 'mês',
    features: [
      '3 análises por mês',
      'Dados básicos',
      'Suporte por email'
    ],
    priceId: null
  },
  pro_monthly: {
    name: 'Premium Mensal',
    price: 'R$ 29,90',
    period: 'mês',
    features: [
      'Análises ilimitadas',
      'Dados completos do Google Maps',
      'Exportação CSV',
      'Suporte prioritário',
      'Relatórios detalhados'
    ],
    priceId: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID
  },
  pro_yearly: {
    name: 'Premium Anual',
    price: 'R$ 299',
    period: 'ano',
    features: [
      'Análises ilimitadas',
      'Dados completos do Google Maps',
      'Exportação CSV',
      'Suporte prioritário',
      'Economia de 2 meses'
    ],
    priceId: import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID,
    popular: true
  }
};

export function PricingPlans() {
  const { user } = useAuth();

  if (user?.status === 'PRO') {
    return (
      <div className="card">
        <p className="section-label">Você já é Premium!</p>
        <p className="insight-texto">
          Sua assinatura está ativa. Aproveite todos os recursos do Saturado.
        </p>
      </div>
    );
  }

  return (
    <div className="pricing-grid">
      {Object.entries(PLANS).map(([key, plan]) => (
        <div key={key} className={`pricing-card ${plan.popular ? 'popular' : ''}`}>
          {plan.popular && <div className="popular-badge">Mais Popular</div>}
          <h3>{plan.name}</h3>
          <div className="price">
            <span className="amount">{plan.price}</span>
            <span className="period">/{plan.period}</span>
          </div>
          <ul className="features">
            {plan.features.map((feature, i) => (
              <li key={i}>✓ {feature}</li>
            ))}
          </ul>
          {plan.priceId ? (
            <SubscriptionButton priceId={plan.priceId}>
              Assinar {plan.name}
            </SubscriptionButton>
          ) : (
            <button className="btn-outline" disabled>
              Plano Atual
            </button>
          )}
        </div>
      ))}
    </div>
  );
}