<script setup lang="ts">
import { useShopStore } from '../stores/shop'

const shopStore = useShopStore()
</script>

<template>
  <section>
    <h2>Varukorg</h2>

    <p v-if="shopStore.cartItems.length === 0">Din varukorg är tom.</p>

    <div v-else class="cart-list">
      <article v-for="item in shopStore.cartItems" :key="item.product.id" class="cart-item">
        <div>
          <h3>{{ item.product.name }}</h3>
          <p>{{ item.product.price }} kr/st</p>
        </div>

        <label>
          Antal
          <input
            type="number"
            min="1"
            :value="item.quantity"
            @input="shopStore.updateCartItem(item.product.id, Number(($event.target as HTMLInputElement).value))"
          />
        </label>

        <p>{{ item.subtotal }} kr</p>
        <button @click="shopStore.removeFromCart(item.product.id)">Ta bort</button>
      </article>

      <div class="summary">
        <p>Delsumma: {{ shopStore.cartSubtotal }} kr</p>
        <p>Frakt: {{ shopStore.shippingFee }} kr</p>
        <p class="total">Totalt: {{ shopStore.cartTotal }} kr</p>
        <RouterLink class="button-link" to="/checkout">Till kassan</RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.cart-list {
  display: grid;
  gap: 1rem;
}

.cart-item {
  display: grid;
  grid-template-columns: 1.5fr 1fr 0.6fr 0.8fr;
  gap: 0.75rem;
  align-items: end;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  padding: 1rem;
}

.summary {
  border-top: 1px solid $color-border;
  padding-top: 1rem;
}

@include mobile-down {
  .cart-item {
    grid-template-columns: 1fr;
    align-items: start;
  }
}
</style>