import { useEffect, useMemo, useState } from 'react'
import ThemeContext from './themeContext'

const STORAGE_KEY = 'ai-financial-manager-theme'

function getInitialTheme() {
  const savedTheme = window.localStorage.getItem(STORAGE_KEY)
  return savedTheme === 'dark' ? 'dark' : 'light'
}

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const value = useMemo(() => ({
    theme,
    toggleTheme: () => setTheme((current) => current === 'dark' ? 'light' : 'dark'),
  }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export default ThemeProvider
