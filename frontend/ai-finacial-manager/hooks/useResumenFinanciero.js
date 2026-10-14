import { useCallback, useEffect, useState } from 'react'
import useAuthUsuario from './useAuthUsuario'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '').replace(/\/api$/, '')

export default function useResumenFinanciero(refreshKey = 0) {
  const { token } = useAuthUsuario()
  const [resumen, setResumen] = useState({
    ingresos: 0, gastos: 0, balance: 0, aportes: 0,
    capitalInvertido: 0, valorInversiones: 0, disponible: 0, capitalReal: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/api/resumen-financiero`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message || data.error || 'No fue posible cargar el balance')
      setResumen(data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { cargar() }, [cargar, refreshKey])

  return { resumen, loading, error, recargar: cargar }
}
