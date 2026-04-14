import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './LoginModal.css'

export function LoginModal({ isOpen, onClose, onSuccess }) {
  const [aba, setAba] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  const { login, register } = useAuth()

  if (!isOpen) return null

  function fechar() {
    setErro('')
    setSucesso('')
    setEmail('')
    setPassword('')
    setAba('login')
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setSucesso('')

    if (!email || !password) {
      setErro('Preencha email e senha.')
      return
    }
    if (password.length < 6) {
      setErro('Senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)
    try {
      if (aba === 'login') {
        const user = await login(email, password)
        fechar()
        onSuccess?.(user)
      } else {
        await register(email, password)
        setSucesso('Conta criada! Fazendo login...')
        const user = await login(email, password)
        setTimeout(() => { fechar(); onSuccess?.(user) }, 800)
      }
    } catch (e) {
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={fechar}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <div className="modal-logo">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="3" fill="white" opacity="0.9"/>
              <circle cx="9" cy="9" r="6" stroke="white" strokeWidth="1.5" opacity="0.45"/>
              <circle cx="9" cy="9" r="8.5" stroke="white" strokeWidth="0.8" opacity="0.2"/>
            </svg>
            <span>Saturado</span>
          </div>
          <button className="modal-close" onClick={fechar}>✕</button>
        </div>

        {/* Abas */}
        <div className="modal-tabs">
          <button
            className={`modal-tab ${aba === 'login' ? 'ativo' : ''}`}
            onClick={() => { setAba('login'); setErro(''); setSucesso('') }}
          >
            Entrar
          </button>
          <button
            className={`modal-tab ${aba === 'register' ? 'ativo' : ''}`}
            onClick={() => { setAba('register'); setErro(''); setSucesso('') }}
          >
            Criar conta
          </button>
        </div>

        {/* Título */}
        <div className="modal-body">
          <p className="modal-titulo">
            {aba === 'login' ? 'Bem-vindo de volta' : 'Comece gratuitamente'}
          </p>
          <p className="modal-subtitulo">
            {aba === 'login'
              ? 'Entre para acessar seus relatórios.'
              : 'Crie sua conta e faça sua primeira análise.'}
          </p>

          <form onSubmit={handleSubmit} className="modal-form">
            <div className="modal-field">
              <label className="modal-label">Email</label>
              <input
                className="modal-input"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
                autoComplete="email"
              />
            </div>

            <div className="modal-field">
              <label className="modal-label">Senha</label>
              <input
                className="modal-input"
                type="password"
                placeholder={aba === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete={aba === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {erro && <p className="modal-erro">{erro}</p>}
            {sucesso && <p className="modal-sucesso">{sucesso}</p>}

            <button
              type="submit"
              className="modal-btn-submit"
              disabled={loading}
            >
              {loading
                ? 'Aguarde...'
                : aba === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          {aba === 'login' && (
            <p className="modal-switch">
              Não tem conta?{' '}
              <button onClick={() => { setAba('register'); setErro('') }}>
                Criar agora
              </button>
            </p>
          )}
          {aba === 'register' && (
            <p className="modal-switch">
              Já tem conta?{' '}
              <button onClick={() => { setAba('login'); setErro('') }}>
                Fazer login
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
