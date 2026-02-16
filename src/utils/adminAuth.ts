const ADMIN_SESSION_KEY = 'admin-session'
const ADMIN_PASSWORD = 'admin123'

export const isAdminAuthenticated = () => {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(ADMIN_SESSION_KEY) === '1'
}

export const loginAdmin = (password: string) => {
  if (typeof window === 'undefined') {
    return false
  }

  if (password !== ADMIN_PASSWORD) {
    return false
  }

  window.localStorage.setItem(ADMIN_SESSION_KEY, '1')
  return true
}

export const logoutAdmin = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(ADMIN_SESSION_KEY)
}