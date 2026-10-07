import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || ''

function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ email: '', password: '', nombre: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch(`${API_URL}/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || data.error || 'No fue posible autenticarte')
      if (!data.session?.access_token) {
        setNotice('Revisa tu correo para confirmar la cuenta y luego inicia sesión.')
        return
      }
      localStorage.setItem('supabase_access_token', data.session.access_token)
      onAuthenticated(data.usuario)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="brand-mark">AF</div>
        <p className="eyebrow">PERSONAL FINANCE</p>
        <h1>{mode === 'login' ? 'Tu dinero, bajo control.' : 'Empieza a construir tu libertad.'}</h1>
        <p className="auth-copy">{mode === 'login' ? 'Inicia sesión para ver tus movimientos.' : 'Crea tu cuenta y organiza tus finanzas.'}</p>
        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && <label>Nombre<input name="nombre" value={form.nombre} onChange={update} placeholder="Tu nombre" required /></label>}
          <label>Correo electrónico<input name="email" type="email" value={form.email} onChange={update} placeholder="tu@email.com" required /></label>
          <label>Contraseña<input name="password" type="password" minLength="6" value={form.password} onChange={update} placeholder="Mínimo 6 caracteres" required /></label>
          {error && <p className="form-error">{error}</p>}
          {notice && <p className="form-notice">{notice}</p>}
          <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Conectando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}<span>→</span></button>
        </form>
        <button className="auth-switch" type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setNotice('') }}>
          {mode === 'login' ? '¿Aún no tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </section>
    </main>
  )
}

export default AuthPage
