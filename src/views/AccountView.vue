<template>
  <div class="view account-view">
    <div class="card">
      <h2>Dina uppgifter</h2>
      <div v-if="user">
        <form @submit.prevent="save" class="account-form">
          <div class="grid">
            <label class="field">
              <span class="label">E-post</span>
              <input v-model="form.email" type="email" required />
            </label>

            <label class="field">
              <span class="label">Namn</span>
              <input v-model="form.name" type="text" />
            </label>

            <label class="field full">
              <span class="label">Adress</span>
              <textarea v-model="form.address" rows="3" />
            </label>

            <label class="field">
              <span class="label">Telefon</span>
              <input v-model="form.phone" type="tel" />
            </label>

            <label class="field">
              <span class="label">Postnummer</span>
              <input v-model="form.zip" type="text" />
            </label>

            <label class="field">
              <span class="label">Stad</span>
              <input v-model="form.city" type="text" />
            </label>
          </div>

          <div class="actions">
            <BaseButton variant="primary" :type="'submit'" :disabled="loading">{{ loading ? 'Sparar…' : 'Spara' }}
            </BaseButton>
            <BaseButton variant="secondary" :type="'button'" @click="reset">Återställ</BaseButton>
          </div>

          <p class="error" v-if="error">{{ error }}</p>
          <p class="success" v-if="success">{{ success }}</p>
        </form>

        <div class="card orders-card" style="margin-top:1rem">
          <h3>Dina ordrar</h3>
          <div v-if="ordersLoading">Laddar ordrar…</div>
          <div v-if="ordersError" class="error">{{ ordersError }}</div>
          <table class="orders-table" v-if="!ordersLoading && orders.length">
            <thead>
              <tr>
                <th>Id</th>
                <th>Summa</th>
                <th>Status</th>
                <th>Skapat</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="o in orders" :key="o.id">
                <tr>
                  <td class="col-id">{{ o.id }}</td>
                  <td class="col-total">{{ (o.total).toFixed(2) }} kr</td>
                  <td class="col-status"><span class="status" :data-status="o.status">{{ o.status }}</span></td>
                  <td class="col-created">{{ new Date(o.createdAt).toLocaleString() }}</td>
                  <td class="col-details">
                    <button type="button" @click="toggleDetails(o.id)">{{ expandedOrderIds.includes(o.id) ? 'Dölj' :
                      'Visa' }}</button>
                  </td>
                </tr>

                <tr class="order-products" v-if="expandedOrderIds.includes(o.id)">
                  <td colspan="5">
                    <div class="products-list">
                      <h4>Produkter</h4>
                      <ul class="product-items">
                        <li v-for="(it, idx) in o.items || []" :key="idx" class="product-item">
                          <div class="pi-name">{{ it.name || ('#' + (it.productId || '?')) }}</div>
                          <div class="pi-qty">x{{ it.quantity || 0 }}</div>
                          <div class="pi-price">{{ ((it.subtotal || (it.price && it.quantity ? it.price * it.quantity :
                            0))).toFixed(2) }} kr</div>
                        </li>
                      </ul>
                      <div class="shipping-line" style="margin-top:8px">
                        <strong>Frakt:</strong>
                        <span class="shipping-name">{{ o.shippingName || o.shipping_name || o.shippingOptionName ||
                          o.shipping_option_name || (o.shippingOptionId ? ('#' + o.shippingOptionId) :
                            (o.shipping_option_id ? ('#' + o.shipping_option_id) : '-')) }}</span>
                        <span class="shipping-price">{{ (o.shippingOptionPrice || o.shippingPrice || o.shipping_price ||
                          o.shipping_cost || o.shippingCost || 0) }} kr</span>
                      </div>
                      <div class="products-total">
                        <span>Totalt:</span>
                        <span class="pt-price">{{ (o.total).toFixed(2) }} kr</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
          <div v-if="!ordersLoading && !orders.length">Inga ordrar ännu.</div>
        </div>
      </div>
      <div v-else class="not-logged">
        <p>Du är inte inloggad. Du omdirigeras till inloggning…</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import BaseButton from '../components/ui/BaseButton.vue'
import { onBeforeUnmount } from 'vue'

const auth = useAuthStore()
const user = computed(() => auth.state.user)

const form = reactive({
  email: '',
  name: '',
  address: '',
  phone: '',
  zip: '',
  city: '',
})

const loading = ref(false)
const error = ref('')
const success = ref('')

const expandedOrderIds = ref<number[]>([])

const toggleDetails = (orderId: number) => {
  const idx = expandedOrderIds.value.indexOf(orderId)
  if (idx === -1) expandedOrderIds.value.push(orderId)
  else expandedOrderIds.value.splice(idx, 1)
}

// orders
const orders = ref<any[]>([])
const ordersLoading = ref(false)
const ordersError = ref('')

let abortController: AbortController | null = null

const fetchMyOrders = async () => {
  ordersLoading.value = true
  ordersError.value = ''
  orders.value = []
  if (!auth.state.user?.id) {
    ordersLoading.value = false
    return
  }
  abortController?.abort()
  abortController = new AbortController()
  try {
    const q = new URLSearchParams()
    q.set('userId', String(auth.state.user.id))
    if (auth.state.user.email) q.set('email', auth.state.user.email)
    const res = await fetch(`/api/my-orders?${q.toString()}`, { signal: abortController.signal })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))

      throw new Error(body.error || `Failed to fetch orders: ${res.status}`)
    }
    orders.value = await res.json()

  } catch (err: any) {
    if (err?.name === 'AbortError') return
    ordersError.value = err?.message || String(err)
  } finally {
    ordersLoading.value = false
  }
}

