<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useShopStore } from '../stores/shop'

const shopStore = useShopStore()
const router = useRouter()
const route = useRoute()
const selectedShippingId = ref<number | null>(null)

onMounted(() => {
  if (!shopStore.shippingOptions.length) {
    shopStore.fetchShippingOptions()
  }
  const shippingId = Number(route.query.shipping)
  if (shippingId && shopStore.shippingOptions.some(opt => opt.id === shippingId)) {
    selectedShippingId.value = shippingId
  } else if (shopStore.shippingOptions.length > 0 && shopStore.shippingOptions[0]) {
    selectedShippingId.value = shopStore.shippingOptions[0].id
  } else {
    selectedShippingId.value = null
  }
})

const selectedShipping = computed(() =>
  shopStore.shippingOptions.find(opt => opt.id === selectedShippingId.value)
)

const cartTotalWithShipping = computed(() => {
  const shipping = selectedShipping.value?.price ?? 0
  return shopStore.cartSubtotal + shipping
})

const shippingDisplay = computed(() => {
  if (!shopStore.shippingOptions.length) return 0
  return selectedShipping.value?.price ?? 0
})

const form = reactive({
  name: '',
  email: '',
  address: '',
})

const orderPlaced = ref(false)

const placeOrder = () => {
  if (shopStore.cartItems.length === 0) {
    return
  }

  orderPlaced.value = true
  shopStore.clearCart()

  setTimeout(() => {
    router.push('/')
  }, 1500)
}
</script>

<template>
  <section>
    <div class="hero-header card">
      <p v-if="shopStore.settings.checkoutHeroKicker" class="hero-kicker">{{ shopStore.settings.checkoutHeroKicker }}
      </p>
      <h2 v-if="shopStore.settings.checkoutHeroTitle">{{ shopStore.settings.checkoutHeroTitle }}</h2>
      <p v-if="shopStore.settings.checkoutHeroLead" class="hero-lead">{{ shopStore.settings.checkoutHeroLead }}</p>
    </div>

    <p v-if="shopStore.cartItems.length === 0 && !orderPlaced">Varukorgen är tom. Lägg till produkter först.</p>

    <div v-else class="checkout-layout">
      <form v-if="!orderPlaced" class="card" @submit.prevent="placeOrder">
        <h3>Kunduppgifter</h3>

        <label>
          Namn
          <input v-model="form.name" required type="text" />
        </label>

        <label>
          E-post
          <input v-model="form.email" required type="email" />
        </label>

        <label>
          Adress
          <textarea v-model="form.address" required rows="3" />
        </label>

        <button type="submit">Bekräfta köp</button>
      </form>

      <div class="card">
        <h3>Orderöversikt</h3>
        <ul>
          <li v-for="item in shopStore.cartItems" :key="item.product.id">
            {{ item.product.name }} x {{ item.quantity }} = {{ item.subtotal }} kr
          </li>
        </ul>
        <label>
          Fraktalternativ
          <template v-if="shopStore.shippingOptions.length">
            <select v-model="selectedShippingId">
              <option v-for="option in shopStore.shippingOptions" :key="option.id" :value="option.id">
                {{ option.name }} ({{ option.price }} kr)
              </option>
            </select>
          </template>
          <template v-else>
            <span>0 kr</span>
          </template>
        </label>
        <p>Delsumma: {{ shopStore.cartSubtotal }} kr</p>
        <p>Frakt: {{ shippingDisplay }} kr</p>
        <p class="total">Totalt: {{ cartTotalWithShipping }} kr</p>
      </div>
    </div>

    <p v-if="orderPlaced" class="success">Tack för din beställning! Du skickas tillbaka till butiken.</p>
  </section>
</template>

<style scoped lang="scss">
.hero-header {
  margin-bottom: 1rem;
  background: linear-gradient(145deg, var(--theme-hero-top) 0%, var(--theme-hero-mid) 100%);

  h2 {
    margin: 0 0 0.35rem;
    line-height: 1.2;
  }
}

.hero-kicker {
  margin: 0 0 0.7rem;
  color: $color-text-soft;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.76rem;
  font-weight: 600;
}

.hero-lead {
  margin: 0;
  color: $color-text-soft;
  max-width: 62ch;
}

.success {
  margin-top: 1rem;
  font-weight: 700;
  color: $color-success;
}
</style>