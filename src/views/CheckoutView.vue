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
    <h2>Kassa</h2>

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
.success {
  margin-top: 1rem;
  font-weight: 700;
  color: $color-success;
}
</style>