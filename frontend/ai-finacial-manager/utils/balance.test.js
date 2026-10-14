import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateBalance } from './balance.js'

test('calcula el disponible y el saldo total con ahorros e inversiones', () => {
    assert.deepEqual(calculateBalance({
      ingresos: 5000,
      gastos: 1200,
      ahorros: 800,
      inversiones: 1000,
      valorInversiones: 1100,
    }), {
      balance: 3800,
      dineroSinDestino: 2000,
      saldoTotal: 3900,
    })
})

test('no permite un disponible negativo', () => {
    assert.equal(calculateBalance({
      ingresos: 500,
      gastos: 1000,
      ahorros: 100,
      inversiones: 50,
      valorInversiones: 40,
    }).dineroSinDestino, 0)
})
