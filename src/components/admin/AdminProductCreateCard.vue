<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useShopStore } from '../../stores/shop'

const shopStore = useShopStore()
const isExpanded = ref(false)

const productForm = reactive({
  name: '',
  description: '',
  price: 0,
  imageUrl: '',
  groupId: '' as number | '',
})

const addProduct = () => {
  shopStore.addProduct({
    name: productForm.name,
    description: productForm.description,
    price: Number(productForm.price),
    imageUrl: productForm.imageUrl,
    groupId: productForm.groupId || null,
  })

  productForm.name = ''
  productForm.description = ''
  productForm.price = 0
  productForm.imageUrl = ''
  productForm.groupId = ''
  isExpanded.value = false
}

const toggleForm = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div class="card">
    <div class="create-header">
      <h3>Lägg till produkt</h3>
      <button type="button" class="button-muted" @click="toggleForm">
        {{ isExpanded ? 'Stäng' : '+ Lägg till produkt' }}
      </button>
    </div>

    <form v-if="isExpanded" @submit.prevent="addProduct">
      <label>
        Produktnamn
        <input v-model="productForm.name" required type="text" />
      </label>

      <label>
        Beskrivning
        <textarea v-model="productForm.description" required rows="3" />
      </label>

      <label>
        Pris (kr)
        <input v-model.number="productForm.price" min="1" required type="number" />
      </label>

      <label>
        Bild-URL
        <input v-model="productForm.imageUrl" placeholder="https://..." type="text" />
      </label>

      <label>
        Grupp
        <select v-model="productForm.groupId">
          <option value="">Ingen grupp</option>
          <option v-for="group in shopStore.groups" :key="group.id" :value="group.id">
            {{ group.name }}
          </option>
        </select>
      </label>

      <button type="submit" class="button-primary">Lägg till</button>
    </form>
  </div>
</template>

<style scoped lang="scss">
@import '../../styles/_variables.scss';

/* Ensure product inputs/select/textarea follow global theme (match checkout) */
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

.create-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.35rem;

  h3 {
    margin: 0;
  }
}
</style>
