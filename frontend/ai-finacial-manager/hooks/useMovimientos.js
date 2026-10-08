import { useCallback, useEffect, useMemo, useState } from 'react'
import useAuthUsuario from './useAuthUsuario'

const API_URL = import.meta.env.VITE_API_URL || ''

const demoMovimientos = [
  {
    id: 'demo-income',
    tipo: 'ingreso',
    monto: 3200,
    descripcion: 'Salario mensual',
    categoria: 'Trabajo',
    categoriaId: 'demo-work',
    fecha: '2026-10-01',
  },
  {
    id: 'demo-expense',
    tipo: 'gasto',
    monto: 86.4,
    descripcion: 'Compra semanal',
    categoria: 'Alimentación',
    categoriaId: 'demo-food',
    fecha: '2026-10-04',
  },
]

function normalizeMovement(item, tipo) {
  return {
    ...item,
    tipo,
    monto: Number(item.monto),
    fecha: item.fecha || item.ocurridoEn,
    categoria: item.categoria?.nombre || item.categoria || 'Sin categoría',
  }
}

export default function useMovimientos() {
  const { token } = useAuthUsuario()
  const [movimientos, setMovimientos] = useState(demoMovimientos)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return

    fetch(`${API_URL}/api/movimientos`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) throw new Error('No fue posible cargar tus movimientos')
        return response.json()
      })
      .then((items) => setMovimientos(items.map((item) => normalizeMovement(item, item.tipo))))
      .catch((requestError) => setError(requestError.message))
  }, [token])

  const request = useCallback(async (tipo, options = {}) => {
    if (!token) return null

    const response = await fetch(
      `${API_URL}/api/${tipo === 'ingreso' ? 'ingresos' : 'gastos'}${options.id ? `/${options.id}` : ''}`,
      {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
      },
    )

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.message || data.error || 'No fue posible sincronizar el movimiento')
    }

    return response.status === 204 ? null : response.json()
  }, [token])

  const agregarMovimiento = useCallback(async (form) => {
    const movement = {
      id: crypto.randomUUID(),
      tipo: form.tipo,
      monto: Number(form.monto),
      descripcion: form.descripcion.trim(),
      categoria: form.categoria,
      categoriaId: form.categoriaId,
      fecha: form.fecha,
    }

    setError('')
    setLoading(true)
    try {
      const remote = await request(form.tipo, {
        method: 'POST',
        body: {
          tipo: form.tipo,
          categoriaId: form.categoriaId,
          monto: form.monto,
          descripcion: form.descripcion.trim(),
          ocurridoEn: form.fecha,
        },
      })
      setMovimientos((current) => [normalizeMovement(remote || movement, form.tipo), ...current])
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [request])

  const eliminarMovimiento = useCallback(async (movement) => {
    setError('')
    try {
      await request(movement.tipo, { method: 'DELETE', id: movement.id })
      setMovimientos((current) => current.filter((item) => item.id !== movement.id))
    } catch (requestError) {
      setError(requestError.message)
    }
  }, [request])

  const resumen = useMemo(() => {
    const ingresos = movimientos
      .filter(({ tipo }) => tipo === 'ingreso')
      .reduce((total, { monto }) => total + monto, 0)
    const gastos = movimientos
      .filter(({ tipo }) => tipo === 'gasto')
      .reduce((total, { monto }) => total + monto, 0)
    return { ingresos, gastos, balance: ingresos - gastos }
  }, [movimientos])

  return { movimientos, resumen, loading, error, agregarMovimiento, eliminarMovimiento }
}
