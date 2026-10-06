function MovementItem({ monto, tipo, descripcion, fecha, categoria, onDelete }) {
  return (
    <article className={`movement-card ${tipo}`}>
      <span className="movement-icon" aria-hidden="true">{tipo === 'ingreso' ? '↗' : '↘'}</span>
      <div className="movement-info">
        <strong>{descripcion}</strong>
        <small>{categoria} · {new Date(fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</small>
      </div>
      <strong className="movement-amount">
        {tipo === 'ingreso' ? '+' : '-'}${monto.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </strong>
      {onDelete && (
        <button className="icon-button" type="button" onClick={onDelete} aria-label={`Eliminar ${descripcion}`}>
          ×
        </button>
      )}
    </article>
  )
}

export default MovementItem
