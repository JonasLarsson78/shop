<script setup lang="ts">
import { useShopStore } from './stores/shop'

const shopStore = useShopStore()
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand-wrap">
        <p class="eyebrow">Premium Hundshop</p>
        <h1 class="brand">Doggo Shop</h1>
      </div>
      <nav class="nav">
        <RouterLink to="/">Start</RouterLink>
        <RouterLink to="/shop">Butik</RouterLink>
        <RouterLink to="/cart" class="cart-link">
          <span>Varukorg</span>
          <span v-if="shopStore.totalItems > 0" class="cart-badge">{{ shopStore.totalItems }}</span>
        </RouterLink>
        <RouterLink to="/checkout">Kassa</RouterLink>
        <RouterLink to="/admin">Admin</RouterLink>
      </nav>
    </header>

    <main class="page-container">
      <RouterView />
    </main>
  </div>
</template>

<style lang="scss">
:root {
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.4;
  font-weight: 400;
  color: $color-text;
  background: linear-gradient(180deg, rgba($color-brand, 0.09) 0%, rgba($color-muted, 0.08) 48%, $color-surface 100%);
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
  background: linear-gradient(180deg, rgba($color-brand, 0.09) 0%, rgba($color-muted, 0.08) 48%, $color-surface 100%);
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
  background: linear-gradient(160deg, rgba($color-brand, 0.08) 0%, rgba($color-muted, 0.12) 100%);
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  padding: 0.9rem 1rem;
}

.brand-wrap {
  display: grid;
  gap: 0.15rem;
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
    background: linear-gradient(120deg, $color-brand 0%, $color-muted 100%);
    color: $color-brand-contrast;
    border-color: $color-brand;
  }
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
  color: $color-brand;
}

.page-container {
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: $radius-lg;
  padding: 1.15rem;
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
  border-radius: $radius-sm;
  padding: 0.58rem 0.78rem;
  font-weight: 600;
}

.button-muted {
  @include button-base($color-muted, $color-brand-contrast);
}

.button-danger {
  @include button-base($color-danger, $color-brand-contrast);
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
