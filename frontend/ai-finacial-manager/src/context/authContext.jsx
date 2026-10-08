import { useCallback, useMemo, useState } from 'react'
import AuthContext from './authContextValue'

const API_URL = import.meta.env.VITE_API_URL || ''
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

  const authenticate = useCallback(async (mode, credentials) => {
    const response = await fetch(`${API_URL}/api/auth/${mode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

  const value = useMemo(() => ({
    token,
    usuario,
    isAuthenticated: Boolean(token && usuario),
    login,
    register,
    logout,
  }), [token, usuario, login, register, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
