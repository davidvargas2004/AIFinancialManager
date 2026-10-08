import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuthUsuario from '../../hooks/useAuthUsuario'

function ProteccionRoute() {
  const { isAuthenticated } = useAuthUsuario()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

export default ProteccionRoute
