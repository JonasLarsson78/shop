<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useShopStore } from '../stores/shop'
import GroupMenu from '../components/shop/GroupMenu.vue'

const shopStore = useShopStore()
const route = useRoute()

const activeGroupId = computed(() => {
  const groupQuery = route.query.group

  if (typeof groupQuery !== 'string') {
    return 'all'
  }

  return groupQuery
})

const isValidGroup = (groupId: string) => shopStore.groups.some((group) => group.id === groupId)

const visibleProducts = computed(() => {
  if (activeGroupId.value === 'all') {
    return shopStore.products
  }

  if (activeGroupId.value === 'ungrouped') {
    return shopStore.products.filter((product) => !product.groupId)
  }

  if (!isValidGroup(activeGroupId.value)) {
    return shopStore.products
  }

  return shopStore.products.filter((product) => product.groupId === activeGroupId.value)
})

const activeGroupName = computed(() => {
  if (activeGroupId.value === 'all') {
    return 'Alla produkter'
  }

  if (activeGroupId.value === 'ungrouped') {
    return 'Övrigt'
  }

  if (!isValidGroup(activeGroupId.value)) {
    return 'Alla produkter'
  }

  const group = shopStore.groups.find((item) => item.id === activeGroupId.value)
  return group?.name ?? 'Alla produkter'
})
</script>

<template>
  <section class="shop-layout">
    <GroupMenu />

    <div>
    <h2>{{ shopStore.settings.storeName }}</h2>
    <p>Hundprodukter för lek, promenad och vila.</p>

    <div class="group-section">
      <h3 class="group-title">{{ activeGroupName }}</h3>

      <div class="grid">
        <article v-for="product in visibleProducts" :key="product.id" class="card">
          <img :src="product.imageUrl" :alt="product.name" class="product-image" />
          <h3>{{ product.name }}</h3>
          <p>{{ product.description }}</p>
          <p class="price">{{ product.price }} kr</p>
          <button @click="shopStore.addToCart(product.id)">Lägg i varukorg</button>
        </article>
      </div>

      <p v-if="visibleProducts.length === 0">Inga produkter i denna grupp ännu.</p>
    </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 240px));
  justify-content: start;
  gap: 1rem;
}

.group-section + .group-section {
  margin-top: 1.2rem;
}

.group-title {
  margin: 0 0 0.65rem;
}

.product-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: $radius-sm;
  margin-bottom: 0.75rem;
  border: 1px solid $color-border;
}
</style>