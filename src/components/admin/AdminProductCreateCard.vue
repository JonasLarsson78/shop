<script setup lang="ts">
import { reactive } from 'vue'
import { useShopStore } from '../../stores/shop'

const shopStore = useShopStore()

const productForm = reactive({
  name: '',
  description: '',
  price: 0,
  imageUrl: '',
  groupId: '',
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
}
</script>

<template>
  <form class="card" @submit.prevent="addProduct">
    <h3>Lägg till produkt</h3>

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
      <input v-model="productForm.imageUrl" placeholder="/products/min-bild.svg" type="text" />
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

    <button type="submit">Lägg till</button>
  </form>
</template>
