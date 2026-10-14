export function calculateBalance({ ingresos = 0, gastos = 0, ahorros = 0, inversiones = 0, valorInversiones = 0 }) {
  const balance = Number(ingresos) - Number(gastos)
  const dineroSinDestino = Math.max(balance - Number(ahorros) - Number(inversiones), 0)
  return {
    balance,
    dineroSinDestino,
    saldoTotal: dineroSinDestino + Number(ahorros) + Number(valorInversiones),
  }
}
