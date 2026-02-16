const ADMIN_SESSION_KEY = 'admin-session'
const ADMIN_PASSWORD = 'admin123'
const ADMIN_AUTH_EVENT = 'admin-auth-changed'

const notifyAdminAuthChanged = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new CustomEvent(ADMIN_AUTH_EVENT))
}

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
  notifyAdminAuthChanged()
  return true
}

export const logoutAdmin = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(ADMIN_SESSION_KEY)
  notifyAdminAuthChanged()
}

export const adminAuthChangedEvent = ADMIN_AUTH_EVENT