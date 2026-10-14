import { useState } from 'react'
import useMetasAhorro from '../../hooks/useMetasAhorro'
import useInversiones from '../../hooks/useInversiones'
import { formatMoneyInput, parseMoney } from '../../utils/numberFormat'
import { localDateInputValue } from '../../utils/dateFormat'

const currency = (value) => `$${Number(value).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const today = localDateInputValue()

const initialGoal = { nombre: '', descripcion: '', montoObjetivo: '', fechaObjetivo: '' }
const initialInvestment = {
  nombre: '', tipo: 'FONDOS', montoInvertido: '', valorActual: '', estado: 'ACTIVA', fechaInicio: today, fechaCierre: '', descripcion: '',
}

function Metric({ label, value, tone = '' }) {
  return <div className="wealth-metric"><span>{label}</span><strong className={tone}>{value}</strong></div>
}

function GoalCard({ meta, onAddContribution, onDelete }) {
  const [showContribution, setShowContribution] = useState(false)
  const [contribution, setContribution] = useState({ monto: '', descripcion: '', ocurridoEn: today })
  const remaining = Math.max(meta.montoObjetivo - meta.aportado, 0)

  async function submitContribution(event) {
    event.preventDefault()
    const monto = parseMoney(contribution.monto)
    if (!monto || monto <= 0) return
    const saved = await onAddContribution(meta.id, { ...contribution, monto })
    if (saved) {
      setContribution({ monto: '', descripcion: '', ocurridoEn: today })
      setShowContribution(false)
    }
  }

  return (
    <article className="goal-card">
      <div className="wealth-card-top">
        <div className="wealth-icon goal-icon">◎</div>
        <div className="wealth-card-title"><strong>{meta.nombre}</strong><span>{meta.fechaObjetivo ? `Objetivo · ${meta.fechaObjetivo}` : 'Sin fecha objetivo'}</span></div>
        <button className="wealth-delete" type="button" aria-label={`Eliminar meta ${meta.nombre}`} onClick={() => onDelete(meta.id)}>×</button>
      </div>
      <div className="goal-amounts"><strong>{currency(meta.aportado)}</strong><span>de {currency(meta.montoObjetivo)}</span><b>{meta.progreso.toFixed(0)}%</b></div>
      <div className="goal-progress"><span style={{ width: `${meta.progreso}%` }} /></div>
      <p className="goal-remaining">{remaining > 0 ? `Faltan ${currency(remaining)} para completar esta meta` : 'Meta completada. Excelente disciplina financiera.'}</p>
      {showContribution ? (
        <form className="inline-contribution" onSubmit={submitContribution}>
          <input type="text" inputMode="decimal" placeholder="Monto del aporte" value={contribution.monto} onChange={(event) => setContribution({ ...contribution, monto: formatMoneyInput(event.target.value) })} required />
          <input type="date" value={contribution.ocurridoEn} onChange={(event) => setContribution({ ...contribution, ocurridoEn: event.target.value })} required />
          <input type="text" placeholder="Nota opcional" value={contribution.descripcion} onChange={(event) => setContribution({ ...contribution, descripcion: event.target.value })} />
          <div><button className="wealth-secondary" type="button" onClick={() => setShowContribution(false)}>Cancelar</button><button className="wealth-primary small" type="submit">Guardar aporte</button></div>
        </form>
      ) : (
        <button className="wealth-secondary full" type="button" onClick={() => setShowContribution(true)}>+ Registrar aporte</button>
      )}
    </article>
  )
}

function GoalForm({ onSubmit, loading }) {
  const [form, setForm] = useState(initialGoal)
  async function submit(event) {
    event.preventDefault()
    const montoObjetivo = parseMoney(form.montoObjetivo)
    if (!form.nombre.trim() || !montoObjetivo || montoObjetivo <= 0) return
    if (await onSubmit({ ...form, montoObjetivo })) setForm(initialGoal)
  }
  return (
    <form className="wealth-form" onSubmit={submit}>
      <div className="form-grid"><label>Nombre de la meta<input value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} placeholder="Ej. Fondo de emergencia" maxLength={120} required /></label><label>Objetivo financiero<input type="text" inputMode="decimal" value={form.montoObjetivo} onChange={(event) => setForm({ ...form, montoObjetivo: formatMoneyInput(event.target.value) })} placeholder="0" required /></label></div>
      <div className="form-grid"><label>Fecha objetivo<input type="date" value={form.fechaObjetivo} onChange={(event) => setForm({ ...form, fechaObjetivo: event.target.value })} /></label><label>Descripción<input value={form.descripcion} onChange={(event) => setForm({ ...form, descripcion: event.target.value })} placeholder="¿Para qué estás ahorrando?" maxLength={500} /></label></div>
      <button className="wealth-primary" type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Crear meta de ahorro'} <span>→</span></button>
    </form>
  )
}

function InvestmentForm({ onSubmit, loading }) {
  const [form, setForm] = useState(initialInvestment)
  async function submit(event) {
    event.preventDefault()
    const montoInvertido = parseMoney(form.montoInvertido)
    const valorActual = parseMoney(form.valorActual)
    if (!form.nombre.trim() || !montoInvertido || montoInvertido <= 0 || Number.isNaN(valorActual) || valorActual < 0) return
    if (await onSubmit({ ...form, montoInvertido, valorActual })) setForm({ ...initialInvestment, fechaInicio: today })
  }
  return (
    <form className="wealth-form" onSubmit={submit}>
      <div className="form-grid"><label>Activo o vehículo<input value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} placeholder="Ej. ETF S&P 500" maxLength={120} required /></label><label>Tipo<select value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value })}>{['ACCIONES', 'BONOS', 'FONDOS', 'CRIPTOMONEDAS', 'INMUEBLES', 'OTRO'].map((tipo) => <option key={tipo} value={tipo}>{tipo[0] + tipo.slice(1).toLowerCase()}</option>)}</select></label></div>
      <div className="form-grid"><label>Capital invertido<input type="text" inputMode="decimal" value={form.montoInvertido} onChange={(event) => setForm({ ...form, montoInvertido: formatMoneyInput(event.target.value) })} placeholder="0" required /></label><label>Valor actual<input type="text" inputMode="decimal" value={form.valorActual} onChange={(event) => setForm({ ...form, valorActual: formatMoneyInput(event.target.value) })} placeholder="0" required /></label></div>
      <div className="form-grid"><label>Fecha de inicio<input type="date" value={form.fechaInicio} onChange={(event) => setForm({ ...form, fechaInicio: event.target.value })} required /></label><label>Estado<select value={form.estado} onChange={(event) => setForm({ ...form, estado: event.target.value })}><option value="ACTIVA">Activa</option><option value="PAUSADA">Pausada</option><option value="CERRADA">Cerrada</option></select></label></div>
      <label>Descripción<input value={form.descripcion} onChange={(event) => setForm({ ...form, descripcion: event.target.value })} placeholder="Estrategia, broker o nota de seguimiento" maxLength={500} /></label>
      <button className="wealth-primary" type="submit" disabled={loading}>{loading ? 'Guardando...' : 'Añadir inversión'} <span>→</span></button>
    </form>
  )
}

function WealthPlanningPanel({ balanceDisponible = 0, saldoTotal = 0 }) {
  const goals = useMetasAhorro()
  const investments = useInversiones()
  const [tab, setTab] = useState('metas')
  const capitalReal = Number(saldoTotal)

  return (
    <section className="wealth-panel" aria-labelledby="wealth-title">
      <div className="wealth-hero">
        <div><p className="eyebrow light">PLANIFICACIÓN PATRIMONIAL</p><h2 id="wealth-title">Construye tu libertad financiera<span>.</span></h2><p>Separa tu dinero disponible de tus ahorros e inversiones para conocer tu capital real.</p></div>
        <div className="wealth-hero-orbit"><span>✦</span></div>
      </div>
      <div className="wealth-metrics"><Metric label="Capital real" value={currency(capitalReal)} tone="capital-total" /><Metric label="Ahorros acumulados" value={currency(goals.resumen.aportado)} /><Metric label="Inversiones actuales" value={currency(investments.resumen.valorActual)} /><Metric label="Balance disponible" value={currency(balanceDisponible)} tone={balanceDisponible > 0 ? 'positive' : ''} /></div>
      <div className="wealth-tabs"><button className={tab === 'metas' ? 'active' : ''} type="button" onClick={() => setTab('metas')}>Metas de ahorro <b>{goals.metas.length}</b></button><button className={tab === 'inversiones' ? 'active' : ''} type="button" onClick={() => setTab('inversiones')}>Portafolio <b>{investments.inversiones.length}</b></button></div>
      {goals.error && <p className="form-error">{goals.error}</p>}
      {investments.error && <p className="form-error">{investments.error}</p>}
      {tab === 'metas' ? (
        <div className="wealth-content"><GoalForm onSubmit={goals.crearMeta} loading={goals.loading} /><div className="wealth-list">{goals.metas.length ? goals.metas.map((meta) => <GoalCard key={meta.id} meta={meta} onAddContribution={goals.agregarAporte} onDelete={goals.eliminarMeta} />) : <div className="wealth-empty">Crea tu primera meta y empieza a medir tu avance.</div>}</div></div>
      ) : (
        <div className="wealth-content"><InvestmentForm onSubmit={investments.crearInversion} loading={investments.loading} /><div className="wealth-list">{investments.inversiones.length ? investments.inversiones.map((inversion) => <article className="investment-card" key={inversion.id}><div className="wealth-card-top"><div className="wealth-icon investment-icon">↗</div><div className="wealth-card-title"><strong>{inversion.nombre}</strong><span>{inversion.tipo} · {inversion.estado}</span></div><button className="wealth-delete" type="button" aria-label={`Eliminar inversión ${inversion.nombre}`} onClick={() => investments.eliminarInversion(inversion.id)}>×</button></div><div className="investment-values"><div><span>Valor actual</span><strong>{currency(inversion.valorActual)}</strong></div><div><span>Capital inicial</span><strong>{currency(inversion.montoInvertido)}</strong></div><div><span>Rendimiento</span><strong className={inversion.rendimiento >= 0 ? 'positive' : 'negative'}>{inversion.rendimiento >= 0 ? '+' : ''}{currency(inversion.rendimiento)} <small>({inversion.rendimientoPct.toFixed(2)}%)</small></strong></div></div></article>) : <div className="wealth-empty">Registra una inversión para comenzar a visualizar tu portafolio.</div>}</div></div>
      )}
    </section>
  )
}

export default WealthPlanningPanel
