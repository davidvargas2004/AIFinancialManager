import MovementItem from './MovementItem'

function MovementList({ movimientos, onDelete }) {
  if (!movimientos.length) {
    return <div className="empty-state">Aún no tienes movimientos registrados.</div>
  }

  return (
    <div className="movement-list">
      {movimientos.map((movement) => (
        <MovementItem key={movement.id} {...movement} onDelete={() => onDelete(movement)} />
      ))}
    </div>
  )
}

export default MovementList
