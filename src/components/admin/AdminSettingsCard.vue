<script setup lang="ts">
import { reactive } from 'vue'
import { useShopStore } from '../../stores/shop'

const shopStore = useShopStore()

const settingsForm = reactive({
  storeName: shopStore.settings.storeName,
  subName: shopStore.settings.subName,
  shippingCost: shopStore.settings.shippingCost,
  freeShippingThreshold: shopStore.settings.freeShippingThreshold,
})

const saveSettings = () => {
  shopStore.updateSettings({
    storeName: settingsForm.storeName,
    subName: settingsForm.subName,
    shippingCost: Number(settingsForm.shippingCost),
    freeShippingThreshold: Number(settingsForm.freeShippingThreshold),
  })
}
</script>

<template>
  <form class="card" @submit.prevent="saveSettings">
    <h3>Butiksinställningar</h3>

    <label>
      Butiksnamn
      <input v-model="settingsForm.storeName" required type="text" />
    </label>

    <label>
      Underrubrik
      <input v-model="settingsForm.subName" type="text" />
    </label>

    <label>
      Fraktkostnad (kr)
      <input v-model.number="settingsForm.shippingCost" min="0" required type="number" />
    </label>

    <label>
      Fri frakt över (kr)
      <input v-model.number="settingsForm.freeShippingThreshold" min="0" required type="number" />
    </label>

    <button type="submit">Spara inställningar</button>
  </form>
</template>
