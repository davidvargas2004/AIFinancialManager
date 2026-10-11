import { useCallback, useEffect, useMemo, useState } from 'react'
import useAuthUsuario from './useAuthUsuario'

const API_URL = import.meta.env.VITE_API_URL || ''
const API_KEY = import.meta.env.VITE_API_KEY || ''

async function request(endpoint, token, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-api-key': API_KEY,
      ...(options.headers || {}),
    },
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.message || data?.error || 'No fue posible sincronizar tus inversiones')
  return response.status === 204 ? null : data
}

function normalizeInvestment(inversion) {
  const invertido = Number(inversion.montoInvertido || 0)
  const actual = Number(inversion.valorActual || 0)
  return {
    ...inversion,
    montoInvertido: invertido,
    valorActual: actual,
    rendimiento: actual - invertido,
    rendimientoPct: invertido > 0 ? ((actual - invertido) / invertido) * 100 : 0,
    fechaInicio: inversion.fechaInicio?.slice(0, 10) || '',
    fechaCierre: inversion.fechaCierre?.slice(0, 10) || '',
  }
}

export default function useInversiones() {
  const { token } = useAuthUsuario()
  const [inversiones, setInversiones] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const data = await request('/api/inversiones', token)
      setInversiones(data.map(normalizeInvestment))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { cargar() }, [cargar])

  const crearInversion = useCallback(async (form) => {
    setLoading(true)
    setError('')
    try {
      await request('/api/inversiones', token, {
        method: 'POST',
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          tipo: form.tipo,
          montoInvertido: form.montoInvertido,
          valorActual: form.valorActual,
          estado: form.estado,
          fechaInicio: form.fechaInicio,
          fechaCierre: form.fechaCierre || undefined,
          descripcion: form.descripcion.trim() || undefined,
        }),
      })
      await cargar()
      return true
    } catch (requestError) {
      setError(requestError.message)
      return false
    } finally {
      setLoading(false)
    }
  }, [cargar, token])

  const eliminarInversion = useCallback(async (id) => {
    setLoading(true)
    setError('')
    try {
      await request(`/api/inversiones/${id}`, token, { method: 'DELETE' })
      setInversiones((current) => current.filter((inversion) => inversion.id !== id))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  const resumen = useMemo(() => ({
    invertido: inversiones.reduce((total, inversion) => total + inversion.montoInvertido, 0),
    valorActual: inversiones.reduce((total, inversion) => total + inversion.valorActual, 0),
    rendimiento: inversiones.reduce((total, inversion) => total + inversion.rendimiento, 0),
  }), [inversiones])

  return { inversiones, resumen, loading, error, crearInversion, eliminarInversion, recargar: cargar }
}
