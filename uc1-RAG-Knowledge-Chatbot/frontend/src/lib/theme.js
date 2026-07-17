const STORAGE_KEY = 'uc1-theme'

export function getStoredTheme() {
  return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme !== 'light')
  localStorage.setItem(STORAGE_KEY, theme)
}
