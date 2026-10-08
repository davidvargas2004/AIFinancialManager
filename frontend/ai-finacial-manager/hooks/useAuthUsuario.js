import { useContext } from 'react'
import AuthContext from '../src/context/authContextValue'

export default function useAuthUsuario() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuthUsuario debe utilizarse dentro de AuthProvider')
  }

  return context
}
