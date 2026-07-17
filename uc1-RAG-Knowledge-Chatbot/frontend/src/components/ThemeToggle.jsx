import { useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import { applyTheme, getStoredTheme } from '../lib/theme.js'

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getStoredTheme)

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    applyTheme(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="fixed right-4 top-3 z-20 flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-600 shadow-sm transition hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
    >
      {theme === 'dark' ? <Moon className="size-4" strokeWidth={1.75} /> : <Sun className="size-4" strokeWidth={1.75} />}
      {theme === 'dark' ? 'Dark' : 'Light'}
    </button>
  )
}
