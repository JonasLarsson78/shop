<script setup lang="ts">
import GroupMenu from '../components/shop/GroupMenu.vue'
</script>

<template>
  <section class="shop-layout">
    <GroupMenu />

    <div class="home-hero card">
      <h2>Välkommen till Doggo Shop</h2>
      <p>Allt för din hund – enkelt att hitta rätt produkter via gruppmenyn i butiken.</p>

      <div class="home-actions">
        <RouterLink class="button-link" to="/shop">Gå till butiken</RouterLink>
        <RouterLink class="button-link button-muted" to="/cart">Se varukorg</RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.home-hero {
  max-width: 700px;
}

.home-actions {
  display: flex;
  gap: 0.6rem;
  margin-top: 1rem;
}
</style>