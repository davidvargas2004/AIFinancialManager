import useTheme from '../context/useTheme'

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      className="theme-toggle"
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      <span aria-hidden="true">{isDark ? '☀' : '☾'}</span>
      <span className="theme-toggle-label">{isDark ? 'Claro' : 'Oscuro'}</span>
    </button>
  )
}

export default ThemeToggle
