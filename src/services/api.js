import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  // CORRIGIDO: usar a mesma chave que o AuthContext salva
  const token = localStorage.getItem('saturado_token');
  console.log('Token encontrado:', token ? 'Sim' : 'Não'); // debug
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function analisarMercado({ cnae, municipio, raio_km }) {
  const params = new URLSearchParams({ cnae, municipio, raio_km });
  const response = await fetch(`${API_BASE}/analise?${params}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Erro ao analisar mercado');
  }
  return response.json();
}

export default api;