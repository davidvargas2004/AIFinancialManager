import { useState } from 'react'
import './App.css'
import useMovimientos from '../hooks/useMovimientos'
import MovementList from './components/MovementList'

const categories = [
  { id: 'demo-work', label: 'Trabajo', icon: '◈' },
  { id: 'demo-food', label: 'Alimentación', icon: '◌' },
  { id: 'demo-home', label: 'Hogar', icon: '⌂' },
  { id: 'demo-leisure', label: 'Ocio', icon: '✦' },
]

const initialForm = {
  tipo: 'ingreso',
  monto: '',
  descripcion: '',
  categoriaId: categories[0].id,
  categoria: categories[0].label,
  fecha: new Date().toISOString().slice(0, 10),
}

function App() {
  const { movimientos, resumen, loading, error, agregarMovimiento, eliminarMovimiento } = useMovimientos()
  const [form, setForm] = useState(initialForm)
  const [filter, setFilter] = useState('todos')

  const visibleMovimientos = filter === 'todos'
    ? movimientos
    : movimientos.filter(({ tipo }) => tipo === filter)

  function updateForm(event) {
    const { name, value } = event.target
    if (name === 'categoriaId') {
      const category = categories.find(({ id }) => id === value)
      setForm((current) => ({ ...current, categoriaId: value, categoria: category.label }))
      return
    }
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    if (!form.monto || Number(form.monto) <= 0 || !form.descripcion.trim()) return
    await agregarMovimiento(form)
    setForm((current) => ({ ...initialForm, tipo: current.tipo }))
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-mark">AF</div>
        <div>
          <p className="eyebrow">PERSONAL FINANCE</p>
          <h1>Mi dinero<span>.</span></h1>
        </div>
        <button className="avatar" type="button" aria-label="Perfil">JD</button>
      </header>

      <section className="balance-card">
        <div>
          <p className="eyebrow light">BALANCE DISPONIBLE</p>
          <p className="balance">${resumen.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          <span className="balance-caption">Actualizado hace un momento <b>↗ 8.4%</b></span>
        </div>
        <div className="balance-orbit" aria-hidden="true"><span>✦</span></div>
      </section>

      <section className="summary-grid" aria-label="Resumen financiero">
        <div className="summary-item income"><span>↗</span><small>Ingresos</small><strong>${resumen.ingresos.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></div>
        <div className="summary-item expense"><span>↘</span><small>Gastos</small><strong>${resumen.gastos.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></div>
      </section>

      <section className="content-grid">
        <div className="form-panel">
          <div className="section-heading">
            <div><p className="eyebrow">NUEVO MOVIMIENTO</p><h2>Registra tu actividad</h2></div>
            <span className="sparkle">✦</span>
          </div>
          <form onSubmit={submit}>
            <div className="segmented-control">
              {['ingreso', 'gasto'].map((type) => (
                <button key={type} className={form.tipo === type ? 'active' : ''} type="button" onClick={() => setForm((current) => ({ ...current, tipo: type }))}>
                  {type === 'ingreso' ? '↗  Ingreso' : '↘  Gasto'}
                </button>
              ))}
            </div>
            <label>Monto
              <div className="money-input"><span>$</span><input name="monto" type="number" min="0.01" step="0.01" placeholder="0.00" value={form.monto} onChange={updateForm} required /></div>
            </label>
            <label>Descripción
              <input name="descripcion" type="text" maxLength="500" placeholder="¿En qué fue este movimiento?" value={form.descripcion} onChange={updateForm} required />
            </label>
            <div className="form-row">
              <label>Categoría
                <select name="categoriaId" value={form.categoriaId} onChange={updateForm}>
                  {categories.map((category) => <option key={category.id} value={category.id}>{category.icon} {category.label}</option>)}
                </select>
              </label>
              <label>Fecha
                <input name="fecha" type="date" value={form.fecha} onChange={updateForm} required />
              </label>
            </div>
            {error && <p className="form-error">{error}</p>}
            <button className={`primary-button ${form.tipo}`} type="submit" disabled={loading}>
              {loading ? 'Guardando...' : `Guardar ${form.tipo}`}
              <span>→</span>
            </button>
          </form>
        </div>

        <div className="history-panel">
          <div className="section-heading">
            <div><p className="eyebrow">HISTORIAL</p><h2>Últimos movimientos</h2></div>
            <span className="movement-count">{visibleMovimientos.length}</span>
          </div>
          <div className="filter-tabs">
            {['todos', 'ingreso', 'gasto'].map((item) => <button key={item} className={filter === item ? 'active' : ''} type="button" onClick={() => setFilter(item)}>{item === 'todos' ? 'Todos' : `${item[0].toUpperCase()}${item.slice(1)}s`}</button>)}
          </div>
          <MovementList movimientos={visibleMovimientos} onDelete={eliminarMovimiento} />
        </div>
      </section>
    </main>
  )
}

export default App
