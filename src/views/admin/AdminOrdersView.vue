<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

type Order = {
  id: number
  customerName: string
  email: string
  address?: string
  zip?: string
  city?: string
  phone?: string
  total: number
  status: string
  createdAt: string
  items?: Array<{
    productId?: number
    name?: string
    quantity?: number
    price?: number
    subtotal?: number
  }>
  shippingName?: string
  shipping_name?: string
  shippingOptionName?: string
  shipping_option_name?: string
  shippingOptionId?: number
  shipping_option_id?: number
  shippingPrice?: number
  shipping_price?: number
  shippingCost?: number
  shipping_cost?: number
  shippingOptionPrice?: number
}

const orders = ref<Order[]>([])
const loading = ref(false)
const error = ref('')
const expandedOrderIds = ref<number[]>([])

const fetchOrders = async () => {
  loading.value = true
  error.value = ''
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch('/api/orders', { signal: controller.signal })
    clearTimeout(timeout)
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.error('Orders API error', res.status, body)
      throw new Error(body || `Orders API returned ${res.status}`)
    }
    orders.value = await res.json()
  } catch (err: any) {
    console.error('Failed to fetch orders:', err)
    if (err?.name === 'AbortError') {
      error.value = 'Begäran timeout - kontrollera att API-servern körs.'
    } else {
      error.value = err?.message || String(err)
    }
  } finally {
    clearTimeout(timeout)
    loading.value = false
  }
}

const setStatus = async (orderId: number, status: string) => {
  try {
    const res = await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: orderId, status }),
    })
    if (!res.ok) throw new Error('Failed to update order')
    await fetchOrders()
  } catch (err: any) {
    error.value = err?.message || String(err)
  }
}

const toggleDetails = (orderId: number) => {
  const idx = expandedOrderIds.value.indexOf(orderId)
  if (idx === -1) expandedOrderIds.value.push(orderId)
  else expandedOrderIds.value.splice(idx, 1)
}

const sortedOrders = computed(() => {
  return [...orders.value].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1
    if (b.status === 'pending' && a.status !== 'pending') return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
})

// status text is shown as-is; 'Ny' tag is displayed in the front column for pending orders

onMounted(fetchOrders)
</script>

<template>
  <section>
    <div class="admin-layout">
      <div class="card">
        <h3>Ordrar</h3>

        <div v-if="loading">Laddar…</div>
        <div v-if="error" class="error">{{ error }}</div>

        <table v-if="!loading && orders.length">
          <thead>
            <tr>
              <th></th>
              <th>Id</th>
              <th>Kund</th>
              <th>Summa</th>
              <th>Status</th>
              <th>Skapat</th>
              <th>Åtgärder</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="o in sortedOrders" :key="o.id">
              <tr :class="{ 'is-new': o.status === 'pending' }">
                <td class="order-tag">
                  <span v-if="o.status === 'pending'" class="tag new">Ny</span>
                </td>
                <td>{{ o.id }}</td>
                <td>{{ o.customerName }}</td>
                <td>{{ o.total.toFixed(2) }} kr</td>
                <td>{{ o.status }}</td>
                <td>{{ new Date(o.createdAt).toLocaleString() }}</td>
                <td>
                  <button type="button" @click="setStatus(o.id, 'processing')">
                    Processing
                  </button>
                  <button type="button" @click="setStatus(o.id, 'shipped')">
                    Shipped
                  </button>
                  <button type="button" @click="setStatus(o.id, 'cancelled')">
                    Cancel
                  </button>
                  <button type="button" @click="toggleDetails(o.id)">
                    {{ expandedOrderIds.includes(o.id) ? 'Dölj' : 'Visa' }}
                  </button>
                </td>
              </tr>

              <tr v-if="expandedOrderIds.includes(o.id)">
                <td colspan="7">
                  <div class="order-items">
                    <h4>Produkter</h4>
                    <ul>
                      <li v-for="(it, idx) in o.items || []" :key="idx">
                        {{ it.name || '#' + (it.productId || '?') }} x
                        {{ it.quantity || 0 }} —
                        {{
                          (
                            it.subtotal ||
                            (it.price && it.quantity
                              ? it.price * it.quantity
                              : 0)
                          ).toFixed(2)
                        }}
                        kr
                      </li>
                    </ul>

                    <h4>Leverans</h4>
                    <div>
                      <div><strong>E-post:</strong> {{ o.email || '-' }}</div>
                      <div><strong>Adress:</strong> {{ o.address || '-' }}</div>
                      <div><strong>Postnummer:</strong> {{ o.zip || '-' }}</div>
                      <div><strong>Stad:</strong> {{ o.city || '-' }}</div>
                      <div><strong>Telefon:</strong> {{ o.phone || '-' }}</div>
                      <div class="shipping-line">
                        <strong>Frakt:</strong>
                        <span class="shipping-name">{{
                          o.shippingName ||
                          o.shipping_name ||
                          o.shippingOptionName ||
                          o.shipping_option_name ||
                          (o.shippingOptionId
                            ? '#' + o.shippingOptionId
                            : o.shipping_option_id
                              ? '#' + o.shipping_option_id
                              : '-')
                        }}</span>
                        <span class="shipping-price"
                          >{{ o.shippingOptionPrice || 0 }} kr</span
                        >
                      </div>
                    </div>
                  </div>
                </td>
              </tr>

              <tr class="order-sep">
                <td colspan="7" aria-hidden="true"></td>
              </tr>
            </template>
          </tbody>
        </table>

        <div v-if="!loading && !orders.length">Inga ordrar ännu.</div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.card {
  padding: 1rem;
}

table {
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 0.4rem 0.6rem;
    border-bottom: 1px solid #e6e6e6;
    text-align: left;
  }

  button {
    margin-right: 0.35rem;
  }

  .order-sep td {
    background-color: #f6f9fc;
    height: 8px;
    padding: 0;
    border-bottom: none;
  }

  tr.is-new td {
    background-color: #fff9e6;
    font-weight: 600;
  }

  .order-tag {
    width: 3.5rem;
    padding: 0 0.25rem;
  }

  .tag {
    display: inline-block;
    padding: 0.15rem 0.5rem;
    border-radius: 999px;
    font-size: 0.85rem;
  }

  .tag.new {
    background: #ffefc2;
    color: #8a6d00;
    border: 1px solid #ffe8a8;
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
    margin-left: 6px;
  }

  .shipping-price {
    margin-left: auto;
    font-weight: 800;
    color: $color-text;
  }
}

.error {
  color: #b00020;
}
</style>
