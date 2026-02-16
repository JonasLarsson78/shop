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
    <h3>Grupper</h3>

    <RouterLink class="group-menu-link" :to="{ path: '/shop' }" :class="{ active: $route.path === '/shop' && !$route.query.group }">
      Alla produkter
    </RouterLink>

    <RouterLink
      v-for="group in groupLinks.groupsWithProducts"
      :key="group.id"
      class="group-menu-link"
      :class="{ active: $route.path === '/shop' && $route.query.group === group.id }"
      :to="{ path: '/shop', query: { group: group.id } }"
    >
      {{ group.name }}
    </RouterLink>

    <RouterLink
      v-if="groupLinks.ungroupedCount > 0"
      class="group-menu-link"
      :class="{ active: $route.path === '/shop' && $route.query.group === 'ungrouped' }"
      :to="{ path: '/shop', query: { group: 'ungrouped' } }"
    >
      Övrigt
    </RouterLink>
  </aside>
</template>

<style scoped lang="scss">
.group-menu {
  align-self: start;
  position: sticky;
  top: 1rem;

  h3 {
    margin-top: 0;
  }
}

.group-menu-link {
  display: block;
  width: 100%;
  margin-bottom: 0.5rem;
  padding: 0.55rem 0.65rem;
  text-align: left;
  background: $color-surface-muted;
  color: $color-text-strong;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  text-decoration: none;

  &.active {
    background: $color-brand;
    color: $color-brand-contrast;
  }
}

@include mobile-down {
  .group-menu {
    position: static;
  }
}
</style>
