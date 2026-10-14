import { useState } from 'react'
import './App.css'
import useMovimientos from '../hooks/useMovimientos'
import MovementList from './components/MovementList'
import CreadorChart from './components/CreadorChart'
import useAuthUsuario from '../hooks/useAuthUsuario'
import useCategorias from '../hooks/useCategorias'
import CategoryPicker from './components/CategoryPicker'
import AItoolspanel from './components/AItoolspanel'
import WealthPlanningPanel from './components/WealthPlanningPanel'
import useMetasAhorro from '../hooks/useMetasAhorro'
import useInversiones from '../hooks/useInversiones'
import { formatMoneyInput, parseMoney } from '../utils/numberFormat'
import { localDateInputValue } from '../utils/dateFormat'
import { calculateBalance } from '../utils/balance'
import ThemeToggle from './components/ThemeToggle'

const initialForm = {
  tipo: 'ingreso',
  monto: '',
  descripcion: '',
  categoriaId: '',
  categoria: '',
  fecha: localDateInputValue(),
}

function App() {
  const { usuario: user, logout } = useAuthUsuario()
  const [filter, setFilter] = useState('todos')
  const { movimientos, resumen, pagination, loading, error, agregarMovimiento, eliminarMovimiento, recargar } = useMovimientos({
    tipo: filter === 'todos' ? '' : filter,
  })
  const { resumen: resumenAhorros } = useMetasAhorro()
  const { resumen: resumenInversiones } = useInversiones()
  const { categorias, loading: loadingCategorias, error: categoriasError } = useCategorias()
  const [form, setForm] = useState(initialForm)
  const [categoryType, setCategoryType] = useState(form.tipo)
  const { dineroSinDestino, saldoTotal } = calculateBalance({
    ingresos: resumen.ingresos,
    gastos: resumen.gastos,
    ahorros: resumenAhorros.aportado,
    inversiones: resumenInversiones.invertido,
    valorInversiones: resumenInversiones.valorActual,
  })

  function updateForm(event) {
    const { name, value } = event.target
    if (name === 'monto') {
      setForm((current) => ({ ...current, monto: formatMoneyInput(value) }))
      return
    }
    if (name === 'categoriaId') {
      const category = categorias.find(({ id }) => id === value)
      setForm((current) => ({ ...current, categoriaId: value, categoria: category?.nombre || '' }))
      return
    }
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    const categoria = categorias.find(({ id }) => id === form.categoriaId) || categorias[0]
    const movementForm = {
      ...form,
      monto: parseMoney(form.monto),
      categoriaId: categoria?.id || '',
      categoria: categoria?.nombre || '',
    }
    if (!movementForm.monto || movementForm.monto <= 0 || !movementForm.descripcion.trim() || !movementForm.categoriaId) return
    await agregarMovimiento(movementForm)
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
        <ThemeToggle />
        <button className="avatar" type="button" aria-label="Cerrar sesión" onClick={logout}>
          {user.nombre?.slice(0, 2).toUpperCase() || user.email.slice(0, 2).toUpperCase()}
        </button>
      </header>

      <section className="balance-card">
        <div>
          <p className="eyebrow light">SALDO TOTAL</p>
          <p className="balance">${saldoTotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</p>
          <span className="balance-caption">Incluye balance, ahorros e inversiones</span>
        </div>
        <div className="balance-orbit" aria-hidden="true"><span>✦</span></div>
      </section>

      <section className="summary-grid" aria-label="Resumen financiero">
        <div className="summary-item income"><span>↗</span><small>Ingresos</small><strong>${resumen.ingresos.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</strong></div>
        <div className="summary-item expense"><span>↘</span><small>Gastos</small><strong>${resumen.gastos.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</strong></div>
        <div className="summary-item available"><span>◎</span><small>Balance disponible</small><strong>${dineroSinDestino.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</strong></div>
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
                <button key={type} className={form.tipo === type ? 'active' : ''} type="button" onClick={() => {
                  setForm((current) => ({ ...current, tipo: type, categoriaId: '', categoria: '' }))
                  setCategoryType(type)
                }}>
                  {type === 'ingreso' ? '↗  Ingreso' : '↘  Gasto'}
                </button>
              ))}
            </div>
            <label>Monto
              <div className="money-input"><span>$</span><input name="monto" type="text" inputMode="decimal" placeholder="0" value={form.monto} onChange={updateForm} required /></div>
            </label>
            <label>Descripción
              <input name="descripcion" type="text" maxLength="500" placeholder="¿En qué fue este movimiento?" value={form.descripcion} onChange={updateForm} required />
            </label>
            <div className="form-row">
              <label>Categoría
                <CategoryPicker
                  categories={categorias}
                  type={categoryType}
                  value={form.categoriaId}
                  disabled={loadingCategorias || !categorias.length}
                  onChange={(category) => setForm((current) => ({
                    ...current,
                    categoriaId: category.id,
                    categoria: category.nombre,
                  }))}
                />
              </label>
              <label>Fecha
                <input name="fecha" type="date" value={form.fecha} onChange={updateForm} required />
              </label>
            </div>
            {(error || categoriasError) && <p className="form-error">{error || categoriasError}</p>}
            <button className={`primary-button ${form.tipo}`} type="submit" disabled={loading || loadingCategorias || !categorias.length}>
              {loading ? 'Guardando...' : `Guardar ${form.tipo}`}
              <span>→</span>
            </button>
          </form>
        </div>

        <div className="history-panel">
          <div className="section-heading">
            <div><p className="eyebrow">HISTORIAL</p><h2>Últimos movimientos</h2></div>
            <span className="movement-count">{pagination.total}</span>
          </div>
          <div className="filter-tabs">
            {['todos', 'ingreso', 'gasto'].map((item) => <button key={item} className={filter === item ? 'active' : ''} type="button" onClick={() => {
              setFilter(item)
            }}>{item === 'todos' ? 'Todos' : `${item[0].toUpperCase()}${item.slice(1)}s`}</button>)}
          </div>
          <MovementList movimientos={movimientos} onDelete={eliminarMovimiento} />
          {pagination.totalPages > 1 && (
            <div className="pagination-controls" aria-label="Paginación del historial">
              <button className="pagination-button" type="button" onClick={() => recargar(pagination.page - 1)} disabled={!pagination.hasPrevious} aria-label="Ir a la página anterior">
                <span aria-hidden="true">←</span> Anterior
              </button>
              <span className="pagination-status">Página <strong>{pagination.page}</strong> de <strong>{pagination.totalPages}</strong></span>
              <button className="pagination-button" type="button" onClick={() => recargar(pagination.page + 1)} disabled={!pagination.hasNext} aria-label="Ir a la página siguiente">
                Siguiente <span aria-hidden="true">→</span>
              </button>
            </div>
          )}
        </div>
      </section>

      <CreadorChart movimientos={movimientos} categorias={categorias} />
      <WealthPlanningPanel balanceDisponible={dineroSinDestino} saldoTotal={saldoTotal} />
      <AItoolspanel onMovementRegistered={recargar} />
    </main>
  )
}

export default App
