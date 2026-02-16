<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useShopStore } from '../../stores/shop'
import type { ProductGroup, Product } from '../../stores/shop'

const shopStore = useShopStore()
const hasProductImage = (imageUrl: string) => imageUrl.trim().length > 0

const editingProductId = ref<number | null>(null)
const productPendingDeleteId = ref<number | null>(null)
const editForm = reactive({
  name: '',
  description: '',
  price: 0,
  imageUrl: '',
  groupId: '' as number | '',
})

const startEditProduct = (productId: number) => {
  const product = shopStore.products.find((item: Product) => item.id === productId)

  if (!product) {
    return
  }

  editingProductId.value = productId
  editForm.name = product.name
  editForm.description = product.description
  editForm.price = product.price
  editForm.imageUrl = product.imageUrl
  editForm.groupId = product.groupId ?? ''
}

const cancelEditProduct = () => {
  editingProductId.value = null
}

const saveEditProduct = (productId: number) => {
  shopStore.updateProduct(productId, {
    name: editForm.name,
    description: editForm.description,
    price: Number(editForm.price),
    imageUrl: editForm.imageUrl,
    groupId: editForm.groupId || null,
  })

  editingProductId.value = null
}

const askDeleteProduct = (productId: number) => {
  productPendingDeleteId.value = productId
}

const closeDeleteModal = () => {
  productPendingDeleteId.value = null
}

const confirmDeleteProduct = () => {
  if (!productPendingDeleteId.value) {
    return
  }

  const productId = productPendingDeleteId.value

  shopStore.deleteProduct(productId)

  if (editingProductId.value === productId) {
    editingProductId.value = null
  }

  productPendingDeleteId.value = null
}

const getGroupName = (groupId: number | null) => {
  if (!groupId) {
    return 'Ingen grupp'
  }

  const group = shopStore.groups.find((item: ProductGroup) => item.id === groupId)
  return group?.name ?? 'Ingen grupp'
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && productPendingDeleteId.value) {
    closeDeleteModal()
  }
}

const setBodyScrollLock = (isLocked: boolean) => {
  document.body.style.overflow = isLocked ? 'hidden' : ''
}

watch(productPendingDeleteId, (productId) => {
  setBodyScrollLock(Boolean(productId))
})

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  setBodyScrollLock(false)
})
</script>

<template>
  <div class="card">
    <h3>Alla produkter</h3>

    <p v-if="shopStore.products.length === 0">Inga produkter ännu.</p>

    <div v-else class="admin-products-list">
      <div class="admin-products-head">
        <span>Produkt</span>
        <span>Grupp</span>
        <span>Pris</span>
        <span>Åtgärder</span>
      </div>

      <article v-for="product in shopStore.products" :key="product.id" class="admin-product-row">
        <form v-if="editingProductId === product.id" class="admin-product-edit-row"
          @submit.prevent="saveEditProduct(product.id)">
          <div class="admin-edit-grid">
            <label>
              Produktnamn
              <input v-model="editForm.name" required type="text" />
            </label>

            <label>
              Grupp
              <select v-model="editForm.groupId">
                <option value="">Ingen grupp</option>
                <option v-for="group in shopStore.groups" :key="group.id" :value="group.id">
                  {{ group.name }}
                </option>
              </select>
            </label>

            <label>
              Pris (kr)
              <input v-model.number="editForm.price" min="1" required type="number" />
            </label>

            <label>
              Bild-URL
              <input v-model="editForm.imageUrl" type="text" />
            </label>

            <label class="admin-edit-description">
              Beskrivning
              <textarea v-model="editForm.description" required rows="2" />
            </label>
          </div>

          <div class="row-actions">
            <button type="submit">Spara</button>
            <button type="button" @click="cancelEditProduct">Avbryt</button>
          </div>
        </form>

        <template v-else>
          <div class="admin-product-main">
            <div v-if="!hasProductImage(product.imageUrl)" class="admin-product-thumb admin-product-thumb-missing"
              role="img" aria-label="Bild saknas">
              Bild saknas
            </div>
            <img v-else :src="product.imageUrl" :alt="product.name" class="admin-product-thumb" />
            <div>
              <h4>{{ product.name }}</h4>
              <p>{{ product.description }}</p>
            </div>
          </div>

          <div>
            <span class="group-badge">{{ getGroupName(product.groupId) }}</span>
          </div>

          <p class="price">{{ product.price }} kr</p>

          <div class="row-actions admin-row-actions">
            <button type="button" @click="startEditProduct(product.id)">Edit</button>
            <button type="button" class="button-danger" @click="askDeleteProduct(product.id)">
              Delete
            </button>
          </div>
        </template>
      </article>
    </div>

    <Transition name="modal-fade">
      <div v-if="productPendingDeleteId" class="modal-backdrop" @click.self="closeDeleteModal">
        <div class="modal-card">
          <h3>Ta bort produkt</h3>
          <p>Är du säker på att du vill ta bort produkten?</p>

          <div class="row-actions">
            <button type="button" class="button-muted" @click="closeDeleteModal">Avbryt</button>
            <button type="button" class="button-danger" @click="confirmDeleteProduct">Ta bort</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.admin-products-list {
  display: grid;
  gap: 0.55rem;
}

.admin-products-head,
.admin-product-row {
  display: grid;
  grid-template-columns: minmax(260px, 2fr) minmax(120px, 1fr) 90px 170px;
  gap: 0.75rem;
  align-items: center;
}

.admin-products-head {
  font-size: 0.85rem;
  font-weight: 700;
  color: $color-text-soft;
  padding: 0 0.35rem;
}

.admin-product-row {
  @include card-surface;
  padding: 0.75rem;
}

.admin-product-main {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.65rem;
  align-items: center;

  h4 {
    margin: 0 0 0.35rem;
  }

  p {
    margin: 0.2rem 0;
  }
}

.admin-product-thumb {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid $color-border;
}

.admin-product-thumb-missing {
  display: grid;
  place-items: center;
  font-size: 0.66rem;
  font-weight: 700;
  text-align: center;
  color: var(--theme-accent);
  background: linear-gradient(145deg, var(--theme-hero-top) 0%, var(--theme-hero-mid) 100%);
  border-color: var(--theme-accent-border);
  padding: 0.2rem;
}

.admin-row-actions {
  margin-top: 0;
}

.admin-product-edit-row {
  grid-column: 1 / -1;
}

.admin-edit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 0.6rem;

  label {
    margin-bottom: 0;
  }
}

.admin-edit-description {
  grid-column: 1 / -1;
}

.group-badge {
  display: inline-block;
  background: $color-border;
  color: $color-text-strong;
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  font-size: 0.85rem;
  margin: 0.2rem 0;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.55);
  display: grid;
  place-items: center;
  z-index: 20;
  padding: 1rem;
}

.modal-card {
  width: min(420px, 100%);
  background: $color-surface;
  border-radius: $radius-lg;
  padding: 1rem;
  border: 1px solid $color-border;

  h3 {
    margin-top: 0;
  }
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-active .modal-card,
.modal-fade-leave-active .modal-card {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-card,
.modal-fade-leave-to .modal-card {
  opacity: 0;
  transform: translateY(6px) scale(0.98);
}

@include mobile-down {
  .admin-products-head {
    display: none;
  }

  .admin-product-row {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .admin-edit-grid {
    grid-template-columns: 1fr;
  }
}
</style>
