import { useCallback, useEffect, useMemo, useState } from 'react'
import useAuthUsuario from './useAuthUsuario'

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '').replace(/\/api$/, '')

function headers(token) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }
}

function normalizeGoal(goal, aportes) {
  const goalAportes = aportes.filter((aporte) => aporte.metaId === goal.id)
  const aportado = goalAportes.reduce((total, aporte) => total + Number(aporte.monto || 0), 0)
  const objetivo = Number(goal.montoObjetivo || 0)

  return {
    ...goal,
    montoObjetivo: objetivo,
    aportado,
    progreso: objetivo > 0 ? Math.min((aportado / objetivo) * 100, 100) : 0,
    aportes: goalAportes,
    fechaObjetivo: goal.fechaObjetivo?.slice(0, 10) || '',
  }
}

async function request(endpoint, token, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: { ...headers(token), ...(options.headers || {}) },
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) throw new Error(data?.message || data?.error || 'No fue posible sincronizar tus metas')
  return response.status === 204 ? null : data
}

export default function useMetasAhorro() {
  const { token } = useAuthUsuario()
  const [metas, setMetas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const [goals, aportes] = await Promise.all([
        request('/api/metas-ahorro', token),
        request('/api/aportes-ahorro', token),
      ])
      setMetas(goals.map((goal) => normalizeGoal(goal, aportes)))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { cargar() }, [cargar])

  const crearMeta = useCallback(async (form) => {
    setLoading(true)
    setError('')
    try {
      await request('/api/metas-ahorro', token, {
        method: 'POST',
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || undefined,
          montoObjetivo: form.montoObjetivo,
          fechaObjetivo: form.fechaObjetivo || undefined,
          estado: 'ACTIVA',
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

  const agregarAporte = useCallback(async (metaId, form) => {
    setLoading(true)
    setError('')
    try {
      await request('/api/aportes-ahorro', token, {
        method: 'POST',
        body: JSON.stringify({
          metaId,
          monto: form.monto,
          descripcion: form.descripcion.trim() || undefined,
          ocurridoEn: form.ocurridoEn,
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

  const eliminarMeta = useCallback(async (id) => {
    setLoading(true)
    setError('')
    try {
      await request(`/api/metas-ahorro/${id}`, token, { method: 'DELETE' })
      setMetas((current) => current.filter((meta) => meta.id !== id))
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  const resumen = useMemo(() => ({
    objetivo: metas.reduce((total, meta) => total + meta.montoObjetivo, 0),
    aportado: metas.reduce((total, meta) => total + meta.aportado, 0),
    activas: metas.filter((meta) => meta.estado === 'ACTIVA').length,
  }), [metas])

  return { metas, resumen, loading, error, crearMeta, agregarAporte, eliminarMeta, recargar: cargar }
}