onBeforeUnmount(() => {
  abortController?.abort()
})

function populate() {
  const u = auth.state.user
  if (!u) return
  form.email = u.email ?? ''
  form.name = u.name ?? ''
  form.address = u.address ?? ''
  form.phone = u.phone ?? ''
  form.zip = u.zip ?? ''
  form.city = u.city ?? ''
}

const router = useRouter()

// populate when user becomes available
watch(user, (u) => {
  if (u) populate()
})

onMounted(() => {
  if (!user.value) {
    // small delay so the message can show briefly before redirect
    setTimeout(() => router.push({ path: '/login' }), 300)
  } else {
    populate()
  }
  // fetch user's orders after populating
  fetchMyOrders()
})

function reset() {
  error.value = ''
  success.value = ''
  populate()
}

async function save() {
  error.value = ''
  success.value = ''
  if (!auth.state.user) {
    error.value = 'Ingen inloggad användare'
    return
  }
  loading.value = true
  try {
    const payload = {
      id: auth.state.user.id,
      email: form.email,
      name: form.name,
      address: form.address,
      phone: form.phone,
      zip: form.zip,
      city: form.city,
    }

    const res = await fetch('/api/auth/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || 'Uppdatering misslyckades')
    }

    const updated = await res.json()
    auth.setUser(updated)
    success.value = 'Uppgifterna sparades'
  } catch (err: any) {
    error.value = err?.message || 'Misslyckades att spara'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.account-view {
  padding: 2rem 1rem;
  display: flex;
  justify-content: center
}

.card {
  max-width: 820px;
  width: 100%;
  padding: 1.25rem;
  background: $color-surface;
  border-radius: $radius-md;
  box-shadow: 0 6px 18px rgba(16, 24, 40, 0.04);
  border: 1px solid $color-border
}

.card h2 {
  margin: 0 0 12px;
  font-size: 20px;
  color: $color-text-strong
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px
}

.field {
  display: flex;
  flex-direction: column
}

.field.full {
  grid-column: 1/-1
}

.label {
  font-size: 13px;
  color: $color-text-soft;
  margin-bottom: 6px
}

input,
textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid $color-border-input;
  border-radius: $radius-sm;
  background: var(--theme-page-top, $color-surface-muted);
  color: $color-text;
  font-size: 14px
}

textarea {
  resize: vertical
}

.account-form .field+.field {
  margin-top: 0
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
  justify-content: flex-end
}

.btn {
  padding: 9px 14px;
  border-radius: $radius-md;
  border: 0;
  background: $color-brand;
  color: $color-brand-contrast;
  cursor: pointer
}

.btn.secondary {
  background: $color-surface-muted;
  color: $color-text
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed
}

.error {
  color: $color-danger;
  margin-top: 10px
}

.success {
  color: $color-success;
  margin-top: 10px
}

.not-logged {
  color: $color-text-soft;
  padding: 12px;
  background: rgba(#eef4ff, 0.6);
  border-radius: 6px
}

/* Orders list styles */
.orders-card {
  padding: 0.75rem 1rem 1rem 1rem;
}

.orders-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 8px;
  margin-top: 0.6rem;
}

.orders-table thead th {
  text-align: left;
  font-weight: 600;
  padding: 0.4rem 0.6rem;
  color: $color-text-soft;
}

.orders-table tbody tr {
  background: $color-surface;
  box-shadow: 0 1px 0 rgba(16, 24, 40, 0.03);
}

.orders-table td {
  padding: 0.6rem;
  border: none;
}

.orders-table .col-id {
  width: 4rem;
  font-weight: 700
}

.orders-table .col-total {
  width: 8rem
}

.orders-table .col-status {
  width: 8rem
}

.orders-table .col-created {
  width: 12rem
}

.status {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.85rem;
  text-transform: capitalize;
  background: #eef2ff;
  color: #1f3b8a;
}

.status[data-status="pending"] {
  background: #fff8e6;
  color: #8a6d00
}

.status[data-status="processing"] {
  background: #eef2ff;
  color: #0b5cff
}

.status[data-status="shipped"] {
  background: #ecfdf5;
  color: #056a38
}

.status[data-status="cancelled"] {
  background: #fff0f0;
  color: #8a1f1f
}

details summary {
  cursor: pointer;
  font-weight: 600;
}

/* Product list inside account orders */
.products-list {
  margin-top: 0.6rem;
}

.product-items {
  list-style: none;
  margin: 0;
  padding: 0;
}

.product-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(#eef4ff, 0.02);
  margin-bottom: 8px;
}

.pi-name {
  flex: 1 1 auto;
  font-weight: 600;
}

.pi-qty {
  flex: 0 0 auto;
  color: $color-text-soft;
  margin-left: 8px;
}

.pi-price {
  flex: 0 0 90px;
  text-align: right;
  font-weight: 700;
}

.shipping-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  color: $color-text;
}

.shipping-name {
  font-weight: 600;
  color: $color-text-strong;
}

.shipping-price {
  margin-left: auto;
  font-weight: 800;
}

.products-total {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
  align-items: baseline;
}

.products-total .pt-price {
  font-weight: 800;
}

ul {
  margin: 0.5rem 0 0 0;
  padding-left: 1.2rem
}


@media (max-width:$breakpoint-mobile) {
  .grid {
    grid-template-columns: 1fr
  }

  .card {
    padding: 1rem
  }

  .actions {
    justify-content: stretch
  }
}
</style>
