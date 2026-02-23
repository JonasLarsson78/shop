<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter, useRoute } from 'vue-router'
import { useShopStore } from '../stores/shop'
import BaseButton from '../components/ui/BaseButton.vue'

const shopStore = useShopStore()
const router = useRouter()
const route = useRoute()
// bind to store selectedShippingId so cart and checkout share the selection
const selectedShippingId = computed<number | null>({
  get: () => shopStore.selectedShippingId,
  set: (v) => shopStore.setSelectedShippingId(v as number | null),
})

const authStore = useAuthStore()

onMounted(() => {
  if (!shopStore.shippingOptions.length) {
    shopStore.fetchShippingOptions()
  }

  const shippingId = Number(route.query.shipping)
  if (
    shippingId &&
    shopStore.shippingOptions.some((opt) => opt.id === shippingId)
  ) {
    shopStore.setSelectedShippingId(shippingId)
  } else if (
    shopStore.selectedShippingId === null &&
    shopStore.shippingOptions.length > 0
  ) {
    shopStore.setSelectedShippingId(shopStore.shippingOptions[0]?.id ?? null)
  }

  // Prefill checkout form from logged-in user
  if (authStore.state.user) {
    form.name = authStore.state.user.name ?? ''
    form.email = authStore.state.user.email ?? ''
    form.address = authStore.state.user.address ?? ''
    form.phone = authStore.state.user.phone ?? ''
    form.zip = authStore.state.user.zip ?? ''
    form.city = authStore.state.user.city ?? ''
  }
})

const selectedShipping = computed(() =>
  shopStore.shippingOptions.find((opt) => opt.id === selectedShippingId.value)
)

const vatRate = computed(
  () =>
    ((shopStore.settings && (shopStore.settings as any).vatPercent) ?? 25) / 100
)

const cartTotalWithShipping = computed(() => {
  const shipping = selectedShipping.value?.price ?? 0
  return shopStore.cartSubtotal + shipping
})

// VAT is included in the product prices. Calculate the VAT portion included
const vatAmount = computed(() =>
  Math.round(
    shopStore.cartSubtotal - shopStore.cartSubtotal / (1 + vatRate.value)
  )
)

const shippingDisplay = computed(() => {
  if (!shopStore.shippingOptions.length) return 0
  return selectedShipping.value?.price ?? 0
})

const form = reactive({
  name: '',
  email: '',
  address: '',
  phone: '',
  zip: '',
  city: '',
})

const orderPlaced = ref(false)
const placing = ref(false)
const placeError = ref('')

const placeOrder = async () => {
  placeError.value = ''
  if (shopStore.cartItems.length === 0) return

  // basic validation
  if (!form.name || !form.email || !form.address) {
    placeError.value = 'Fyll i namn, e-post och adress.'
    return
  }

  placing.value = true

  const items = shopStore.cartItems.map((i) => ({
    productId: i.product.id,
    name: i.product.name,
    quantity: i.quantity,
    price: i.product.price,
    subtotal: i.subtotal,
  }))

  const payload = {
    customerName: form.name,
    email: form.email,
    userId: authStore.state.user?.id ?? null,
    address: form.address,
    phone: form.phone,
    zip: form.zip,
    city: form.city,
    items,
    total: cartTotalWithShipping.value,
    shippingOptionId: selectedShippingId.value,
  }

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new Error(body?.error || `Order request failed: ${res.status}`)
    }

    // success
    orderPlaced.value = true
    shopStore.clearCart()

    setTimeout(() => {
      router.push('/')
    }, 1500)
  } catch (err: any) {
    placeError.value = err?.message || String(err)
  } finally {
    placing.value = false
  }
}
</script>

<template>
  <section>
    <div class="hero-header card">
      <p v-if="shopStore.settings.checkoutHeroKicker" class="hero-kicker">
        {{ shopStore.settings.checkoutHeroKicker }}
      </p>
      <h2 v-if="shopStore.settings.checkoutHeroTitle">
        {{ shopStore.settings.checkoutHeroTitle }}
      </h2>
      <p v-if="shopStore.settings.checkoutHeroLead" class="hero-lead">
        {{ shopStore.settings.checkoutHeroLead }}
      </p>
    </div>

    <p v-if="shopStore.cartItems.length === 0 && !orderPlaced">
      Varukorgen är tom. Lägg till produkter först.
    </p>

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

        <label>
          Telefon
          <input v-model="form.phone" type="tel" />
        </label>

        <label>
          Postnummer
          <input v-model="form.zip" type="text" />
        </label>

        <label>
          Stad
          <input v-model="form.city" type="text" />
        </label>

        <BaseButton variant="primary" type="submit">Bekräfta köp</BaseButton>
      </form>

      <div class="card">
        <h3>Orderöversikt</h3>
        <ul>
          <li v-for="item in shopStore.cartItems" :key="item.product.id">
            {{ item.product.name }} x {{ item.quantity }} =
            {{ item.subtotal }} kr
          </li>
        </ul>
        <label>
          Fraktalternativ
          <template v-if="shopStore.shippingOptions.length">
            <select v-model="selectedShippingId">
              <option
                v-for="option in shopStore.shippingOptions"
                :key="option.id"
                :value="option.id"
              >
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
        <p>
          Moms ({{ (shopStore.settings as any).vatPercent ?? 25 }}% ingår):
          {{ vatAmount }} kr
        </p>
        <p class="total">Totalt: {{ cartTotalWithShipping }} kr</p>
      </div>
    </div>

    <p v-if="orderPlaced" class="success">
      Tack för din beställning! Du skickas tillbaka till butiken.
    </p>
  </section>
</template>

<style scoped lang="scss">
.hero-header {
  margin-bottom: 1rem;
  background: linear-gradient(
    145deg,
    var(--theme-hero-top) 0%,
    var(--theme-hero-mid) 100%
  );

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

/* Ensure checkout inputs/select/textarea follow global theme */
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
  appearance: none;
}

.card {
  padding: 1rem;
}

/* Align BaseButton spacing */
.actions {
  margin-top: 0.6rem;
}

@media (max-width: $breakpoint-mobile) {
  .checkout-layout {
    grid-template-columns: 1fr;
  }
}
</style>
