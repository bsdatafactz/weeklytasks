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
      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-neutral-200"
    >
      {theme === 'dark' ? <Moon className="size-4" strokeWidth={1.75} /> : <Sun className="size-4" strokeWidth={1.75} />}
      {theme === 'dark' ? 'Dark' : 'Light'}
    </button>
  )
}
