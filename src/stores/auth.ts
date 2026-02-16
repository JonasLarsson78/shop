import { defineStore } from 'pinia'
import { ref } from 'vue'

type User = {
  id: number
  email: string
  name?: string
  address?: string
  phone?: string
  zip?: string
  city?: string
}

const AUTH_KEY = 'shop-auth-v1'

const load = (): { user: User | null } => {
  if (typeof window === 'undefined') return { user: null }
  try {
    const raw = window.localStorage.getItem(AUTH_KEY)
    if (!raw) return { user: null }
    const parsed = JSON.parse(raw) as { user?: User | null }
    return { user: parsed.user ?? null }
  } catch {
    return { user: null }
  }
}

const save = (state: { user: User | null }) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(state))
}

export const useAuthStore = defineStore('auth', () => {
  const state = ref(load())

  const register = async (payload: { email: string; password: string; name?: string; address?: string; phone?: string; zip?: string; city?: string }) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to register')
    }

    const user = await res.json()
    state.value.user = user
    save({ user })
    return user
  }

  const login = async (payload: { email: string; password: string }) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Failed to login')
    }

    const user = await res.json()
    state.value.user = user
    save({ user })
    return user
  }

  const logout = () => {
    state.value.user = null
    save({ user: null })
  }

  const setUser = (user: User | null) => {
    state.value.user = user
    save({ user })
  }

  return { state, register, login, logout, setUser }
})
