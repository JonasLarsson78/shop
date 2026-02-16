<template>
  <div class="app-shell">
    <header class="topbar">
      <h1 class="brand">Doggo Shop</h1>
      <nav class="nav">
        <RouterLink to="/">Start</RouterLink>
        <RouterLink to="/shop">Butik</RouterLink>
        <RouterLink to="/cart">Varukorg</RouterLink>
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
  background: $color-surface-muted;
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
}

#app {
  min-height: 100vh;
}

.app-shell {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1rem;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1rem;
}

.brand {
  margin: 0;
  font-size: 1.5rem;
}

.nav {
  display: flex;
  gap: 0.75rem;

  a {
    text-decoration: none;
    color: $color-text-strong;
    padding: 0.4rem 0.7rem;
    border-radius: $radius-sm;
  }

  a.router-link-active {
    background: $color-border;
  }
}

.page-container {
  background: $color-surface;
  border-radius: $radius-lg;
  padding: 1rem;
}

.card {
  @include card-surface;
  padding: 1rem;
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
  .shop-layout {
    grid-template-columns: 1fr;
  }
}
</style>
