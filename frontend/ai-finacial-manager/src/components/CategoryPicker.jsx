import { useEffect, useMemo, useRef, useState } from 'react'

const EXPENSE_CATEGORIES = new Set([
  'Vivienda',
  'Alimentación',
  'Transporte',
  'Salud',
  'Educación',
  'Entretenimiento',
  'Compras',
  'Deudas',
  'Ahorro e Inversión',
  'Otros',
])

const INCOME_CATEGORIES = new Set([
  'Salario/Nómina',
  'Freelance/Honorarios',
  'Inversiones',
  'Negocios',
  'Regalos',
  'Otros ingresos',
])

function CategoryPicker({ categories, type, value, onChange, disabled }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const modalRef = useRef(null)
  const allowed = type === 'gasto' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES
  const selected = categories.find(({ id }) => id === value)
  const options = useMemo(
    () => categories
      .filter(({ nombre }) => allowed.has(nombre))
      .filter(({ nombre }) => nombre.toLowerCase().includes(search.toLowerCase().trim())),
    [categories, allowed, search],
  )

  useEffect(() => {
    if (!open) return undefined

    function closeWithEscape(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', closeWithEscape)
    modalRef.current?.querySelector('input')?.focus()
    return () => document.removeEventListener('keydown', closeWithEscape)
  }, [open])

  function selectCategory(category) {
    onChange(category)
    setSearch('')
    setOpen(false)
  }

  return (
    <div className="category-picker">
      <button
        className="category-trigger"
        type="button"
        disabled={disabled}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="category-trigger-value">
          {selected && <span className="category-dot" style={{ backgroundColor: selected.color || '#8a9490' }} />}
          {selected?.nombre || 'Selecciona una categoría'}
        </span>
        <span aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div className="category-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setOpen(false)
        }}>
          <div className="category-modal" ref={modalRef} role="dialog" aria-modal="true" aria-label="Seleccionar categoría">
            <div className="category-modal-header">
              <div>
                <p className="eyebrow">{type === 'gasto' ? 'GASTOS' : 'INGRESOS'}</p>
                <h3>{type === 'gasto' ? '¿En qué gastaste?' : '¿De dónde viene?'}</h3>
                <span className="category-count">{options.length} categorías disponibles</span>
              </div>
              <button className="category-close" type="button" aria-label="Cerrar categorías" onClick={() => setOpen(false)}>×</button>
            </div>
            <div className="category-search-wrap">
              <span aria-hidden="true">⌕</span>
              <input
                className="category-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar categoría..."
              />
              {search && <button type="button" aria-label="Limpiar búsqueda" onClick={() => setSearch('')}>×</button>}
            </div>
            <div className="category-options">
              {options.map((category) => (
                <button
                  className={`category-option ${category.id === value ? 'selected' : ''}`}
                  key={category.id}
                  type="button"
                  onClick={() => selectCategory(category)}
                >
                  <span className="category-dot" style={{ backgroundColor: category.color || '#8a9490' }} />
                  <span className="category-option-name">{category.nombre}</span>
                  {category.id === value && <span className="category-check" aria-hidden="true">✓</span>}
                </button>
              ))}
              {!options.length && <p className="empty-state">No encontramos esa categoría.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoryPicker
