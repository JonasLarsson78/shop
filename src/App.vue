<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue'
import { useShopStore } from './stores/shop'
import { useAuthStore } from './stores/auth'
import { adminAuthChangedEvent, isAdminAuthenticated } from './utils/adminAuth'
import { applyTheme, getStoredTheme } from './utils/theme'

const shopStore = useShopStore()
const isAdminLoggedIn = ref(false)
const authStore = useAuthStore()
const user = computed(() => authStore.state.user)

const syncAdminAuthState = () => {
  isAdminLoggedIn.value = isAdminAuthenticated()
}

onMounted(() => {
  syncAdminAuthState()
  applyTheme(getStoredTheme())
  window.addEventListener('storage', syncAdminAuthState)
  window.addEventListener(adminAuthChangedEvent, syncAdminAuthState)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', syncAdminAuthState)
  window.removeEventListener(adminAuthChangedEvent, syncAdminAuthState)
})

const logout = () => {
  authStore.logout()
}

const storeName = computed(() => shopStore.settings.storeName || '')

const subName = computed(() => (shopStore.hasInitializedData ? shopStore.settings.subName || '' : ''))

const brandImageUrl = computed(() => (shopStore.hasInitializedData ? shopStore.settings.brandImageUrl?.trim() || '' : ''))

watchEffect(() => {
  if (typeof document !== 'undefined') {
    document.title = subName.value || storeName.value
  }
})
</script>

<template>
  <div class="app-shell">
    <header v-if="shopStore.hasInitializedData" class="topbar">
      <div class="brand-wrap">
        <img v-if="brandImageUrl" :src="brandImageUrl" :alt="storeName || 'Butik'" class="brand-image" />
        <template v-else>
          <h1 v-if="storeName" class="brand">{{ storeName }}</h1>
          <p v-if="subName" class="eyebrow">{{ subName }}</p>
        </template>
      </div>
      <nav v-if="shopStore.hasInitializedData" class="nav">
        <RouterLink to="/">
          <span class="nav-label">
            <span class="nav-icon" aria-hidden="true">🏠</span>
            <span>Start</span>
          </span>
        </RouterLink>
        <RouterLink to="/shop">
          <span class="nav-label">
            <span class="nav-icon" aria-hidden="true">🛍️</span>
            <span>Butik</span>
          </span>
        </RouterLink>
        <RouterLink to="/cart" class="cart-link">
          <span class="nav-label">
            <span class="nav-icon" aria-hidden="true">🛒</span>
            <span>Varukorg</span>
          </span>
          <span v-if="shopStore.totalItems > 0" class="cart-badge">{{ shopStore.totalItems }}</span>
        </RouterLink>
        <RouterLink to="/checkout">
          <span class="nav-label">
            <span class="nav-icon" aria-hidden="true">💳</span>
            <span>Kassa</span>
          </span>
        </RouterLink>
        <RouterLink v-if="!user" to="/login">
          <span class="nav-label">
            <span class="nav-icon" aria-hidden="true">🔐</span>
            <span>Logga in</span>
          </span>
        </RouterLink>
        <RouterLink v-else to="/account">
          <span class="nav-label">
            <span class="nav-icon" aria-hidden="true">👤</span>
            <span>{{ user.name || user.email }}</span>
          </span>
        </RouterLink>
        <RouterLink v-if="user" to="/" @click="logout">
          <span class="nav-label">
            <span class="nav-icon" aria-hidden="true">⇦</span>
            <span>Logga ut</span>
          </span>
        </RouterLink>
        <RouterLink v-if="isAdminLoggedIn" to="/admin">
          <span class="nav-label">
            <span class="nav-icon" aria-hidden="true">🛠️</span>
            <span>Admin</span>
          </span>
        </RouterLink>
      </nav>
    </header>

    <main class="page-container">
      <RouterView v-if="shopStore.hasInitializedData" />
      <div v-else class="loading-state">
        <div class="loader" />
        <p class="loading-text">Förbereder butiken…</p>
      </div>
    </main>
  </div>
</template>

