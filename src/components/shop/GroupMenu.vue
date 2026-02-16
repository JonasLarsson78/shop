<script setup lang="ts">
import { computed } from 'vue'
import { useShopStore } from '../../stores/shop'
import type { ProductGroup, Product } from '../../stores/shop'

const shopStore = useShopStore()

const groupLinks = computed(() => {
  const groupsWithProducts = shopStore.groups
    .map((group: ProductGroup) => ({
      id: group.id,
      name: group.name,
      count: shopStore.products.filter((product: Product) => product.groupId === group.id).length,
    }))
    .filter((group: { count: number }) => group.count > 0)

  const ungroupedCount = shopStore.products.filter((product: Product) => !product.groupId).length

  return {
    groupsWithProducts,
    ungroupedCount,
  }
})
</script>

<template>
  <aside class="group-menu card">
    <p class="group-menu-kicker">Navigera</p>
    <h3>Produktgrupper</h3>

    <RouterLink class="group-menu-link" :to="{ path: '/shop' }"
      :class="{ active: $route.path === '/shop' && !$route.query.group }">
      Alla produkter
    </RouterLink>

    <RouterLink v-for="group in groupLinks.groupsWithProducts" :key="group.id" class="group-menu-link"
      :class="{ active: $route.path === '/shop' && $route.query.group === String(group.id) }"
      :to="{ path: '/shop', query: { group: String(group.id) } }">
      {{ group.name }}
    </RouterLink>

    <RouterLink v-if="groupLinks.ungroupedCount > 0" class="group-menu-link"
      :class="{ active: $route.path === '/shop' && $route.query.group === 'ungrouped' }"
      :to="{ path: '/shop', query: { group: 'ungrouped' } }">
      Övrigt
    </RouterLink>
  </aside>
</template>

<style scoped lang="scss">
.group-menu {
  align-self: start;
  position: sticky;
  top: 1rem;
  background: linear-gradient(155deg, $color-surface 0%, $color-surface-muted 100%);

  h3 {
    margin: 0.2rem 0 0.8rem;
  }
}

.group-menu-kicker {
  margin: 0;
  color: $color-text-soft;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.74rem;
  font-weight: 600;
}

.group-menu-link {
  display: block;
  width: 100%;
  margin-bottom: 0.45rem;
  padding: 0.58rem 0.7rem;
  text-align: left;
  background: $color-surface;
  color: $color-text-strong;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  text-decoration: none;
  transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;

  &:hover {
    border-color: $color-text-soft;
    background: $color-surface-muted;
  }

  &.active {
    background: var(--theme-accent);
    color: var(--theme-button-primary-text);
    border-color: var(--theme-accent-border);
  }
}

@include mobile-down {
  .group-menu {
    position: static;
  }
}
</style>
