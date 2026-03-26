const rawBase = import.meta.env.VITE_API_BASE_URL?.trim()

const API_BASE = rawBase ? rawBase.replace(/\/+$/, '') : ''

export function apiUrl(path) {
  if (!path) return API_BASE || '/'
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return API_BASE ? `${API_BASE}${normalizedPath}` : normalizedPath
}
