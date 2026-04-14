import { createContext, useContext, useState, useEffect } from 'react'
import { API_BASE } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Recupera sessão salva ao carregar
  useEffect(() => {
    const saved = localStorage.getItem('saturado_user')
    const token = localStorage.getItem('saturado_token')
    if (saved && token) {
      try { setUser(JSON.parse(saved)) } catch {}
    }
    setLoading(false)
  }, [])

  async function login(email, password) {
    const form = new FormData()
    form.append('email', email)
    form.append('password', password)

    const resp = await fetch(`${API_BASE}/login`, { method: 'POST', body: form })
    const data = await resp.json()

    if (!resp.ok) throw new Error(data.detail || 'Erro ao fazer login')

    localStorage.setItem('saturado_token', data.access_token)
    localStorage.setItem('saturado_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  async function register(email, password) {
    const form = new FormData()
    form.append('email', email)
    form.append('password', password)

    const resp = await fetch(`${API_BASE}/register`, { method: 'POST', body: form })
    const data = await resp.json()

    if (!resp.ok) throw new Error(data.detail || 'Erro ao criar conta')
    return data
  }

  function logout() {
    localStorage.removeItem('saturado_token')
    localStorage.removeItem('saturado_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
