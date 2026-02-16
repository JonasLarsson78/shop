<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useShopStore } from '../stores/shop'
import GroupMenu from '../components/shop/GroupMenu.vue'

const shopStore = useShopStore()
const route = useRoute()
const fallbackImageUrl = 'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=1200'
const legacyProductImageMap: Record<string, string> = {
  '/products/dog-bowl.svg': 'https://images.pexels.com/photos/5731866/pexels-photo-5731866.jpeg?auto=compress&cs=tinysrgb&w=1200',
  '/products/dog-leash.svg': 'https://images.pexels.com/photos/1490908/pexels-photo-1490908.jpeg?auto=compress&cs=tinysrgb&w=1200',
  '/products/dog-bed.svg': 'https://images.pexels.com/photos/4587995/pexels-photo-4587995.jpeg?auto=compress&cs=tinysrgb&w=1200',
  '/products/dog-toy.svg': 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1200',
  '/products/default-dog.svg': 'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=1200',
}

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

const resolveProductImage = (imageUrl: string) => {
  const trimmedUrl = imageUrl.trim()

  if (!trimmedUrl) {
    return fallbackImageUrl
  }

  if (legacyProductImageMap[trimmedUrl]) {
    return legacyProductImageMap[trimmedUrl]
  }

  return trimmedUrl
}

const handleProductImageError = (event: Event) => {
  const img = event.target as HTMLImageElement | null

  if (!img) {
    return
  }

  if (img.src.endsWith(fallbackImageUrl)) {
    return
  }

  img.src = fallbackImageUrl
}

const recentlyAddedProductIds = ref<Record<string, boolean>>({})
const selectedQuantities = ref<Record<string, number>>({})
const addFeedbackTimers = new Map<string, ReturnType<typeof setTimeout>>()
const toastMessage = ref('')
const showToast = ref(false)
let toastTimer: ReturnType<typeof setTimeout> | null = null

const getSelectedQuantity = (productId: string) => {
  const quantity = selectedQuantities.value[productId]

  if (!quantity || quantity < 1) {
    return 1
  }

  return Math.floor(quantity)
}

const setSelectedQuantity = (productId: string, rawValue: string) => {
  const parsedValue = Number(rawValue)
  selectedQuantities.value[productId] = Number.isFinite(parsedValue) ? Math.max(1, Math.floor(parsedValue)) : 1
}

const decreaseSelectedQuantity = (productId: string) => {
  selectedQuantities.value[productId] = Math.max(1, getSelectedQuantity(productId) - 1)
}

const increaseSelectedQuantity = (productId: string) => {
  selectedQuantities.value[productId] = getSelectedQuantity(productId) + 1
}

const addProductToCart = (productId: string) => {
  const quantity = getSelectedQuantity(productId)
  shopStore.addToCart(productId, quantity)
  recentlyAddedProductIds.value[productId] = true

  const addedProduct = shopStore.products.find((product) => product.id === productId)
  toastMessage.value = `${quantity} st ${addedProduct?.name ?? 'produkt'} tillagd i varukorgen`
  showToast.value = true

  if (toastTimer) {
    clearTimeout(toastTimer)
  }

  toastTimer = setTimeout(() => {
    showToast.value = false
    toastTimer = null
  }, 1800)

  const existingTimer = addFeedbackTimers.get(productId)
  if (existingTimer) {
    clearTimeout(existingTimer)
  }

  const timer = setTimeout(() => {
    recentlyAddedProductIds.value[productId] = false
    addFeedbackTimers.delete(productId)
  }, 1300)

  addFeedbackTimers.set(productId, timer)
}

onBeforeUnmount(() => {
  addFeedbackTimers.forEach((timer) => clearTimeout(timer))

  if (toastTimer) {
    clearTimeout(toastTimer)
  }
})
</script>

