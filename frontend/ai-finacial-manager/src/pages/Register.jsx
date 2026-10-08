import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import useAuthUsuario from '../../hooks/useAuthUsuario'

function Register() {
  const { isAuthenticated, register } = useAuthUsuario()
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  if (isAuthenticated) return <Navigate to="/" replace />

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setNotice('')
    try {
      const data = await register(form)
      if (data.session?.access_token) navigate('/', { replace: true })
      else setNotice('Revisa tu correo para confirmar la cuenta y luego inicia sesión.')
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
        <h1>Empieza a construir tu libertad.</h1>
        <p className="auth-copy">Crea tu cuenta y organiza tus finanzas.</p>
        <form onSubmit={submit} className="auth-form">
          <label>Nombre
            <input name="nombre" value={form.nombre} onChange={update} placeholder="Tu nombre" required />
          </label>
          <label>Correo electrónico
            <input name="email" type="email" value={form.email} onChange={update} placeholder="tu@email.com" required />
          </label>
          <label>Contraseña
            <input name="password" type="password" minLength="6" value={form.password} onChange={update} placeholder="Mínimo 6 caracteres" required />
          </label>
          {error && <p className="form-error">{error}</p>}
          {notice && <p className="form-notice">{notice}</p>}
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? 'Creando...' : 'Crear cuenta'}<span>→</span>
          </button>
        </form>
        <p className="auth-link">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
      </section>
    </main>
  )
}

export default Register
