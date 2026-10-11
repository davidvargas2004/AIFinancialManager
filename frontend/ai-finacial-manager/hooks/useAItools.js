import { useCallback, useState } from 'react'
import useAuthUsuario from './useAuthUsuario'

const API_URL = import.meta.env.VITE_API_URL || ''
const API_KEY = import.meta.env.VITE_API_KEY || ''

function parseResponse(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value
  if (typeof value !== 'string') return null

  const clean = value.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim()
  try {
    const parsed = JSON.parse(clean)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
  } catch {
    const start = clean.indexOf('{')
    const end = clean.lastIndexOf('}')
    if (start < 0 || end <= start) return null

    try {
      const parsed = JSON.parse(clean.slice(start, end + 1))
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
    } catch {
      return {
        saludo: 'Hola, gracias por consultar a tu asesor financiero.',
        resumen: clean,
        observaciones: [],
        recomendacion: 'Revisa tus movimientos y define tu próximo objetivo financiero.',
      }
    }
  }
}

export default function useAItools() {
  const { token } = useAuthUsuario()
  const [respuesta, setRespuesta] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const preguntar = useCallback(async (pregunta) => {
    if (!token) return null

    setLoading(true)
    setError('')
    setRespuesta(null)
    try {
      const response = await fetch(`${API_URL}/api/ai/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({ pregunta }),
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.message || data.error || 'No fue posible consultar al asesor')
      }

      const respuesta = parseResponse(data.respuesta)
      if (!respuesta) throw new Error('El asesor no devolvió contenido')

      setRespuesta(respuesta)
      return respuesta
    } catch (requestError) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'No fue posible consultar al asesor')
      return null
    } finally {
      setLoading(false)
    }
  }, [token])

  return { respuesta, loading, error, preguntar }
}