<template>
  <section class="shop-layout">
    <GroupMenu />

    <div class="shop-content">
      <header class="shop-header card">
        <img src="https://images.pexels.com/photos/1490908/pexels-photo-1490908.jpeg?auto=compress&cs=tinysrgb&w=1600"
          alt="Hund på promenad" class="shop-header-image" loading="lazy" />
        <p class="shop-kicker">Hundshop</p>
        <h2>{{ shopStore.settings.storeName }}</h2>
        <p>Hundprodukter för lek, promenad och vila.</p>
      </header>

      <div class="group-section">
        <h3 class="group-title">{{ activeGroupName }}</h3>

        <div class="grid">
          <article v-for="product in visibleProducts" :key="product.id" class="card product-card">
            <img :src="resolveProductImage(product.imageUrl)" :alt="product.name" class="product-image" loading="lazy"
              @error="handleProductImageError" />
            <h3>{{ product.name }}</h3>
            <p>{{ product.description }}</p>
            <p class="price">{{ product.price }} kr</p>
            <label class="product-quantity">
              Antal
              <div class="quantity-stepper">
                <button type="button" class="step-button" @click="decreaseSelectedQuantity(product.id)">−</button>
                <input type="number" min="1" :value="getSelectedQuantity(product.id)"
                  @input="setSelectedQuantity(product.id, ($event.target as HTMLInputElement).value)" />
                <button type="button" class="step-button" @click="increaseSelectedQuantity(product.id)">+</button>
              </div>
            </label>
            <button :class="{ 'button-added': recentlyAddedProductIds[product.id] }"
              @click="addProductToCart(product.id)">
              {{ recentlyAddedProductIds[product.id] ? 'Tillagd ✓' : 'Lägg i varukorg' }}
            </button>
          </article>
        </div>

        <p v-if="visibleProducts.length === 0">Inga produkter i denna grupp ännu.</p>
      </div>
    </div>

    <Transition name="cart-toast">
      <p v-if="showToast" class="cart-toast">{{ toastMessage }}</p>
    </Transition>
  </section>
</template>

<style scoped lang="scss">
.shop-content {
  display: grid;
  gap: 0.95rem;
}

.shop-header {
  background: linear-gradient(145deg, rgba($color-brand, 0.08) 0%, rgba($color-muted, 0.12) 100%);
  display: grid;
  gap: 0.45rem;

  h2 {
    margin: 0.25rem 0 0.4rem;
  }

  p {
    margin: 0;
    color: $color-text-soft;
  }
}

.shop-kicker {
  margin: 0;
  color: $color-text-soft;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.76rem;
  font-weight: 600;
}

.shop-header-image {
  width: 100%;
  max-height: 180px;
  object-fit: cover;
  border: 1px solid rgba($color-brand, 0.2);
  border-radius: $radius-md;
  background: #fff;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.group-section+.group-section {
  margin-top: 1.2rem;
}

.group-title {
  margin: 0 0 0.65rem;
}

.product-card {
  display: grid;
  grid-template-rows: auto auto 1fr auto auto auto;
  gap: 0.45rem;
  transition: transform 0.18s ease, border-color 0.18s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba($color-brand, 0.35);
  }

  h3 {
    margin: 0;
  }

  p {
    margin: 0;
  }
}

.product-quantity {
  margin: 0;

  .quantity-stepper {
    display: grid;
    grid-template-columns: 2rem 1fr 2rem;
    align-items: center;
    gap: 0.35rem;
  }

  input {
    width: 100%;
    min-width: 0;
    text-align: center;
  }

  .step-button {
    width: 2rem;
    height: 2rem;
    line-height: 1;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
}

.product-image {
  width: 100%;
  height: 180px;
  object-fit: contain;
  border-radius: $radius-sm;
  margin-bottom: 0.75rem;
  border: 1px solid rgba($color-brand, 0.18);
  background: linear-gradient(145deg, #ffffff 0%, rgba($color-brand, 0.08) 100%);
}

.button-added {
  background: $color-success;
  color: $color-brand-contrast;
}

.cart-toast {
  position: fixed;
  right: 1.1rem;
  bottom: 1.1rem;
  margin: 0;
  padding: 0.65rem 0.85rem;
  border-radius: $radius-sm;
  background: rgba($color-text-strong, 0.95);
  color: $color-brand-contrast;
  border: 1px solid rgba($color-brand, 0.35);
  z-index: 20;
}

.cart-toast-enter-active,
.cart-toast-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.cart-toast-enter-from,
.cart-toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>