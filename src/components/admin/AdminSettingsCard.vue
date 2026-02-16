<script setup lang="ts">
import { reactive } from 'vue'
import { useShopStore } from '../../stores/shop'

const shopStore = useShopStore()

const settingsForm = reactive({
  storeName: shopStore.settings.storeName,
  subName: shopStore.settings.subName,
  heroKicker: shopStore.settings.heroKicker,
  heroTitle: shopStore.settings.heroTitle,
  heroLead: shopStore.settings.heroLead,
  heroPoint1: shopStore.settings.heroPoint1,
  heroPoint2: shopStore.settings.heroPoint2,
  heroPoint3: shopStore.settings.heroPoint3,
  shippingCost: shopStore.settings.shippingCost,
  freeShippingThreshold: shopStore.settings.freeShippingThreshold,
})

const saveSettings = () => {
  shopStore.updateSettings({
    storeName: settingsForm.storeName,
    subName: settingsForm.subName,
    heroKicker: settingsForm.heroKicker,
    heroTitle: settingsForm.heroTitle,
    heroLead: settingsForm.heroLead,
    heroPoint1: settingsForm.heroPoint1,
    heroPoint2: settingsForm.heroPoint2,
    heroPoint3: settingsForm.heroPoint3,
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
      Hero: Rubrik
      <input v-model="settingsForm.heroTitle" type="text" />
    </label>

    <label>
      Hero: Kicker
      <input v-model="settingsForm.heroKicker" type="text" />
    </label>

    <label>
      Hero: Ingress
      <textarea v-model="settingsForm.heroLead" rows="3" />
    </label>

    <label>
      Hero: Punkt 1
      <input v-model="settingsForm.heroPoint1" type="text" />
    </label>

    <label>
      Hero: Punkt 2
      <input v-model="settingsForm.heroPoint2" type="text" />
    </label>

    <label>
      Hero: Punkt 3
      <input v-model="settingsForm.heroPoint3" type="text" />
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
