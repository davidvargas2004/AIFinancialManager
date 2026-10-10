import { useEffect, useState } from 'react'
import useAuthUsuario from './useAuthUsuario'

const API_URL = import.meta.env.VITE_API_URL || ''
const API_KEY = import.meta.env.VITE_API_KEY || ''

export default function useCategorias() {
  const { token } = useAuthUsuario()
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return

    fetch(`${API_URL}/api/categorias`, {
      headers: { Authorization: `Bearer ${token}`, 'x-api-key': API_KEY },
    })
      .then(async (response) => {
        const data = await response.json().catch(() => [])
        if (!response.ok) throw new Error(data.message || data.error || 'No fue posible cargar las categorías')
        return data
      })
      .then(setCategorias)
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false))
  }, [token])

  return { categorias, loading, error }
}
