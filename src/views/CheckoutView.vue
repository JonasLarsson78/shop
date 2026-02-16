<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useShopStore } from '../stores/shop'

const shopStore = useShopStore()
const router = useRouter()

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
      <p v-if="shopStore.settings.checkoutHeroKicker" class="hero-kicker">{{ shopStore.settings.checkoutHeroKicker }}</p>
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
        <p>Delsumma: {{ shopStore.cartSubtotal }} kr</p>
        <p>Frakt: {{ shopStore.shippingFee }} kr</p>
        <p class="total">Totalt: {{ shopStore.cartTotal }} kr</p>
      </div>
    </div>

    <p v-if="orderPlaced" class="success">Tack för din beställning! Du skickas tillbaka till butiken.</p>
  </section>
</template>

<style scoped lang="scss">
.hero-header {
  margin-bottom: 1rem;
  background: linear-gradient(145deg, rgba($color-brand, 0.09) 0%, rgba($color-muted, 0.14) 100%);

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