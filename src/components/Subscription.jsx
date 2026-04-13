// src/components/Subscription.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';
import './Relatorio.css'; // ou um CSS específico

export function SubscriptionStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await api.get('/payments/subscription-status');
        setStatus(response.data);
      } catch (error) {
        console.error('Erro ao buscar status:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStatus();
  }, []);

  if (loading) return <div className="loading-card">Carregando status...</div>;

  return (
    <div className="subscription-card card">
      <h3>Status da Assinatura</h3>
      <div className={`badge ${status?.status?.toLowerCase()}`}>
        {status?.status === 'PRO' ? '⭐ Premium Ativo' : '📋 Plano Gratuito'}
      </div>
      {status?.end_date && (
        <p className="subscription-expiry">
          Válido até: {new Date(status.end_date).toLocaleDateString('pt-BR')}
        </p>
      )}
      {status?.status !== 'PRO' && (
        <a href="/pricing" className="btn-premium">
          🔓 Assinar Premium
        </a>
      )}
    </div>
  );
}

export function SubscriptionButton({ priceId, children, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const response = await api.post('/payments/create-checkout-session', {
        price_id: priceId,
        success_url: `${window.location.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/pricing`
      });
      
      // Redireciona para o Stripe Checkout
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleSubscribe} 
      disabled={loading}
      className="btn-subscribe"
    >
      {loading ? 'Processando...' : children}
    </button>
  );
}