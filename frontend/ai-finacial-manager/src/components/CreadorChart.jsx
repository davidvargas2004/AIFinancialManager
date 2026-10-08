import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const CHART_TEXT_COLOR = '#53615c'

function getCategory(movement) {
  return movement.categoria?.nombre || movement.categoria || 'Sin categoría'
}

function buildCurrentMonthData(movimientos, categorias) {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  const categoryNames = [...new Set([
    ...categorias.map(({ nombre }) => nombre),
    ...movimientos.map(getCategory).filter((name) => name !== 'Sin categoría'),
  ])]

  const data = categoryNames.map((name) => ({ name, ingresos: 0, gastos: 0 }))
  movimientos.forEach((movement) => {
    const date = new Date(movement.fecha || movement.ocurridoEn)
    if (date.getMonth() !== currentMonth || date.getFullYear() !== currentYear) return

    const row = data.find(({ name }) => name === getCategory(movement))
    if (!row) return
    row[movement.tipo === 'ingreso' ? 'ingresos' : 'gastos'] += Number(movement.monto) || 0
  })

  return {
    data,
    month: currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
  }
}

function currency(value) {
  return `$${Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="chart-tooltip">
      {label && <strong>{label}</strong>}
      {payload.map(({ name, value, color }) => (
        <p key={name} style={{ color }}>
          {name}: {currency(value)}
        </p>
      ))}
    </div>
  )
}

function CreadorChart({ movimientos = [], categorias = [] }) {
  const currentMonth = buildCurrentMonthData(movimientos, categorias)
  const hasMovements = movimientos.length > 0

  return (
    <section className="charts-panel" aria-label="Gráficas de movimientos">
      <div className="section-heading">
        <div>
          <p className="eyebrow">ANÁLISIS</p>
          <h2>Tu actividad por categoría</h2>
        </div>
        <span className="sparkle">◒</span>
      </div>

      {!hasMovements ? (
        <p className="empty-state">Agrega movimientos para ver tus gráficas.</p>
      ) : (
        <div className="chart-card monthly-chart-card">
          <div className="chart-title-row">
            <div>
              <h3>Actividad del mes vigente</h3>
              <p className="chart-description">Ingresos y gastos por categoría · {currentMonth.month}</p>
            </div>
            <strong className="chart-total">{currency(currentMonth.data.reduce((total, { ingresos, gastos }) => total + ingresos - gastos, 0))}</strong>
          </div>
          <div className="monthly-chart-scroll">
            {currentMonth.data.length > 0 ? (
              <div className="monthly-chart-container current-month-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentMonth.data} margin={{ top: 12, right: 14, left: 0, bottom: 8 }}>
                    <defs>
                      <pattern id="monthly-pattern-dots" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1" fill="#53615c" fillOpacity=".13" />
                      </pattern>
                    </defs>
                    <rect x="0" y="0" width="100%" height="88%" fill="url(#monthly-pattern-dots)" />
                    <CartesianGrid stroke="#dfe8e1" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: CHART_TEXT_COLOR, fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} tickMargin={10} />
                    <YAxis tick={{ fill: CHART_TEXT_COLOR, fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} width={48} tickFormatter={(value) => `$${value >= 1000 ? `${Math.round(value / 1000)}k` : value}`} />
                    <Tooltip content={<ChartTooltip />} cursor={false} />
                    <Legend wrapperStyle={{ color: CHART_TEXT_COLOR, fontSize: 11, fontWeight: 700, paddingTop: 8 }} />
                    <Bar dataKey="ingresos" name="Ingresos" fill="#8fbd4d" radius={[5, 5, 0, 0]} />
                    <Bar dataKey="gastos" name="Gastos" fill="#ef8865" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="empty-state">No hay categorías configuradas.</p>
            )}
            </div>
        </div>
      )}
    </section>
  )
}

export default CreadorChart
