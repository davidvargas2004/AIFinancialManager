import { useCallback, useState } from 'react'
import useAuthUsuario from './useAuthUsuario'

const API_URL = import.meta.env.VITE_API_URL || ''
const API_KEY = import.meta.env.VITE_API_KEY || ''

export default function useAItools() {
  const { token } = useAuthUsuario()
  const [respuesta, setRespuesta] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const preguntar = useCallback(async (pregunta) => {
    if (!token) return null

    setLoading(true)
    setError('')
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

      setRespuesta(data.respuesta || '')
      return data.respuesta
    } catch (requestError) {
      setError(requestError.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [token])

  return { respuesta, loading, error, preguntar }
}
