<script setup lang="ts">
import { computed } from 'vue'
import GroupMenu from '../components/shop/GroupMenu.vue'
import { useShopStore } from '../stores/shop'

const shopStore = useShopStore()

const heroPoints = computed(() =>
  [shopStore.settings.heroPoint1, shopStore.settings.heroPoint2, shopStore.settings.heroPoint3].filter(
    (point) => point.trim().length > 0,
  ),
)
</script>

<template>
  <section class="shop-layout">
    <GroupMenu />

    <div class="home-hero card">
      <p v-if="shopStore.settings.heroKicker" class="home-kicker">{{ shopStore.settings.heroTitle }}</p>
      <h2 v-if="shopStore.settings.heroTitle">{{ shopStore.settings.heroKicker }}</h2>
      <p v-if="shopStore.settings.heroLead" class="home-lead">{{ shopStore.settings.heroLead }}</p>

      <ul v-if="heroPoints.length > 0" class="home-points">
        <li v-for="point in heroPoints" :key="point">{{ point }}</li>
      </ul>

      <div class="home-actions">
        <RouterLink class="button-link" to="/shop">Gå till butiken</RouterLink>
        <RouterLink class="button-link button-muted" to="/cart">Se varukorg</RouterLink>
      </div>

    </div>
  </section>
</template>

<style scoped lang="scss">
.home-hero {
  background: linear-gradient(145deg, var(--theme-hero-top) 0%, var(--theme-hero-mid) 100%);
}

.home-kicker {
  margin: 0 0 0.7rem;
  color: $color-text-soft;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.76rem;
  font-weight: 600;
}

h2 {
  margin: 0 0 0.35rem;
  line-height: 1.2;
}

.home-lead {
  margin: 0;
  color: $color-text-soft;
  max-width: 62ch;
}

.home-points {
  margin: 0.95rem 0 0;
  padding-left: 1.1rem;
  display: grid;
  gap: 0.35rem;
}

.home-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 1.1rem;
}
</style>