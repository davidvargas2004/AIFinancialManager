import { useCallback, useEffect, useMemo, useState } from 'react'
import useAuthUsuario from './useAuthUsuario'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '').replace(/\/api$/, '')
const API_KEY = import.meta.env.VITE_API_KEY || ''

function normalizeMovement(item, tipo) {
  return {
    ...item,
    tipo,
    monto: Number(item.monto),
    fecha: item.fecha || item.ocurridoEn,
    categoria: item.categoria?.nombre || item.categoria || 'Sin categoría',
  }
}

export default function useMovimientos({ tipo = '' } = {}) {
  const { token } = useAuthUsuario()
  const [movimientos, setMovimientos] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 5, total: 0, totalPages: 0, hasNext: false, hasPrevious: false })
  const [resumenRemoto, setResumenRemoto] = useState({ ingresos: 0, gastos: 0, balance: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchPage = useCallback(async (page, signal) => {
    if (!token) return
    const params = new URLSearchParams({ page: String(page), pageSize: '5' })
    if (tipo) params.set('tipo', tipo)
    const response = await fetch(`${API_URL}/api/movimientos?${params}`, {
      signal,
      headers: { Authorization: `Bearer ${token}`, 'x-api-key': API_KEY },
    })
    if (!response.ok) throw new Error('No fue posible cargar tus movimientos')
    const data = await response.json()
    if (!data || !Array.isArray(data.items)) {
      throw new Error('La respuesta del historial no tiene un formato válido')
    }
    setMovimientos(data.items.map((item) => normalizeMovement(item, item.tipo)))
    setPagination({
      page: Number(data.page) || page,
      pageSize: Number(data.pageSize) || 5,
      total: Number(data.total) || 0,
      totalPages: Number(data.totalPages) || 0,
      hasNext: Boolean(data.hasNext),
      hasPrevious: Boolean(data.hasPrevious),
    })
    setResumenRemoto(data.resumen || { ingresos: 0, gastos: 0, balance: 0 })
  }, [tipo, token])

  useEffect(() => {
    if (!token) return
    setError('')
    const controller = new AbortController()
    setLoading(true)
    fetchPage(currentPage, controller.signal)
      .catch((requestError) => {
        if (requestError.name !== 'AbortError') setError(requestError.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [currentPage, fetchPage, token])

  useEffect(() => {
    setCurrentPage(1)
  }, [tipo])

  const recargar = useCallback((page = currentPage) => {
    setCurrentPage(Math.max(page, 1))
  }, [currentPage])

  const request = useCallback(async (tipoMovimiento, options = {}) => {
    if (!token) return null
    const response = await fetch(
      `${API_URL}/api/${tipoMovimiento === 'ingreso' ? 'ingresos' : 'gastos'}${options.id ? `/${options.id}` : ''}`,
      {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-api-key': API_KEY,
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
    setError('')
    setLoading(true)
    try {
      await request(form.tipo, {
        method: 'POST',
        body: {
          tipo: form.tipo,
          categoriaId: form.categoriaId,
          monto: form.monto,
          descripcion: form.descripcion.trim(),
          ocurridoEn: form.fecha,
        },
      })
      setCurrentPage(1)
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
      setCurrentPage((page) => Math.max(page, 1))
    } catch (requestError) {
      setError(requestError.message)
    }
  }, [request])

  const resumen = useMemo(() => resumenRemoto, [resumenRemoto])

  return { movimientos, resumen, pagination, loading, error, agregarMovimiento, eliminarMovimiento, recargar }
}
