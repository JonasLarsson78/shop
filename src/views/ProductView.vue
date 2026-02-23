<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useShopStore } from '../stores/shop'
import BaseButton from '../components/ui/BaseButton.vue'

const route = useRoute()
const router = useRouter()
const shopStore = useShopStore()

const id = Number(route.params.id)
const product = computed(() => shopStore.products.find(p => p.id === id))

const quantity = ref(1)
const decrease = () => { quantity.value = Math.max(1, quantity.value - 1) }
const increase = () => { quantity.value = quantity.value + 1 }
const addToCart = () => {
  if (!product.value) return
  shopStore.addToCart(product.value.id, quantity.value)
  router.push('/cart')
}

const goBack = () => {
  // Prefer history back, fallback to shop route
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/shop')
  }
}
</script>

<template>
  <section class="product-page">
    <div v-if="!product" class="card">
      <p>Produkten hittades inte.</p>
    </div>

    <div v-else class="card product-detail">
      <div class="media">
        <img v-if="product.imageUrl" :src="product.imageUrl" :alt="product.name" />
        <div v-else class="image-missing">Bild saknas</div>
      </div>

      <div class="info">
        <h2>{{ product.name }}</h2>
        <p class="price">{{ product.price }} kr</p>
        <p class="description">{{ product.description }}</p>

        <label class="product-quantity">
          Antal
          <div class="quantity-stepper">
            <button type="button" class="step-button" @click="decrease">−</button>
            <input type="number" min="1" v-model.number="quantity" />
            <button type="button" class="step-button" @click="increase">+</button>
          </div>
        </label>

        <div class="actions">
          <BaseButton variant="secondary" type="button" @click="goBack">Tillbaka</BaseButton>
          <BaseButton variant="primary" type="button" @click="addToCart">Lägg i varukorg</BaseButton>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">

/* Match checkout / site input and button styling */
label {
  display: grid;
  gap: 0.35rem;
  margin-bottom: 0.8rem;
}

input,
select,
textarea {
  font: inherit;
  padding: 0.55rem 0.65rem;
  border-radius: $radius-sm;
  border: 1px solid $color-border-input;
  background: var(--theme-page-top, $color-surface-muted);
  color: $color-text;
}

select {
  appearance: none
}

.product-detail {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 1rem;
  align-items: start;
}

.media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: $radius-sm
}

.image-missing {
  display: grid;
  place-items: center;
  height: 320px;
  background: $color-surface-muted;
  border-radius: $radius-sm
}

.info h2 {
  margin: 0 0 0.4rem
}

.price {
  font-weight: 700;
  margin: 0 0 0.6rem
}

.description {
  color: $color-text;
  margin: 0 0 1rem;
  white-space: pre-wrap
}

.product-quantity {
  margin: 0 0 1rem
}

.quantity-stepper {
  display: grid;
  grid-template-columns: 2rem 3.75rem 2rem;
  gap: 0.35rem;
  align-items: center
}

.quantity-stepper input {
  width: 3.75rem;
  text-align: center
}

.step-button {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.actions {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.6rem
}

@include mobile-down {
  .product-detail {
    grid-template-columns: 1fr
  }
}
</style>
