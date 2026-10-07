import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const COLORS = ['#244b35', '#8fbd4d', '#ef8865', '#5c8d9e', '#b98a44', '#8f6bb3', '#d15f87']

function getCategory(movement) {
  return movement.categoria?.nombre || movement.categoria || 'Sin categoría'
}

function buildChartData(movimientos) {
  return movimientos.reduce((categories, movement) => {
    const name = getCategory(movement)
    const current = categories.get(name) || { name, ingresos: 0, gastos: 0 }
    const amount = Number(movement.monto) || 0

    if (movement.tipo === 'ingreso') current.ingresos += amount
    if (movement.tipo === 'gasto') current.gastos += amount
    categories.set(name, current)
    return categories
  }, new Map())
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

function CreadorChart({ movimientos = [] }) {
  const groupedData = [...buildChartData(movimientos).values()]
  const expenseData = groupedData
    .filter(({ gastos }) => gastos > 0)
    .map(({ name, gastos }) => ({ name, value: gastos }))

  return (
    <section className="charts-panel" aria-label="Gráficas de movimientos">
      <div className="section-heading">
        <div>
          <p className="eyebrow">ANÁLISIS</p>
          <h2>Tu actividad por categoría</h2>
        </div>
        <span className="sparkle">◒</span>
      </div>

      {groupedData.length === 0 ? (
        <p className="empty-state">Agrega movimientos para ver tus gráficas.</p>
      ) : (
        <div className="charts-grid">
          <div className="chart-card">
            <h3>Gastos por categoría</h3>
            <div className="chart-container">
              {expenseData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="55%"
                      outerRadius="78%"
                      paddingAngle={3}
                    >
                      {expenseData.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="empty-state">Todavía no hay gastos registrados.</p>
              )}
            </div>
          </div>

          <div className="chart-card">
            <h3>Ingresos y gastos</h3>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupedData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke="#e6ebe7" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#8a9490', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8a9490', fontSize: 10 }} axisLine={false} tickLine={false} width={42} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend />
                  <Bar dataKey="ingresos" name="Ingresos" fill="#8fbd4d" radius={[5, 5, 0, 0]} />
                  <Bar dataKey="gastos" name="Gastos" fill="#ef8865" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default CreadorChart
