<script setup lang="ts">
import { useShopStore } from '../stores/shop'

const shopStore = useShopStore()
const hasProductImage = (imageUrl: string) => imageUrl.trim().length > 0

const decreaseCartItem = (productId: number, currentQuantity: number) => {
  shopStore.updateCartItem(productId, Math.max(1, currentQuantity - 1))
}

const increaseCartItem = (productId: number, currentQuantity: number) => {
  shopStore.updateCartItem(productId, currentQuantity + 1)
}
</script>

<template>
  <section class="cart-page">
    <header class="cart-header card">
      <p v-if="shopStore.settings.cartHeroKicker" class="cart-kicker">{{ shopStore.settings.cartHeroKicker }}</p>
      <h2 v-if="shopStore.settings.cartHeroTitle">{{ shopStore.settings.cartHeroTitle }}</h2>
      <p v-if="shopStore.settings.cartHeroLead">{{ shopStore.settings.cartHeroLead }}</p>
    </header>

    <div v-if="shopStore.cartItems.length === 0" class="cart-empty card">
      <h3>Varukorgen är tom</h3>
      <p>Lägg till produkter i butiken för att komma igång.</p>
      <RouterLink class="button-link" to="/shop">Till butiken</RouterLink>
    </div>

    <div v-else class="cart-layout">
      <div class="cart-list">
        <article v-for="item in shopStore.cartItems" :key="item.product.id" class="cart-item card">
          <div v-if="!hasProductImage(item.product.imageUrl)" class="cart-image cart-image-missing" role="img"
            aria-label="Bild saknas">
            Bild saknas
          </div>
          <img v-else :src="item.product.imageUrl" :alt="item.product.name" class="cart-image" loading="lazy" />

          <div class="cart-details">
            <h3>{{ item.product.name }}</h3>
            <p>{{ item.product.price }} kr/st</p>
          </div>

          <div class="cart-controls">
            <label class="cart-quantity">
              Antal
              <div class="quantity-stepper">
                <button type="button" class="step-button"
                  @click="decreaseCartItem(item.product.id, item.quantity)">−</button>
                <input type="number" min="1" :value="item.quantity"
                  @input="shopStore.updateCartItem(item.product.id, Number(($event.target as HTMLInputElement).value))" />
                <button type="button" class="step-button"
                  @click="increaseCartItem(item.product.id, item.quantity)">+</button>
              </div>
            </label>

            <p class="cart-subtotal">{{ item.subtotal }} kr</p>
            <button class="button-muted" @click="shopStore.removeFromCart(item.product.id)">Ta bort</button>
          </div>
        </article>
      </div>

      <aside class="summary card">
        <h3>Sammanfattning</h3>
        <div class="summary-row">
          <span>Delsumma</span>
          <strong>{{ shopStore.cartSubtotal }} kr</strong>
        </div>
        <div class="summary-row">
          <span>Frakt</span>
          <strong>{{ shopStore.shippingFee }} kr</strong>
        </div>
        <div class="summary-row total-row">
          <span>Totalt</span>
          <strong>{{ shopStore.cartTotal }} kr</strong>
        </div>
        <RouterLink class="button-link checkout-link" to="/checkout">Till kassan</RouterLink>
      </aside>
    </div>
  </section>
</template>

<style scoped lang="scss">
.cart-page {
  display: grid;
  gap: 1rem;
}

.cart-header {
  background: linear-gradient(145deg, var(--theme-hero-top) 0%, var(--theme-hero-mid) 100%);

  h2 {
    margin: 0.25rem 0 0.45rem;
  }

  p {
    margin: 0;
    color: $color-text-soft;
  }
}

.cart-kicker {
  margin: 0;
  color: $color-text-soft;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.76rem;
  font-weight: 600;
}

.cart-empty {
  display: grid;
  gap: 0.7rem;
  justify-items: start;

  h3,
  p {
    margin: 0;
  }
}

.cart-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 1rem;
  align-items: start;
}

.cart-list {
  display: grid;
  gap: 1rem;
}

.cart-item {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr) minmax(290px, auto);
  gap: 0.8rem;
  align-items: center;
  transition: border-color 0.18s ease, transform 0.18s ease;

  &:hover {
    border-color: rgba($color-brand, 0.35);
    transform: translateY(-1px);
  }
}

.cart-image {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: $radius-sm;
  border: 1px solid rgba($color-brand, 0.2);
}

.cart-image-missing {
  display: grid;
  place-items: center;
  font-size: 0.78rem;
  font-weight: 700;
  text-align: center;
  color: var(--theme-accent);
  background: linear-gradient(145deg, var(--theme-hero-top) 0%, var(--theme-hero-mid) 100%);
  border-color: var(--theme-accent-border);
  padding: 0.3rem;
}

.summary {
  position: sticky;
  top: 1rem;
  display: grid;
  gap: 0.65rem;

  h3 {
    margin: 0 0 0.15rem;
  }
}

.cart-details {

  h3,
  p {
    margin: 0;
  }

  p {
    margin-top: 0.35rem;
    color: $color-text-soft;
  }
}

.cart-controls {
  display: grid;
  grid-template-columns: minmax(140px, 160px) auto;
  grid-template-areas:
    'quantity remove'
    'subtotal subtotal';
  align-items: end;
  gap: 0.65rem;
  justify-content: end;
}

.cart-quantity {
  grid-area: quantity;
  margin: 0;
  display: grid;
  gap: 0.35rem;

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

.cart-subtotal {
  grid-area: subtotal;
  margin: 0;
  font-weight: 700;
  white-space: nowrap;
  justify-self: end;
}

.cart-controls .button-muted {
  grid-area: remove;
  justify-self: end;
  color: var(--theme-button-muted-text) !important;
  border-color: transparent !important;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid $color-border;
  padding-bottom: 0.5rem;
}

.total-row {
  border-bottom: none;
  padding-bottom: 0.1rem;
}

.checkout-link {
  width: 100%;
  text-align: center;
}

@include mobile-down {
  .cart-layout {
    grid-template-columns: 1fr;
  }

  .summary {
    position: static;
  }

  .cart-item {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .cart-controls {
    grid-template-columns: 1fr;
    grid-template-areas:
      'quantity'
      'subtotal'
      'remove';
    justify-content: start;
  }

  .cart-subtotal {
    justify-self: start;
  }

}
</style>