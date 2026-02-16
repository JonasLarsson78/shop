<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { isAdminAuthenticated, loginAdmin, logoutAdmin } from '../utils/adminAuth'
import AdminLoginCard from '../components/admin/AdminLoginCard.vue'

const isAuthenticated = ref(isAdminAuthenticated())
const authError = ref('')

const handleLogin = (password: string) => {
  const success = loginAdmin(password)

  if (!success) {
    authError.value = 'Fel lösenord. Försök igen.'
    return
  }

  isAuthenticated.value = true
  authError.value = ''
}

const handleLogout = () => {
  logoutAdmin()
  isAuthenticated.value = false
}

const pendingCount = ref(0)

const fetchPendingCount = async () => {
  try {
    const res = await fetch('/api/orders-count?status=pending')
    if (!res.ok) return
    const data = await res.json()
    pendingCount.value = typeof data?.count === 'number' ? data.count : 0
  } catch (e) {
    // ignore
  }
}

let pollId: number | undefined
onMounted(() => {
  fetchPendingCount()
  pollId = window.setInterval(fetchPendingCount, 30000)
})
onUnmounted(() => {
  if (pollId) clearInterval(pollId)
})
</script>

<template>
  <section>
    <p v-if="!isAuthenticated">Logga in för att hantera inställningar och produkter.</p>

    <AdminLoginCard v-if="!isAuthenticated" :auth-error="authError" @login="handleLogin" />

    <template v-else>
      <div class="admin-shell">
        <div class="admin-shell-head">
          <p>Inloggad som admin.</p>
          <button type="button" @click="handleLogout">Logga ut</button>
        </div>

        <nav class="admin-section-nav">
          <RouterLink to="/admin/products">Produkter</RouterLink>
          <RouterLink to="/admin/groups">Grupper</RouterLink>
          <RouterLink to="/admin/orders">Ordrar <span v-if="pendingCount > 0" class="badge">{{ pendingCount }}</span>
          </RouterLink>
          <RouterLink to="/admin/settings">Inställningar</RouterLink>
          <RouterLink to="/admin/theme">Tema</RouterLink>
        </nav>
      </div>

      <RouterView />
    </template>
  </section>
</template>

<style scoped lang="scss">
.admin-shell {
  margin-bottom: 1rem;
}

.admin-shell-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;

  p {
    margin: 0;
  }
}

.admin-section-nav {
  display: flex;
  gap: 0.55rem;
  margin-top: 0.75rem;
  flex-wrap: wrap;

  a {
    text-decoration: none;
    color: $color-text-strong;
    background: $color-surface-muted;
    border: 1px solid $color-border;
    border-radius: $radius-sm;
    padding: 0.45rem 0.65rem;
  }

  a.router-link-active {
    background: var(--theme-accent-soft);
    color: $color-text-strong;
    border-color: var(--theme-accent-border);
  }
}
</style>