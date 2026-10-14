import { useCallback, useEffect, useMemo, useState } from 'react'
import AuthContext from './authContextValue'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '').replace(/\/api$/, '')
const API_KEY = import.meta.env.VITE_API_KEY || ''
const TOKEN_KEY = 'supabase_access_token'
const USER_KEY = 'finance_user'

function readUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [usuario, setUsuario] = useState(readUser)
  const [authAlert, setAuthAlert] = useState('')

  const authenticate = useCallback(async (mode, credentials) => {
    const response = await fetch(`${API_URL}/api/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify(credentials),
    })
    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.message || 'No fue posible autenticarte')
    }

    if (data.session?.access_token && data.usuario) {
      localStorage.setItem(TOKEN_KEY, data.session.access_token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.usuario))
      setToken(data.session.access_token)
      setUsuario(data.usuario)
    }

    return data
  }, [])

  const login = useCallback((credentials) => authenticate('login', credentials), [authenticate])
  const register = useCallback((credentials) => authenticate('register', credentials), [authenticate])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUsuario(null)
  }, [])

  useEffect(() => {
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const response = await originalFetch(...args)
      const requestUrl = typeof args[0] === 'string' ? args[0] : args[0]?.url || ''
      if (response.status === 401 && !requestUrl.includes('/api/auth/')) {
        window.dispatchEvent(new CustomEvent('auth:expired'))
      }
      return response
    }

    function handleExpiredToken() {
      logout()
      setAuthAlert('Token de autenticación inválido o expirado. Inicia sesión nuevamente para continuar.')
    }

    window.addEventListener('auth:expired', handleExpiredToken)
    return () => {
      window.fetch = originalFetch
      window.removeEventListener('auth:expired', handleExpiredToken)
    }
  }, [logout])

  useEffect(() => {
    if (!authAlert) return undefined
    const timeout = window.setTimeout(() => setAuthAlert(''), 7000)
    return () => window.clearTimeout(timeout)
  }, [authAlert])

  const value = useMemo(() => ({
    token,
    usuario,
    isAuthenticated: Boolean(token && usuario),
    login,
    register,
    logout,
  }), [token, usuario, login, register, logout])

  return (
    <AuthContext.Provider value={value}>
      {authAlert && (
        <div className="auth-alert" role="alert">
          <strong>Sesión finalizada</strong>
          <span>{authAlert}</span>
          <button type="button" aria-label="Cerrar alerta" onClick={() => setAuthAlert('')}>×</button>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  )
}
