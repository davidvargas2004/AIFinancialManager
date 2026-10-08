import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import useAuthUsuario from '../../hooks/useAuthUsuario'

function Login() {
  const { isAuthenticated, login } = useAuthUsuario()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (isAuthenticated) return <Navigate to="/" replace />

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(form)
      const destination = location.state?.from?.pathname || '/'
      navigate(destination, { replace: true })
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
        <h1>Tu dinero, bajo control.</h1>
        <p className="auth-copy">Inicia sesión para ver tus movimientos.</p>
        <form onSubmit={submit} className="auth-form">
          <label>Correo electrónico
            <input name="email" type="email" value={form.email} onChange={update} placeholder="tu@email.com" required />
          </label>
          <label>Contraseña
            <input name="password" type="password" minLength="6" value={form.password} onChange={update} placeholder="Mínimo 6 caracteres" required />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Conectando...' : 'Entrar'}<span>→</span>
          </button>
        </form>
        <p className="auth-link">¿Aún no tienes cuenta? <Link to="/register">Regístrate</Link></p>
      </section>
    </main>
  )
}

export default Login