<style lang="scss">
:root {
  --theme-accent: #{$color-brand};
  --theme-accent-soft: #{rgba($color-brand, 0.14)};
  --theme-accent-border: #{$color-brand};
  --theme-page-top: #{rgba($color-brand, 0.09)};
  --theme-page-mid: #{rgba($color-muted, 0.08)};
  --theme-topbar-top: #{rgba($color-brand, 0.08)};
  --theme-topbar-mid: #{rgba($color-muted, 0.12)};
  --theme-hero-top: #{rgba($color-brand, 0.09)};
  --theme-hero-mid: #{rgba($color-muted, 0.14)};
  --theme-button-primary-bg: #{$color-brand};
  --theme-button-primary-text: #{$color-brand-contrast};
  --theme-button-muted-bg: #{$color-muted};
  --theme-button-muted-text: #{$color-brand-contrast};
  --theme-button-danger-bg: #{$color-danger};
  --theme-button-danger-text: #{$color-brand-contrast};
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.4;
  font-weight: 400;
  color: $color-text;
  background: linear-gradient(180deg, var(--theme-page-top) 0%, var(--theme-page-mid) 48%, $color-surface 100%);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  background: linear-gradient(180deg, var(--theme-page-top) 0%, var(--theme-page-mid) 48%, $color-surface 100%);
}

#app {
  min-height: 100vh;
}

.app-shell {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.25rem;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1.1rem;
  margin-bottom: 1.2rem;
  background: linear-gradient(160deg, var(--theme-topbar-top) 0%, var(--theme-topbar-mid) 100%);
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  padding: 0.9rem 1rem;
}

.brand-wrap {
  display: grid;
  gap: 0.15rem;
}

.brand-image {
  max-height: 70px;
  width: auto;
  object-fit: contain;
  border-radius: $radius-md;
}

.eyebrow {
  margin: 0;
  font-size: 0.75rem;
  color: $color-text-soft;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.brand {
  margin: 0;
  font-size: 1.7rem;
  line-height: 1.1;
}

.nav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  a {
    text-decoration: none;
    color: $color-text-strong;
    padding: 0.45rem 0.7rem;
    border-radius: $radius-sm;
    border: 1px solid transparent;
    transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
  }

  a:hover {
    border-color: $color-border;
    background: $color-surface-muted;
  }

  a.router-link-active {
    background: var(--theme-accent-soft);
    color: $color-text-strong;
    border-color: var(--theme-accent-border);
  }
}

.nav-label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.nav-icon {
  font-size: 0.95em;
  line-height: 1;
}

.cart-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.cart-badge {
  min-width: 1.35rem;
  height: 1.35rem;
  padding: 0 0.35rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.76rem;
  font-weight: 700;
  background: rgba($color-brand-contrast, 0.92);
  color: var(--theme-accent);
}

.page-container {
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  padding: 1.15rem;
}

.loading-state {
  min-height: 260px;
  display: grid;
  place-items: center;
  gap: 0.7rem;
}

.loading-text {
  margin: 0;
  font-size: 1.1rem;
  color: var(--theme-accent);
  font-weight: 600;
  letter-spacing: 0.01em;
}

.loader {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 3px solid var(--theme-accent-soft);
  border-top-color: var(--theme-accent);
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.card {
  @include card-surface;
  padding: 1rem;
  background: $color-surface;
}

label {
  display: grid;
  gap: 0.35rem;
  margin-bottom: 0.8rem;
}

input,
select,
textarea,
button {
  @include input-base;
}

button,
.button-link {
  @include button-base;
  background: var(--theme-button-primary-bg);
  color: var(--theme-button-primary-text);
  border-radius: $radius-sm;
  padding: 0.58rem 0.78rem;
  font-weight: 600;
}

.button-muted {
  color: var(--theme-button-muted-text) !important;
}

.button-primary {
  background: var(--theme-button-primary-bg) !important;
  color: var(--theme-button-primary-text) !important;
}

.button-danger {
  background: var(--theme-button-danger-bg) !important;
  color: var(--theme-button-danger-text) !important;
}

.price,
.total {
  font-weight: 700;
}

.shop-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 1rem;
}

.checkout-layout,
.admin-layout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.row-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

@media (max-width: 720px) {
  .app-shell {
    padding: 0.8rem;
  }

  .topbar {
    padding: 0.8rem;
  }

  .shop-layout {
    grid-template-columns: 1fr;
  }
}
</style>
